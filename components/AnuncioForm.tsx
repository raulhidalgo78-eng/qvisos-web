'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import RobustMapPicker from '@/components/RobustMapPicker';
import { updateAd, createAd } from '@/app/actions/ad-actions';
import { checkQrCategory } from '@/app/actions/check-qr';

interface AnuncioFormProps {
    initialData?: any;
}

export default function AnuncioForm({ initialData }: AnuncioFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // --- ESTADOS CRÍTICOS (Loading/Error/Auth) ---
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);



    // --- PARÁMETROS URL ---
    const urlCode = searchParams.get('code');
    const urlTipo = searchParams.get('tipo');

    // --- ESTADOS DEL FORMULARIO ---
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Inicialización de campos (con defaults seguros)
    const [qrCodeInput, setQrCodeInput] = useState(initialData?.qr_code || urlCode || '');
    const [category, setCategory] = useState(initialData?.category || '');
    const [operacion, setOperacion] = useState(initialData?.features?.operacion || 'Venta');
    const [moneda, setMoneda] = useState(initialData?.features?.moneda || 'CLP');
    const [description, setDescription] = useState(initialData?.description || '');
    const [extraNotes, setExtraNotes] = useState(initialData?.features?.extraNotes || '');
    const [aiTone, setAiTone] = useState('random');
    const [isGenerating, setIsGenerating] = useState(false);

    // Ubicación
    const [lat, setLat] = useState<number | null>(initialData?.features?.latitude ? parseFloat(initialData.features.latitude) : null);
    const [lng, setLng] = useState<number | null>(initialData?.features?.longitude ? parseFloat(initialData.features.longitude) : null);

    // Categoría detectada del QR
    const [qrCategory, setQrCategory] = useState<string | null>(null);

    // 1. EFECTO DE INICIALIZACIÓN (AUTH + PARAMS)
    useEffect(() => {
        if (initialData) {
            setLoading(false);
            return;
        }

        const init = async () => {
            try {
                // A) Verificar Auth
                const supabase = createClient();
                const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

                if (authError || !currentUser) {
                    router.push('/login?message=Debes iniciar sesión para publicar');
                    return;
                }
                setUser(currentUser);

                // B) Parsear Tipo desde URL si existe
                if (urlTipo) {
                    if (urlTipo === 'auto') setCategory('autos');
                    else if (urlTipo.includes('propiedad')) {
                        setCategory('inmuebles');
                        setOperacion(urlTipo.includes('arriendo') ? 'Arriendo' : 'Venta');
                    } else {
                        setCategory('otros');
                    }
                }
            } catch (err) {
                console.error("Error inicializando:", err);
                setError("Ocurrió un error de conexión al cargar el formulario.");
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [initialData, urlTipo, router]);

    // 2. EFECTO DE VALIDACIÓN QR (SEPARADO Y SEGURO)
    useEffect(() => {
        if (initialData) return;
        if (!qrCodeInput || qrCodeInput.length < 3) return;

        const validateQr = async () => {
            try {
                // Validar usando la acción importada estáticamente
                const cat = await checkQrCategory(qrCodeInput);

                if (cat) {
                    setQrCategory(cat);
                    // Autoseleccionar categoría si el QR está "hardcoded" a un tipo
                    // Autoseleccionar categoría si el QR está "hardcoded" a un tipo
                    if (!category) { // Solo si el usuario no ha elegido ya
                        if (cat === 'venta_auto') {
                            setCategory('autos');
                        } else if (cat.includes('propiedad')) {
                            setCategory('inmuebles');
                        } else {
                            // Si detectamos categoría pero no es una de las principales, sugerimos 'otros'
                            setCategory('otros');
                        }
                    }
                }
            } catch (err) {
                console.error("Error background validando QR:", err);
                // No bloqueamos la UI por esto, es progresivo
            }
        };

        const t = setTimeout(validateQr, 600); // Debounce
        return () => clearTimeout(t);
    }, [qrCodeInput, initialData, category]);

    // PROTECCIÓN DE HIDRATACIÓN (AL FINAL DE LOS HOOKS)
    if (!isMounted) return null;


    // --- HANDLERS ---
    const handleLocationSelect = useCallback((data: { lat: number; lng: number; address?: string }) => {
        setLat(data.lat);
        setLng(data.lng);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleGenerateDescription = async () => {
        const formElement = document.querySelector('form');
        if (!formElement) return;

        setIsGenerating(true);
        const formData = new FormData(formElement);
        const rawData = Object.fromEntries(formData.entries());

        // Filtrar features limpios para la IA
        const features = Object.entries(rawData).reduce((acc, [key, value]) => {
            if (value && key !== 'description' && key !== 'extraNotes' && typeof value === 'string') {
                acc[key] = value;
            }
            return acc;
        }, {} as any);
        features.moneda = moneda;

        try {
            const res = await fetch('/api/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category,
                    features,
                    extraNotes,
                    aiTone
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error generando descripción');
            if (data.description) setDescription(data.description);
        } catch (e: any) {
            alert(e.message || "Error al conectar con la IA");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!file && !initialData) {
            alert('Debes subir una imagen principal.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const formData = new FormData(e.currentTarget);
            if (file) formData.set('file', file);

            // Campos explícitos
            formData.set('descripcion', description);
            if (!formData.get('categoria')) formData.set('categoria', category);

            // Recolectar JSON de features
            const features: any = {};

            // Autos
            if (category === 'autos') {
                ['marca', 'modelo', 'anio', 'kilometraje', 'transmision', 'combustible', 'carroceria'].forEach(k => {
                    features[k] = formData.get(k);
                });
                features.unico_dueno = formData.get('unico_dueno') === 'on';
                features.papeles_al_dia = formData.get('papeles_al_dia') === 'on';
                features.sin_multas = formData.get('sin_multas') === 'on';
                features.aire_acondicionado = formData.get('aire_acondicionado') === 'on';
            }
            // Inmuebles
            if (category === 'inmuebles') {
                // Básicos
                ['operacion', 'tipo_propiedad', 'dormitorios', 'banos'].forEach(k => {
                    features[k] = formData.get(k);
                });
                // Superficie
                features.m2_utiles = formData.get('m2_utiles');
                features.m2_totales = formData.get('m2_totales');

                // Gastos y Vista
                features.gastos_comunes = formData.get('gastos_comunes');
                features.vista_orientacion = formData.get('vista_orientacion');

                // Amenities (Checkboxes)
                const amenitiesList = ['estacionamiento', 'bodega', 'piscina', 'quincho', 'conserjeria', 'ascensor'];
                features.amenities = {};
                amenitiesList.forEach(k => {
                    features.amenities[k] = formData.get(k) === 'on';
                });
            }

            // Globales
            const contactPref = formData.get('contact_preference');
            if (contactPref) features.contact_preference = contactPref;
            if (lat) features.latitude = lat;
            if (lng) features.longitude = lng;
            features.moneda = moneda;

            formData.set('features', JSON.stringify(features));

            // Enviar usando SERVER ACTIONS
            if (initialData) {
                // UPDATE
                formData.append('id', initialData.id);
                await updateAd(formData);
                alert('¡Actualizado correctamente!');
            } else {
                // CREATE (Nueva lógica Many-to-One)
                // CREATE (Nueva lógica Many-to-One)
                await createAd(formData); // Vincula QR internamente
                alert('¡Aviso enviado! Lo revisaremos brevemente.');
            }

            router.push('/mis-anuncios');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al guardar el aviso.');
            window.scrollTo(0, 0);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDERS DE ESTADO (SAFE PATTERN) ---
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Cargando editor seguro...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                <h3 className="text-red-800 font-bold mb-2">Error de Carga</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <div className="flex gap-2 justify-center">
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white border border-red-200 rounded shadow-sm hover:bg-gray-50 text-sm">
                        Reintentar
                    </button>
                    <button onClick={() => router.push('/')} className="px-4 py-2 bg-red-600 text-white rounded shadow-sm hover:bg-red-700 text-sm">
                        Ir al Inicio
                    </button>
                </div>
            </div>
        );
    }

    const showAutoFields = category === 'autos';
    const showPropertyFields = category === 'inmuebles';
    const def = (key: string) => initialData?.features?.[key];

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 bg-white shadow-xl rounded-2xl mt-4 border border-gray-100">

            {/* Header / Bienvenida */}
            <div className="mb-6 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800">
                    {initialData ? 'Editar Anuncio' : 'Publicar Nuevo Aviso'}
                </h1>
                <div className="text-gray-500 mt-1">
                    {initialData
                        ? 'Modifica los detalles de tu publicación.'
                        : `Bienvenido, ${user?.email || 'Usuario'}. Completa la información.`
                    }
                </div>
            </div>

            {/* Success Banner si hay QR válido detectado */}
            {qrCategory && !initialData && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fade-in">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">✓</div>
                    <div>
                        <p className="font-bold text-green-800">Code: {qrCodeInput}</p>
                        <p className="text-sm text-green-600">Categoría detectada: {qrCategory}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* 1. SECCIÓN PRINCIPAL: TÍTULO Y PRECIO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Título del Aviso</label>
                        <input
                            name="titulo"
                            type="text"
                            required
                            defaultValue={initialData?.title}
                            placeholder={
                                category === 'autos' ? "Ej: Suzuki Swift 1.2 GLX 2021" :
                                    category === 'inmuebles' ? "Ej: Depto 2D/2B con Estacionamiento en Ñuñoa" :
                                        "Ej: Título breve de tu aviso"
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Precio</label>
                        <div className="flex gap-2">
                            <select
                                value={moneda}
                                onChange={(e) => setMoneda(e.target.value)}
                                className="p-3 border border-gray-300 rounded-lg bg-gray-50 font-medium"
                            >
                                <option value="CLP">CLP</option>
                                <option value="UF">UF</option>
                                <option value="USD">USD</option>
                            </select>
                            <input
                                name="precio"
                                type="number"
                                required
                                defaultValue={initialData?.price}
                                placeholder="Ej: 9500000"
                                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. QR y Categoría (Solo si no es edición o fix) */}
                {!initialData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <div>
                            <label className="block text-xs font-bold text-blue-800 mb-2 uppercase tracking-wide">Stickers/Kits Vinculados</label>

                            {/* VISUALIZACIÓN MULTI-QR (TAGS/CHIPS) */}
                            <div className="flex flex-wrap gap-2 items-center p-3 bg-white border border-blue-200 rounded-md">
                                {/* Código Actual */}
                                {qrCodeInput ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                        {qrCodeInput}
                                    </span>
                                ) : (
                                    <span className="text-sm text-gray-400 italic">Ningún código escaneado</span>
                                )}
                                <input type="hidden" name="qr_code" value={qrCodeInput} />

                                {/* Botón Visual (Educativo) */}
                                <button type="button" className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center ml-auto">
                                    + Vincular otro sticker
                                </button>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                                Tip: Si tienes el Pack x3, publica este aviso y luego escanea los otros stickers para agregarlos.
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-800 mb-1 uppercase tracking-wide">Categoría</label>
                            <select
                                name="categoria"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full p-2 border border-blue-300 rounded bg-white"
                            >
                                <option value="">-- Seleccionar --</option>
                                <option value="autos">🚗 Autos / Vehículos</option>
                                <option value="inmuebles">🏡 Propiedades</option>
                                <option value="tecnologia">📱 Tecnología</option>
                                <option value="otros">📦 Otros</option>
                            </select>
                        </div>
                    </div>
                )}
                {/* Inputs ocultos para mantener consistencia en updates */}
                {initialData && <input type="hidden" name="categoria" value={category} />}

                {/* 3. CAMPOS ESPECÍFICOS: AUTOS */}
                {showAutoFields && (
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">🚗 Detalles del Vehículo</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500">Marca</label>
                                <input name="marca" defaultValue={def('marca')} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500">Modelo</label>
                                <input name="modelo" defaultValue={def('modelo')} className="w-full p-2 border rounded" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500">Año</label>
                                <input name="anio" type="number" defaultValue={def('anio')} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500">Kms</label>
                                <input name="kilometraje" type="number" defaultValue={def('kilometraje')} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500">Transmisión</label>
                                <select name="transmision" defaultValue={def('transmision')} className="w-full p-2 border rounded">
                                    <option value="manual">Manual</option>
                                    <option value="automatica">Automática</option>
                                </select>
                            </div>
                        </div>
                        {/* Nuevo Campo: Combustible */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500">Combustible</label>
                            <select name="combustible" defaultValue={def('combustible')} className="w-full p-2 border rounded">
                                <option value="">Seleccione...</option>
                                <option value="Bencina">Bencina</option>
                                <option value="Diesel">Diesel</option>
                                <option value="Hibrido">Híbrido</option>
                                <option value="Electrico">Eléctrico</option>
                                <option value="Gas">Gas (GLP/GNC)</option>
                            </select>
                        </div>
                        {/* Checkboxes simplificados */}
                        <div className="flex flex-wrap gap-4 pt-2">
                            {['unico_dueno', 'papeles_al_dia', 'sin_multas', 'aire_acondicionado'].map(k => (
                                <label key={k} className="flex items-center gap-2 text-sm bg-white px-3 py-2 rounded border cursor-pointer hover:bg-gray-50">
                                    <input type="checkbox" name={k} defaultChecked={def(k)} className="rounded text-blue-600" />
                                    <span className="capitalize">{k.replace(/_/g, ' ')}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. CAMPOS ESPECÍFICOS: INMUEBLES */}
                {showPropertyFields && (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6 animate-in fade-in slide-in-from-top-2">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg border-b pb-2">
                            🏡 Detalles de la Propiedad
                        </h3>

                        {/* 1. Operación y Tipo */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Operación</label>
                                <select
                                    name="operacion"
                                    value={operacion}
                                    onChange={(e) => setOperacion(e.target.value)}
                                    className="w-full p-2.5 border rounded-lg bg-white mt-1"
                                >
                                    <option value="Venta">Venta</option>
                                    <option value="Arriendo">Arriendo</option>
                                    <option value="Arriendo_Temporal">Arriendo de Temporada</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Tipo de Inmueble</label>
                                <select name="tipo_propiedad" defaultValue={def('tipo_propiedad')} className="w-full p-2.5 border rounded-lg bg-white mt-1">
                                    <option value="Departamento">Departamento</option>
                                    <option value="Casa">Casa</option>
                                    <option value="Parcela">Parcela</option>
                                    <option value="Oficina">Oficina</option>
                                    <option value="Terreno">Terreno</option>
                                    <option value="Bodega">Bodega</option>
                                    <option value="Estacionamiento">Estacionamiento</option>
                                </select>
                            </div>
                        </div>

                        {/* 2. Gastos Comunes (Crítico en Chile) */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <label className="block text-sm font-bold text-blue-900 mb-1">💰 Gastos Comunes (Aprox.)</label>
                            <div className="flex items-center">
                                <span className="text-gray-500 mr-2">$</span>
                                <input
                                    name="gastos_comunes"
                                    type="number"
                                    defaultValue={def('gastos_comunes')}
                                    placeholder="Ej: 85000"
                                    className="flex-1 p-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-400 outline-none"
                                />
                            </div>
                            <p className="text-xs text-blue-600 mt-1">Si no aplica, dejar en 0 o vacío.</p>
                        </div>

                        {/* 3. Distribución y Superficie */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500">Dormitorios</label>
                                <input name="dormitorios" type="number" defaultValue={def('dormitorios')} className="w-full p-2 border rounded mt-1" placeholder="Ej: 2" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500">Baños</label>
                                <input name="banos" type="number" defaultValue={def('banos')} className="w-full p-2 border rounded mt-1" placeholder="Ej: 2" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500">M² Útiles</label>
                                <input name="m2_utiles" type="number" defaultValue={def('m2_utiles')} className="w-full p-2 border rounded mt-1" placeholder="Ej: 60" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500">M² Totales</label>
                                <input name="m2_totales" type="number" defaultValue={def('m2_totales')} className="w-full p-2 border rounded mt-1" placeholder="Ej: 65" />
                            </div>
                        </div>

                        {/* 4. Vista / Orientación */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500">Vista / Orientación</label>
                            <input
                                name="vista_orientacion"
                                type="text"
                                defaultValue={def('vista_orientacion')}
                                placeholder="Ej: Nor-Poniente, Vista Despejada, Interior..."
                                className="w-full p-2 border rounded mt-1"
                            />
                        </div>

                        {/* 5. Amenities / Extras */}
                        <div className="pt-4 border-t border-gray-200">
                            <label className="block text-sm font-bold text-gray-700 mb-3">Características Adicionales</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { k: 'estacionamiento', label: 'Estacionamiento' },
                                    { k: 'bodega', label: 'Bodega' },
                                    { k: 'piscina', label: 'Piscina' },
                                    { k: 'quincho', label: 'Quincho / Asadera' },
                                    { k: 'conserjeria', label: 'Conserjería 24/7' },
                                    { k: 'ascensor', label: 'Ascensor' }
                                ].map(item => (
                                    <label key={item.k} className="flex items-center space-x-2 bg-white p-2 rounded border border-gray-200 cursor-pointer hover:border-blue-400">
                                        <input
                                            type="checkbox"
                                            name={item.k}
                                            defaultChecked={initialData?.features?.amenities?.[item.k]}
                                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                        />
                                        <span className="text-sm text-gray-700">{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. UBICACIÓN (MAPA) */}
                <div className="border rounded-xl p-1 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                        <h3 className="font-bold text-gray-700 text-sm">📍 Ubicación Exacta</h3>
                        <span className="text-xs text-gray-500">(Google Maps)</span>
                    </div>
                    <div className="p-4">
                        <RobustMapPicker
                            initialLat={lat || undefined}
                            initialLng={lng || undefined}
                            initialAddress={initialData?.features?.address}
                            onLocationSelect={handleLocationSelect}
                        />
                    </div>
                </div>

                {/* 6. DESCRIPCIÓN CON IA */}
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <div className="flex justify-between items-center mb-2">
                        <label className="font-bold text-indigo-900">Descripción</label>
                        <span className="text-xs bg-white text-indigo-600 px-2 py-0.5 rounded border border-indigo-200">AI Powered ✨</span>
                    </div>

                    <textarea
                        value={extraNotes}
                        onChange={e => setExtraNotes(e.target.value)}
                        placeholder="Escribe punteos clave para la IA (ej: 'Vista al mar, cerca metro, remodelado')..."
                        className="w-full p-3 border border-indigo-200 rounded-lg mb-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                        rows={2}
                    />

                    <div className="flex gap-2 mb-3">
                        <select
                            value={aiTone}
                            onChange={e => setAiTone(e.target.value)}
                            className="bg-white border border-indigo-200 text-sm p-2 rounded w-1/3"
                        >
                            <option value="random">🎲 Creativo</option>
                            <option value="ejecutivo">👔 Formal</option>
                            <option value="vendedor">🔥 Vendedor</option>
                        </select>
                        <button
                            type="button"
                            onClick={handleGenerateDescription}
                            disabled={isGenerating}
                            className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded hover:bg-indigo-700 transition flex justify-center items-center gap-2"
                        >
                            {isGenerating ? (
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                            ) : '✨ Generar Descripción'}
                        </button>
                    </div>

                    <textarea
                        name="descripcion"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Aquí aparecerá el texto generado o puedes escribirlo tú..."
                    ></textarea>
                </div>

                {/* 7. PREFERENCIAS DE CONTACTO */}
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700">WhatsApp de Contacto</label>
                    <input
                        name="contact_phone"
                        type="tel"
                        required
                        defaultValue={initialData?.contact_phone || user?.user_metadata?.phone || ''}
                        placeholder="+569..."
                        className="w-full p-3 border rounded-lg"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="border p-3 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-gray-50 bg-white">
                            <input type="radio" name="contact_preference" value="whatsapp_directo" defaultChecked={def('contact_preference') !== 'agente_ia'} className="h-5 w-5 text-blue-600" />
                            <div>
                                <span className="block font-bold text-gray-800">WhatsApp Directo</span>
                                <span className="text-xs text-gray-500">Los interesados te escriben a ti.</span>
                            </div>
                        </label>
                        <label className="border p-3 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-gray-50 bg-blue-50 border-blue-200">
                            <input type="radio" name="contact_preference" value="agente_ia" defaultChecked={def('contact_preference') === 'agente_ia'} className="h-5 w-5 text-blue-600" />
                            <div>
                                <span className="block font-bold text-blue-900">Agente IA (Filtro) ✨</span>
                                <span className="text-xs text-blue-700">La IA responde dudas y filtra reales interesados.</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* 8. IMAGEN */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Foto Principal</label>
                    {initialData?.media_url && (
                        <img src={initialData.media_url} className="w-32 h-32 object-cover rounded mb-2 border" alt="preview" />
                    )}
                    <input
                        type="file"
                        name="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        required={!initialData}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>

                {/* BOTÓN FINAL */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all transform ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:scale-[1.01] hover:bg-blue-700'}`}
                >
                    {isSubmitting ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Publicar Aviso')}
                </button>

            </form>
        </div>
    );
}

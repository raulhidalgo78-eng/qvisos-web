'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import RobustMapPicker from '@/components/RobustMapPicker';
import { updateAd } from '@/app/actions/ad-actions';

interface AnuncioFormProps {
    initialData?: any;
}

export default function AnuncioForm({ initialData }: AnuncioFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(!initialData); // Skip loading if data provided

    // Parámetros de URL (solo para creación)
    const urlCode = searchParams.get('code') || '';
    const urlTipo = searchParams.get('tipo') || '';

    // Estados del formulario
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Inicializar estados con initialData o defaults
    const [qrCodeInput, setQrCodeInput] = useState(initialData?.qr_code || urlCode); // Nota: qr_code podría no venir en initialData si no lo consultamos, pero para editar no se toca.
    const [category, setCategory] = useState(initialData?.category || '');
    const [operacion, setOperacion] = useState(initialData?.features?.operacion || 'Venta');
    const [moneda, setMoneda] = useState(initialData?.features?.moneda || 'CLP');
    const [description, setDescription] = useState(initialData?.description || '');
    const [extraNotes, setExtraNotes] = useState(initialData?.features?.extraNotes || '');
    const [aiTone, setAiTone] = useState('random');
    const [isGenerating, setIsGenerating] = useState(false);

    // Estado para ubicación
    const [lat, setLat] = useState<number | null>(initialData?.features?.latitude ? parseFloat(initialData.features.latitude) : null);
    const [lng, setLng] = useState<number | null>(initialData?.features?.longitude ? parseFloat(initialData.features.longitude) : null);

    // Estado para detectar la categoría real del QR
    const [qrCategory, setQrCategory] = useState<string | null>(null);

    // Auth Check (Solo si no es edición, o para verificar usuario actual)
    useEffect(() => {
        const checkUser = async () => {
            const supabase = createClient();
            const { data, error } = await supabase.auth.getUser();

            if (error || !data?.user) {
                router.push('/login?message=Debes iniciar sesión');
            } else {
                setUser(data.user);
                setLoading(false);
            }
        };
        if (!initialData) {
            checkUser();
        } else {
            // Si hay initialData, asumimos que el parent ya verificó auth, pero necesitamos el user para el saludo
            checkUser();
        }
    }, [router, initialData]);

    // Inicializar categoría desde URL (Solo creación)
    useEffect(() => {
        if (initialData) return;
        if (urlTipo === 'auto') setCategory('autos');
        else if (urlTipo.includes('propiedad')) {
            setCategory('inmuebles');
            if (urlTipo.includes('arriendo')) setOperacion('Arriendo');
            else setOperacion('Venta');
        }
        else if (urlTipo) setCategory('otros');
    }, [urlTipo, initialData]);

    // Check QR (Solo creación)
    useEffect(() => {
        if (initialData) return; // No chequear QR en edición
        const checkQr = async () => {
            if (qrCodeInput.length > 3) {
                const { checkQrCategory } = await import('@/app/actions/check-qr');
                const cat = await checkQrCategory(qrCodeInput);
                if (cat) {
                    setQrCategory(cat);
                    if (cat === 'venta_auto') setCategory('autos');
                    if (cat === 'venta_propiedad' || cat === 'arriendo_propiedad') setCategory('inmuebles');
                } else {
                    setQrCategory(null);
                }
            }
        };
        const timeoutId = setTimeout(() => checkQr(), 500);
        return () => clearTimeout(timeoutId);
    }, [qrCodeInput, initialData]);

    const handleGenerateDescription = async () => {
        const formElement = document.querySelector('form');
        if (!formElement) return;

        setIsGenerating(true);
        const formData = new FormData(formElement);
        const rawData = Object.fromEntries(formData.entries());

        const features = Object.entries(rawData).reduce((acc, [key, value]) => {
            if (value && key !== 'description' && key !== 'extraNotes') {
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
                    category: category,
                    features: features,
                    extraNotes: extraNotes,
                    aiTone: aiTone
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Server error');
            if (data.description) setDescription(data.description);
        } catch (e: any) {
            console.error("Error generación:", e);
            let mensaje = "Hubo un problema al generar la descripción.";
            if (e.message.includes("quota") || e.message.includes("billing")) {
                mensaje = "⚠️ Error de Saldo OpenAI.";
            } else if (e.message.includes("API Key")) {
                mensaje = "⚠️ Error de Configuración: No se detecta la API Key.";
            }
            alert(mensaje);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFile(e.target.files[0]);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!file && !initialData) {
            setError('Por favor, selecciona un archivo para subir.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        if (file) formData.append('file', file);
        formData.set('descripcion', description);

        if (!formData.get('categoria')) formData.append('categoria', category);

        // Recolectar features
        const features: any = {};
        if (category === 'autos') {
            features.marca = formData.get('marca');
            features.modelo = formData.get('modelo');
            features.anio = formData.get('anio');
            features.kilometraje = formData.get('kilometraje');
            features.transmision = formData.get('transmision');
            features.combustible = formData.get('combustible');
            features.carroceria = formData.get('carroceria');
            features.unico_dueno = formData.get('unico_dueno') === 'on';
            features.papeles_al_dia = formData.get('papeles_al_dia') === 'on';
            features.sin_multas = formData.get('sin_multas') === 'on';
            features.aire_acondicionado = formData.get('aire_acondicionado') === 'on';
        } else if (category === 'inmuebles') {
            features.operacion = formData.get('operacion');
            features.type = formData.get('tipo_propiedad');
            features.orientation = formData.get('orientacion');
            features.m2_built = formData.get('m2_utiles');
            features.m2_total = formData.get('m2_totales');
            features.bedrooms = formData.get('dormitorios');
            features.bathrooms = formData.get('banos');
            features.parking = formData.get('estacionamientos');
            features.storage = formData.get('bodegas');
            features.expenses = {
                gastos_comunes: formData.get('gastos_comunes'),
                contribuciones: formData.get('contribuciones')
            };
            features.attributes = {
                recepcion_final: formData.get('recepcion_final') === 'on',
                mascotas: formData.get('mascotas') === 'on',
                amoblado: formData.get('amoblado') === 'on'
            };
            features.amenities = {
                piscina: formData.get('piscina') === 'on',
                quincho: formData.get('quincho') === 'on',
                conserjeria: formData.get('conserjeria') === 'on'
            };
        }

        // Contact Preference
        const contactPreference = formData.get('contact_preference');
        if (contactPreference) features.contact_preference = contactPreference;

        // Lat/Lng
        if (lat) features.latitude = lat;
        if (lng) features.longitude = lng;

        // Moneda
        features.moneda = moneda;

        formData.append('features', JSON.stringify(features));

        try {
            if (initialData) {
                // MODO EDICIÓN
                formData.append('id', initialData.id);
                await updateAd(formData);
                alert('¡Anuncio actualizado con éxito!');
                router.push('/mis-anuncios');
            } else {
                // MODO CREACIÓN
                const response = await fetch('/api/upload/media', {
                    method: 'POST',
                    body: formData,
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error al subir el archivo');
                }
                alert('¡Anuncio creado con éxito! Redirigiendo a Mis Anuncios...');
                router.push('/mis-anuncios');
            }
        } catch (err: any) {
            setError(err.message || 'No se pudo guardar el anuncio.');
            setIsSubmitting(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;

    const showAutoFields = category === 'autos';
    const showPropertyFields = category === 'inmuebles';

    // Helper para valores por defecto
    const def = (key: string, fallback: string = '') => initialData?.features?.[key] || fallback;
    const defVal = (key: string) => initialData ? initialData[key] : undefined;

    const handleLocationSelect = useCallback((data: { lat: number; lng: number; address?: string }) => {
        setLat(data.lat);
        setLng(data.lng);
        // Optional: Save address if needed
    }, []);

    return (
        // ... (rest of the component)
        <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px' }}>
            <h1>{initialData ? 'Editar Anuncio' : 'Activar QR / Crear Anuncio'}</h1>
            <p style={{ marginBottom: '20px' }}>
                {initialData ? 'Edita los detalles de tu anuncio.' : `Bienvenido, ${user?.email}. Completa los datos.`}
            </p>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* ... (QR Code section) ... */}

                {/* ... (Title section) ... */}

                {/* ... (Category section) ... */}

                {/* ... (Auto/Property fields) ... */}

                <div style={{ marginBottom: '15px' }}>
                    <h3 className="text-lg font-bold mb-4">Ubicación</h3>
                    <RobustMapPicker
                        initialLat={lat || undefined}
                        initialLng={lng || undefined}
                        initialAddress={initialData?.features?.address}
                        onLocationSelect={handleLocationSelect}
                    />
                    <input type="hidden" name="latitude" value={lat || ''} />
                    <input type="hidden" name="longitude" value={lng || ''} />
                </div>
                {!initialData && (
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="qr_code" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2563eb' }}>
                            Códigos del Kit QR
                        </label>
                        <input
                            id="qr_code"
                            name="qr_code"
                            value={qrCodeInput}
                            onChange={(e) => setQrCodeInput(e.target.value)}
                            readOnly={!!urlCode}
                            placeholder="Ej: QV-001"
                            required
                            style={{ width: '100%', padding: '8px', color: '#333', border: '2px solid #2563eb', borderRadius: '4px', backgroundColor: urlCode ? '#e0f2fe' : 'white' }}
                        />
                        {!urlCode && <small style={{ color: '#666' }}>Ingresa el código manualmente si no lo escaneaste.</small>}
                    </div>
                )}

                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="title" style={{ display: 'block', marginBottom: '5px' }}>Título del Anuncio</label>
                    <input
                        id="title"
                        name="titulo"
                        type="text"
                        required
                        defaultValue={initialData?.title}
                        placeholder="Título del aviso"
                        style={{ width: '100%', padding: '8px', color: '#333' }}
                    />
                </div>

                {(!urlTipo && !initialData) && (
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="category" style={{ display: 'block', marginBottom: '5px' }}>Categoría</label>
                        <select
                            id="category"
                            name="categoria"
                            required
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={{ width: '100%', padding: '8px', color: '#333', backgroundColor: 'white' }}
                        >
                            <option value="">-- Selecciona una categoría --</option>
                            <option value="autos">Autos</option>
                            <option value="inmuebles">Inmuebles</option>
                            <option value="tecnologia">Tecnología</option>
                            <option value="otros">Otros</option>
                        </select>
                    </div>
                )}
                {(urlTipo || initialData) && <input type="hidden" name="categoria" value={category} />}

                {/* DETALLES AUTOS */}
                {showAutoFields && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                        <h3 className="font-bold text-gray-700">Detalles del Vehículo</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Marca</label>
                                <input name="marca" defaultValue={def('marca')} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Modelo</label>
                                <input name="modelo" defaultValue={def('modelo')} className="w-full p-2 border rounded" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Año</label>
                                <input name="anio" type="number" defaultValue={def('anio')} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Kms</label>
                                <input name="kilometraje" type="number" defaultValue={def('kilometraje')} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Transmisión</label>
                                <select name="transmision" defaultValue={def('transmision')} className="w-full p-2 border rounded">
                                    <option value="manual">Manual</option>
                                    <option value="automatica">Automática</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Combustible</label>
                                <select name="combustible" defaultValue={def('combustible')} className="w-full p-2 border rounded">
                                    <option value="Bencina">Bencina</option>
                                    <option value="Diesel">Diesel</option>
                                    <option value="Hibrido">Híbrido</option>
                                    <option value="Electrico">Eléctrico</option>
                                    <option value="Gas">Gas (GLP/GNC)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Carrocería</label>
                                <select name="carroceria" defaultValue={def('carroceria')} className="w-full p-2 border rounded">
                                    <option value="SUV">SUV</option>
                                    <option value="Sedan">Sedán</option>
                                    <option value="Hatchback">Hatchback</option>
                                    <option value="Camioneta">Camioneta</option>
                                    <option value="Citycar">Citycar</option>
                                    <option value="Coupe">Coupé</option>
                                    <option value="Convertible">Convertible</option>
                                    <option value="Furgon">Furgón</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100 cursor-pointer">
                                    <input type="checkbox" name="unico_dueno" defaultChecked={def('unico_dueno') === true} className="w-5 h-5 text-blue-600 rounded" />
                                    <span className="text-sm text-gray-700">👑 Único Dueño</span>
                                </label>
                                <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100 cursor-pointer">
                                    <input type="checkbox" name="papeles_al_dia" defaultChecked={def('papeles_al_dia') !== false} className="w-5 h-5 text-green-600 rounded" />
                                    <span className="text-sm text-gray-700">📄 Papeles al día</span>
                                </label>
                                <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100 cursor-pointer">
                                    <input type="checkbox" name="sin_multas" defaultChecked={def('sin_multas') !== false} className="w-5 h-5 text-blue-600 rounded" />
                                    <span className="text-sm text-gray-700">✅ Sin Multas</span>
                                </label>
                                <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100 cursor-pointer">
                                    <input type="checkbox" name="aire_acondicionado" defaultChecked={def('aire_acondicionado') === true} className="w-5 h-5 text-blue-600 rounded" />
                                    <span className="text-sm text-gray-700">❄️ Aire Acondicionado</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* DETALLES INMUEBLES */}
                {showPropertyFields && (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6 mb-6">
                        <h3 className="font-bold text-gray-800 text-lg border-b pb-2">🏡 Detalles de la Propiedad</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Operación</label>
                                <select name="operacion" value={operacion} onChange={(e) => setOperacion(e.target.value)} className="w-full p-3 border rounded-lg bg-white">
                                    <option value="Venta">Venta</option>
                                    <option value="Arriendo">Arriendo</option>
                                    <option value="Arriendo_Temporal">Arriendo de Temporada</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo Propiedad</label>
                                <select name="tipo_propiedad" defaultValue={def('type')} className="w-full p-3 border rounded-lg bg-white">
                                    <option value="Departamento">Departamento</option>
                                    <option value="Casa">Casa</option>
                                    <option value="Parcela">Parcela</option>
                                    <option value="Oficina">Oficina</option>
                                    <option value="Terreno">Terreno</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">M² Útiles</label>
                                <input name="m2_utiles" type="number" defaultValue={def('m2_built')} className="w-full p-3 border rounded-lg" required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">M² Totales</label>
                                <input name="m2_totales" type="number" defaultValue={def('m2_total')} className="w-full p-3 border rounded-lg" required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Orientación</label>
                                <select name="orientacion" defaultValue={def('orientation')} className="w-full p-3 border rounded-lg bg-white">
                                    <option value="">Seleccione...</option>
                                    <option value="Norte">Norte</option>
                                    <option value="Nor-Oriente">Nor-Oriente</option>
                                    <option value="Nor-Poniente">Nor-Poniente</option>
                                    <option value="Sur">Sur</option>
                                    <option value="Oriente">Oriente</option>
                                    <option value="Poniente">Poniente</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 md:gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Dorms</label>
                                <input name="dormitorios" type="number" defaultValue={def('bedrooms')} className="w-full p-3 border rounded-lg text-center" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Baños</label>
                                <input name="banos" type="number" defaultValue={def('bathrooms')} className="w-full p-3 border rounded-lg text-center" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Estac.</label>
                                <input name="estacionamientos" type="number" defaultValue={def('parking')} className="w-full p-3 border rounded-lg text-center" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Bodega</label>
                                <input name="bodegas" type="number" defaultValue={def('storage')} className="w-full p-3 border rounded-lg text-center" />
                            </div>
                        </div>
                        {/* Gastos y Contribuciones */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Gastos Comunes</label>
                                <input name="gastos_comunes" type="number" defaultValue={initialData?.features?.expenses?.gastos_comunes} className="w-full p-3 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Contribuciones</label>
                                <input name="contribuciones" type="number" defaultValue={initialData?.features?.expenses?.contribuciones} className="w-full p-3 border rounded-lg" />
                            </div>
                        </div>
                        {/* Checkboxes */}
                        <div className="pt-2 border-t border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-y-3">
                            <label className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded border">
                                <input type="checkbox" name="recepcion_final" defaultChecked={initialData?.features?.attributes?.recepcion_final} className="rounded text-green-600" />
                                <span className="text-xs md:text-sm text-gray-700">✅ Recepción Final</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded border">
                                <input type="checkbox" name="mascotas" defaultChecked={initialData?.features?.attributes?.mascotas} className="rounded text-blue-600" />
                                <span className="text-xs md:text-sm text-gray-700">🐶 Mascotas OK</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded border">
                                <input type="checkbox" name="amoblado" defaultChecked={initialData?.features?.attributes?.amoblado} className="rounded text-blue-600" />
                                <span className="text-xs md:text-sm text-gray-700">🛋️ Amoblado</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded border">
                                <input type="checkbox" name="conserjeria" defaultChecked={initialData?.features?.amenities?.conserjeria} className="rounded text-gray-600" />
                                <span className="text-xs md:text-sm text-gray-700">👮‍♂️ Conserjería</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded border">
                                <input type="checkbox" name="piscina" defaultChecked={initialData?.features?.amenities?.piscina} className="rounded text-gray-600" />
                                <span className="text-xs md:text-sm text-gray-700">🏊‍♂️ Piscina</span>
                            </label>
                        </div>
                    </div>
                )}

                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="price" style={{ display: 'block', marginBottom: '5px' }}>Precio</label>
                    <div className="flex gap-2">
                        <select name="moneda" value={moneda} onChange={(e) => setMoneda(e.target.value)} className="p-2 border rounded bg-white" style={{ width: '100px' }}>
                            <option value="CLP">CLP</option>
                            <option value="UF">UF</option>
                            <option value="USD">USD</option>
                        </select>
                        <input id="price" name="precio" type="number" defaultValue={initialData?.price} placeholder="Ej: 9500000" className="flex-1 p-2 border rounded" style={{ color: '#333' }} />
                    </div>
                </div>

                {/* AI Generator */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-blue-800">📝 Descripción del Anuncio</h3>
                        <span className="text-xs text-blue-600 bg-white px-2 py-1 rounded-full border border-blue-200">IA ✨</span>
                    </div>
                    <textarea
                        name="extraNotes"
                        value={extraNotes}
                        onChange={(e) => setExtraNotes(e.target.value)}
                        rows={3}
                        className="w-full p-4 border border-blue-200 rounded-lg"
                        placeholder="Notas extra para la IA..."
                    ></textarea>
                    <div className="flex items-center gap-3 mb-2">
                        <label className="text-xs font-bold text-blue-700">Estilo:</label>
                        <select value={aiTone} onChange={(e) => setAiTone(e.target.value)} className="text-sm p-1 border border-blue-200 rounded">
                            <option value="random">🎲 Sorpréndeme</option>
                            <option value="ejecutivo">👔 Ejecutivo</option>
                            <option value="entusiasta">🤩 Entusiasta</option>
                            <option value="cercano">🤝 Cercano</option>
                            <option value="oportunista">🔥 Oportunidad</option>
                        </select>
                    </div>
                    <button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm">
                        {isGenerating ? 'Redactando...' : '✨ Generar Descripción'}
                    </button>
                    <textarea id="description" name="description" rows={8} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border rounded-md" />
                </div>

                {/* Contact Preference */}
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 mt-6 mb-6">
                    <h3 className="font-bold text-indigo-900 mb-3">🛡️ ¿Cómo quieres que te contacten?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="relative flex p-4 cursor-pointer rounded-lg border-2 bg-white border-indigo-500">
                            <input type="radio" name="contact_preference" value="agente_ia" defaultChecked={def('contact_preference', 'agente_ia') === 'agente_ia'} className="mt-1 mr-3 text-indigo-600" />
                            <div><span className="block font-bold text-gray-900">Agente IA (Filtro) ✨</span></div>
                        </label>
                        <label className="relative flex p-4 cursor-pointer rounded-lg border-2 border-gray-200 bg-white">
                            <input type="radio" name="contact_preference" value="whatsapp_directo" defaultChecked={def('contact_preference') === 'whatsapp_directo'} className="mt-1 mr-3 text-gray-600" />
                            <div><span className="block font-bold text-gray-900">WhatsApp Directo</span></div>
                        </label>
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="contact_phone" style={{ display: 'block', marginBottom: '5px' }}>WhatsApp de Contacto</label>
                    <input id="contact_phone" name="contact_phone" type="tel" defaultValue={initialData?.contact_phone} required style={{ width: '100%', padding: '8px', color: '#333' }} />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="file" style={{ display: 'block', marginBottom: '5px' }}>Imagen Principal {initialData && '(Opcional)'}</label>
                    {initialData?.media_url && <div className="mb-2"><img src={initialData.media_url} alt="Actual" className="w-32 h-32 object-cover rounded" /></div>}
                    <input id="file" type="file" onChange={handleFileChange} accept="image/*" required={!initialData} style={{ width: '100%', padding: '8px', color: '#333' }} />
                </div>

                <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '10px 20px', fontSize: '16px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar Anuncio' : 'Crear Anuncio y Activar')}
                </button>
            </form>
        </div>
    );
}

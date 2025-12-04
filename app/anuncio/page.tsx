'use client'; // Este formulario debe ser un Client Component

import { createClient } from '@/utils/supabase/client'; // ¡Importante! Usamos el cliente del NAVEGADOR
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, Suspense } from 'react';
import type { User } from '@supabase/supabase-js'; // Para el tipado
import LocationPicker from '@/components/LocationPicker';

function AnuncioForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Parámetros de URL
  const urlCode = searchParams.get('code') || '';
  const urlTipo = searchParams.get('tipo') || '';

  // Estados del formulario
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState(urlCode);

  // Estado para la categoría (se llena con el URL param si existe)
  const [category, setCategory] = useState('');
  const [operacion, setOperacion] = useState('Venta');

  // Estado para detectar la categoría real del QR (desde la BD)
  const [qrCategory, setQrCategory] = useState<string | null>(null);

  // Estado para ubicación (Google Maps)
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Estados para Generador IA
  const [description, setDescription] = useState('');
  const [extraNotes, setExtraNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDescription = async () => {
    const formElement = document.querySelector('form');
    if (!formElement) return;

    setIsGenerating(true);

    // Capture all form data effectively
    const formData = new FormData(formElement);
    const rawData = Object.fromEntries(formData.entries());

    // Filter out empty values to send clean data to AI
    const features = Object.entries(rawData).reduce((acc, [key, value]) => {
      if (value && key !== 'description' && key !== 'extraNotes') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category,
          features: features,
          extraNotes: extraNotes
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Server error');
      }

      if (data.description) {
        setDescription(data.description); // Update UI state
      }
    } catch (e: any) {
      console.error("Error generación:", e);

      // Detección de errores comunes para mostrar mensaje amigable
      let mensaje = "Hubo un problema al generar la descripción.";

      if (e.message.includes("quota") || e.message.includes("billing")) {
        mensaje = "⚠️ Error de Saldo OpenAI: Se ha excedido la cuota de la API Key. Por favor revisa tu facturación en OpenAI.";
      } else if (e.message.includes("API Key")) {
        mensaje = "⚠️ Error de Configuración: No se detecta la API Key de OpenAI.";
      }

      alert(mensaje);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- ¡AQUÍ ESTÁ LA SEGURIDAD! ---
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        router.push('/login?message=Debes iniciar sesión para activar un QR');
      } else {
        setUser(data.user);
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  // Efecto para inicializar categoría desde URL
  useEffect(() => {
    if (urlTipo === 'auto') setCategory('autos');
    else if (urlTipo.includes('propiedad')) {
      setCategory('inmuebles');
      if (urlTipo.includes('arriendo')) setOperacion('Arriendo');
      else setOperacion('Venta');
    }
    else if (urlTipo) setCategory('otros');
  }, [urlTipo]);

  // Efecto para chequear la categoría del QR cuando cambia el input
  useEffect(() => {
    const checkQr = async () => {
      if (qrCodeInput.length > 3) { // Solo chequear si tiene longitud razonable
        // Importamos dinámicamente o usamos la server action
        const { checkQrCategory } = await import('@/app/actions/check-qr');
        const cat = await checkQrCategory(qrCodeInput);
        if (cat) {
          setQrCategory(cat);
          // Auto-seleccionar categoría en el dropdown si coincide
          if (cat === 'venta_auto') setCategory('autos');
          if (cat === 'venta_propiedad' || cat === 'arriendo_propiedad') setCategory('inmuebles');
        } else {
          setQrCategory(null);
        }
      }
    };

    // Debounce simple o check directo si viene de URL
    const timeoutId = setTimeout(() => {
      checkQr();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [qrCodeInput]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor, selecciona un archivo para subir.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('file', file);
    // Usamos la descripción del estado si existe, sino lo que esté en el textarea (que debería estar sincronizado)
    formData.set('descripcion', description);

    // Aseguramos que la categoría se envíe correctamente
    if (!formData.get('categoria')) {
      formData.append('categoria', category);
    }

    // Recolectar features extras
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

    // Agregar preferencia de contacto
    const contactPreference = formData.get('contact_preference');
    if (contactPreference) {
      features.contact_preference = contactPreference;
    }

    // Agregar features al FormData como JSON string
    formData.append('features', JSON.stringify(features));

    try {
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

    } catch (err: any) {
      setError(err.message || 'No se pudo guardar el anuncio en la base de datos.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Verificando sesión...</div>;
  }

  // Lógica de visualización basada en la categoría seleccionada O la del QR
  const showAutoFields = category === 'autos';
  const showPropertyFields = category === 'inmuebles';

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px' }}>
      <h1>Activar QR / Crear Anuncio</h1>
      <p style={{ marginBottom: '20px' }}>Bienvenido, {user?.email}. Completa los datos de tu anuncio.</p>

      <form onSubmit={handleSubmit} method="POST">

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

        {/* Campo Título */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '5px' }}>Título del Anuncio</label>
          <input
            id="title"
            name="titulo"
            type="text"
            required
            placeholder={showAutoFields ? "Ej: Toyota Yaris 2018" : showPropertyFields ? "Ej: Depto 2D 2B Centro" : "Título del aviso"}
            style={{ width: '100%', padding: '8px', color: '#333' }}
          />
        </div>



        {/* Campo Categoría - Ocultar si viene predefinida */}
        {!urlTipo && (
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
        {/* Si viene predefinida, enviamos el valor oculto */}
        {urlTipo && <input type="hidden" name="categoria" value={category} />}

        {/* CAMPOS ESPECÍFICOS: AUTO */}
        {/* CAMPOS ESPECÍFICOS: AUTO */}
        {showAutoFields && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-700">Detalles del Vehículo</h3>

            {/* Fila 1: Marca y Modelo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Marca</label>
                <input name="marca" placeholder="Ej: Toyota" className="w-full p-2 border rounded" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Modelo</label>
                <input name="modelo" placeholder="Ej: Yaris" className="w-full p-2 border rounded" required />
              </div>
            </div>

            {/* Fila 2: Año, KMS, Transmisión */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Año</label>
                <input name="anio" type="number" placeholder="2018" className="w-full p-2 border rounded" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Kms</label>
                <input name="kilometraje" type="number" placeholder="50000" className="w-full p-2 border rounded" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Transmisión</label>
                <select name="transmision" className="w-full p-2 border rounded">
                  <option value="manual">Manual</option>
                  <option value="automatica">Automática</option>
                </select>
              </div>
            </div>

            {/* Fila 3: Combustible y Carrocería */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Combustible</label>
                <select name="combustible" className="w-full p-2 border rounded">
                  <option value="Bencina">Bencina</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hibrido">Híbrido</option>
                  <option value="Electrico">Eléctrico</option>
                  <option value="Gas">Gas (GLP/GNC)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Carrocería</label>
                <select name="carroceria" className="w-full p-2 border rounded">
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

            {/* Fila 4: Checkboxes Legales */}
            <div className="pt-4 border-t border-gray-200">
              <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Documentación y Estado</span>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-300 cursor-pointer transition-all">
                  <input type="checkbox" name="unico_dueno" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">👑 Único Dueño</span>
                </label>
                <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-green-300 cursor-pointer transition-all">
                  <input type="checkbox" name="papeles_al_dia" defaultChecked className="w-5 h-5 text-green-600 rounded focus:ring-green-500" />
                  <span className="text-sm text-gray-700">📄 Papeles al día</span>
                </label>
                <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-300 cursor-pointer transition-all">
                  <input type="checkbox" name="sin_multas" defaultChecked className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">✅ Sin Multas</span>
                </label>
                <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-300 cursor-pointer transition-all">
                  <input type="checkbox" name="aire_acondicionado" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">❄️ Aire Acondicionado</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* CAMPOS ESPECÍFICOS: PROPIEDAD */}
        {showPropertyFields && (
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6 mb-6">
            <h3 className="font-bold text-gray-800 text-lg border-b pb-2">🏡 Detalles de la Propiedad</h3>

            {/* Fila 1: Operación y Tipo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Operación</label>
                <select
                  name="operacion"
                  value={operacion}
                  onChange={(e) => setOperacion(e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Venta">Venta</option>
                  <option value="Arriendo">Arriendo</option>
                  <option value="Arriendo_Temporal">Arriendo de Temporada</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo Propiedad</label>
                <select name="tipo_propiedad" className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500">
                  <option value="Departamento">Departamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Parcela">Parcela</option>
                  <option value="Oficina">Oficina</option>
                  <option value="Terreno">Terreno</option>
                </select>
              </div>
            </div>

            {/* Fila 2: Superficies y Orientación */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">M² Útiles (Interior)</label>
                <input name="m2_utiles" type="number" placeholder="Ej: 80" className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">M² Totales (Con Terraza)</label>
                <input name="m2_totales" type="number" placeholder="Ej: 95" className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Orientación</label>
                <select name="orientacion" className="w-full p-3 border rounded-lg bg-white">
                  <option value="">Seleccione...</option>
                  <option value="Norte">Norte (Sol)</option>
                  <option value="Nor-Oriente">Nor-Oriente (Mañana)</option>
                  <option value="Nor-Poniente">Nor-Poniente (Tarde)</option>
                  <option value="Sur">Sur</option>
                  <option value="Oriente">Oriente</option>
                  <option value="Poniente">Poniente</option>
                </select>
              </div>
            </div>

            {/* Fila 3: Distribución */}
            <div className="grid grid-cols-4 gap-2 md:gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Dorms</label>
                <input name="dormitorios" type="number" className="w-full p-3 border rounded-lg text-center" placeholder="3" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Baños</label>
                <input name="banos" type="number" className="w-full p-3 border rounded-lg text-center" placeholder="2" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Estac.</label>
                <input name="estacionamientos" type="number" className="w-full p-3 border rounded-lg text-center" defaultValue="0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Bodega</label>
                <input name="bodegas" type="number" className="w-full p-3 border rounded-lg text-center" defaultValue="0" />
              </div>
            </div>

            {/* Fila 4: Bolsillo (Gastos Comunes y Contribuciones) */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Gastos Comunes (Aprox)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">$</span>
                  <input name="gastos_comunes" type="number" placeholder="120000" className="w-full p-3 pl-7 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Contribuciones (Trimestral)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">$</span>
                  <input name="contribuciones" type="number" placeholder="85000" className="w-full p-3 pl-7 border rounded-lg" />
                </div>
              </div>
            </div>

            {/* Fila 5: Checkboxes Legales y Lifestyle */}
            <div className="pt-2 border-t border-gray-100">
              <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Características y Estado</span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3">
                <label className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded border hover:border-blue-300">
                  <input type="checkbox" name="recepcion_final" className="rounded text-green-600 focus:ring-green-500" />
                  <span className="text-xs md:text-sm text-gray-700 font-medium">✅ Recepción Final</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded border hover:border-blue-300">
                  <input type="checkbox" name="mascotas" className="rounded text-blue-600 focus:ring-blue-500" />
                  <span className="text-xs md:text-sm text-gray-700">🐶 Mascotas OK</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded border hover:border-blue-300">
                  <input type="checkbox" name="amoblado" className="rounded text-blue-600 focus:ring-blue-500" />
                  <span className="text-xs md:text-sm text-gray-700">🛋️ Amoblado</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded border hover:border-blue-300">
                  <input type="checkbox" name="conserjeria" className="rounded text-gray-600" />
                  <span className="text-xs md:text-sm text-gray-700">👮‍♂️ Conserjería 24/7</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded border hover:border-blue-300">
                  <input type="checkbox" name="quincho" className="rounded text-gray-600" />
                  <span className="text-xs md:text-sm text-gray-700">🍖 Quincho</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded border hover:border-blue-300">
                  <input type="checkbox" name="piscina" className="rounded text-gray-600" />
                  <span className="text-xs md:text-sm text-gray-700">🏊‍♂️ Piscina</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Campo Descripción con IA */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-blue-800">📝 Descripción del Anuncio</h3>
            <span className="text-xs text-blue-600 bg-white px-2 py-1 rounded-full border border-blue-200">
              Potenciado por IA ✨
            </span>
          </div>

          {/* Campo de notas rápidas */}
          <div>
            <label className="block text-xs font-semibold text-blue-700 mb-1">
              Notas para la IA (Opcional)
            </label>
            <input
              type="text"
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder="Ej: Ideal para familias, precio conversable, vista al mar..."
              className="w-full p-2 text-sm border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Botón Mágico */}
          <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={isGenerating}
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold text-sm shadow-sm hover:shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {isGenerating ? (
              <span>🧠 Redactando...</span>
            ) : (
              <>
                <span>✨ Generar Descripción Profesional</span>
              </>
            )}
          </button>

          {/* El Textarea Final (Editable) */}
          <textarea
            id="description"
            name="description" // IMPORTANTE: El nombre debe coincidir con la columna DB
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="La descripción generada aparecerá aquí..."
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Campo WhatsApp de Contacto */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="contact_phone" style={{ display: 'block', marginBottom: '5px' }}>WhatsApp de Contacto (+569...)</label>
          <input
            id="contact_phone"
            name="contact_phone"
            type="tel"
            placeholder="+56912345678"
            required
            style={{ width: '100%', padding: '8px', color: '#333' }}
          />
        </div>

        {/* Campo Precio */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="price" style={{ display: 'block', marginBottom: '5px' }}>Precio (CLP)</label>
          <input
            id="price"
            name="precio"
            type="number"
            style={{ width: '100%', padding: '8px', color: '#333' }}
          />
        </div>

        {/* Campo Ubicación (Mapa) */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ubicación</label>
          <LocationPicker onLocationSelect={(la, lo) => { setLat(la); setLng(lo); }} />
          <input type="hidden" name="latitude" value={lat || ''} />
          <input type="hidden" name="longitude" value={lng || ''} />
        </div>

        {/* Campo de Archivo (Imagen/Video) */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="file" style={{ display: 'block', marginBottom: '5px' }}>Imagen Principal</label>
          <input
            id="file"
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            required
            style={{ width: '100%', padding: '8px', color: '#333' }}
          />
        </div>

        <hr style={{ margin: '20px 0' }} />

        {/* Muestra errores si existen */}
        {error && <p style={{ color: 'red', marginBottom: '10px' }}>Error: {error}</p>}

        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 mt-6 mb-6">
          <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
            🛡️ ¿Cómo quieres que te contacten?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OPCIÓN 1: Agente Inteligente (Recomendado) */}
            <label className="relative flex p-4 cursor-pointer rounded-lg border-2 bg-white transition-all hover:shadow-md border-indigo-500 ring-1 ring-indigo-500">
              <input type="radio" name="contact_preference" value="agente_ia" defaultChecked className="mt-1 mr-3 text-indigo-600 focus:ring-indigo-500" />
              <div>
                <span className="block font-bold text-gray-900">Agente IA (Filtro) ✨</span>
                <span className="block text-xs text-gray-500 mt-1">
                  El asistente responde dudas, pregunta por financiamiento y filtra curiosos. Solo te notifica prospectos reales.
                </span>
              </div>
              <span className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-bl-lg rounded-tr-md font-bold">
                RECOMENDADO
              </span>
            </label>

            {/* OPCIÓN 2: WhatsApp Directo */}
            <label className="relative flex p-4 cursor-pointer rounded-lg border-2 border-gray-200 bg-white transition-all hover:border-gray-400">
              <input type="radio" name="contact_preference" value="whatsapp_directo" className="mt-1 mr-3 text-gray-600 focus:ring-gray-500" />
              <div>
                <span className="block font-bold text-gray-900">WhatsApp Directo</span>
                <span className="block text-xs text-gray-500 mt-1">
                  Los interesados verán tu botón de WhatsApp de inmediato. Recibirás todos los mensajes sin filtro.
                </span>
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ width: '100%', padding: '10px 20px', fontSize: '16px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {isSubmitting ? 'Guardando...' : 'Crear Anuncio y Activar'}
        </button>
      </form>
    </div>
  );
}

export default function AnuncioPage() {
  return (
    <Suspense fallback={<div>Cargando formulario...</div>}>
      <AnuncioForm />
    </Suspense>
  );
}

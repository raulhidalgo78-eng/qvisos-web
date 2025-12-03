// En: app/anuncio/page.tsx

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
    setIsGenerating(true);
    // Recolectamos los datos actuales del formulario
    const form = document.querySelector('form');
    if (!form) return;

    const formData = new FormData(form);
    const features = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        body: JSON.stringify({
          category: category === 'autos' ? 'Autos' : 'Propiedades',
          features: features,
          extraNotes: extraNotes
        })
      });
      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
      }
    } catch (e) {
      alert('Error al generar descripción');
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
    else if (urlTipo.includes('propiedad')) setCategory('inmuebles');
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
      features.aire_acondicionado = formData.get('aire_acondicionado') === 'on';
    } else if (category === 'inmuebles') {
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
            name="descripcion"
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="La descripción generada aparecerá aquí..."
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
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
                  <option value="bencina">Bencina</option>
                  <option value="diesel">Diesel</option>
                  <option value="hibrido">Híbrido</option>
                  <option value="electrico">Eléctrico</option>
                  <option value="gas">Gas (GLP/GNC)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Carrocería</label>
                <select name="carroceria" className="w-full p-2 border rounded">
                  <option value="sedan">Sedán</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="suv">SUV</option>
                  <option value="camioneta">Camioneta</option>
                  <option value="coupe">Coupé</option>
                  <option value="convertible">Convertible</option>
                  <option value="furgon">Furgón</option>
                </select>
              </div>
            </div>

            {/* Fila 4: Checkboxes */}
            <div className="flex gap-4 pt-2 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" name="unico_dueno" className="w-4 h-4 text-blue-600 rounded" />
                Único Dueño
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" name="papeles_al_dia" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                Papeles al día
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" name="aire_acondicionado" className="w-4 h-4 text-blue-600 rounded" />
                Aire Acondicionado
              </label>
            </div>
          </div>
        )}

        {/* CAMPOS ESPECÍFICOS: PROPIEDAD */}
        {/* CAMPOS ESPECÍFICOS: PROPIEDAD */}
        {showPropertyFields && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-700">Detalles de la Propiedad</h3>

            {/* Fila 1: Tipo y Orientación */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo de Propiedad</label>
                <select name="tipo_propiedad" className="w-full p-2 border rounded bg-white">
                  <option value="Departamento">Departamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Parcela">Parcela</option>
                  <option value="Oficina">Oficina</option>
                  <option value="Local">Local Comercial</option>
                  <option value="Terreno">Terreno Urbano</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Orientación (Sol)</label>
                <select name="orientacion" className="w-full p-2 border rounded bg-white">
                  <option value="">Seleccione...</option>
                  <option value="Norte">Norte (Sol todo el día)</option>
                  <option value="Nor-Oriente">Nor-Oriente (Sol mañana)</option>
                  <option value="Nor-Poniente">Nor-Poniente (Sol tarde)</option>
                  <option value="Sur">Sur (Fresco)</option>
                  <option value="Oriente">Oriente</option>
                  <option value="Poniente">Poniente</option>
                </select>
              </div>
            </div>

            {/* Fila 2: Superficies y Habitaciones */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">m² Útiles</label>
                  <input name="m2_utiles" type="number" className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">m² Totales</label>
                  <input name="m2_totales" type="number" className="w-full p-2 border rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Dormitorios</label>
                  <input name="dormitorios" type="number" className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Baños</label>
                  <input name="banos" type="number" className="w-full p-2 border rounded" />
                </div>
              </div>
            </div>

            {/* Fila 3: Extras */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Estacionamientos</label>
                <input name="estacionamientos" type="number" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Bodegas</label>
                <input name="bodegas" type="number" className="w-full p-2 border rounded" />
              </div>
            </div>

            {/* Fila 4: Costos Mensuales */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Gastos Comunes ($)</label>
                <input name="gastos_comunes" type="number" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Contribuciones ($)</label>
                <input name="contribuciones" type="number" className="w-full p-2 border rounded" />
              </div>
            </div>

            {/* Fila 5: Checkboxes y Amenities */}
            <div className="space-y-2 pt-2">
              <div className="flex gap-4 flex-wrap">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="recepcion_final" className="rounded text-gray-600" />
                  <span className="text-sm text-gray-600">Recepción Final</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="mascotas" className="rounded text-gray-600" />
                  <span className="text-sm text-gray-600">Mascotas Permitidas</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="amoblado" className="rounded text-gray-600" />
                  <span className="text-sm text-gray-600">Amoblado</span>
                </label>
              </div>
              <div className="flex gap-4 flex-wrap border-t pt-2 mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="conserjeria" className="rounded text-gray-600" />
                  <span className="text-sm text-gray-600">Conserjería 24/7</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="quincho" className="rounded text-gray-600" />
                  <span className="text-sm text-gray-600">Quincho / Asados</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="piscina" className="rounded text-gray-600" />
                  <span className="text-sm text-gray-600">Piscina</span>
                </label>
              </div>
            </div>
          </div>
        )}

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

// Archivo: app/anuncio/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

function AnuncioForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- LÓGICA DE NEGOCIO (URL) ---
  const codigoQR = searchParams.get('code');
  const tipoUrl = searchParams.get('tipo');

  // --- ESTADOS GENERALES ---
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(tipoUrl?.includes('propiedad') ? 'propiedad' : 'auto');
  const [description, setDescription] = useState('');

  // --- ESTADOS ESPECÍFICOS (PROPIEDADES) ---
  const [m2Total, setM2Total] = useState('');
  const [rooms, setRooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [propType, setPropType] = useState('departamento'); // casa, depto, parcela

  // --- ESTADOS ESPECÍFICOS (AUTOS) ---
  const [year, setYear] = useState('');
  const [km, setKm] = useState('');
  const [transmission, setTransmission] = useState('automatica');
  const [fuel, setFuel] = useState('bencina');

  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // --- VERIFICACIÓN DE SESIÓN ---
  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        const returnPath = `/anuncio?code=${codigoQR || ''}&tipo=${tipoUrl || ''}`;
        router.push(`/login?returnUrl=${encodeURIComponent(returnPath)}`);
        return;
      }
      setUserId(session.user.id);
    };
    checkUserSession();
  }, [router, codigoQR, tipoUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setPhotos(Array.from(e.target.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!userId) return;

    try {
      // 1. Preparar el objeto de detalles (JSON)
      let details = {};
      if (category === 'propiedad') {
        details = { m2Total, rooms, bathrooms, type: propType };
      } else {
        details = { year, km, transmission, fuel };
      }

      // 2. Insertar en Supabase
      // Nota: Guardamos 'details' en la columna JSONB 'details' si existe, 
      // o concatenamos en la descripción para el MVP.
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .insert({
          title,
          price: parseFloat(price),
          category,
          user_id: userId,
          status: 'draft',
          qr_code: codigoQR || null,
          description: description, // Descripción libre
          details: details          // Datos estructurados (Asegúrate de tener esta columna JSONB o ignórala si no)
        })
        .select('id')
        .single();

      if (adError) throw adError;

      // 3. Subir Foto
      if (photos.length > 0) {
        const formData = new FormData();
        formData.append('adId', adData.id);
        formData.append('mediaType', 'image');
        formData.append('file', photos[0]);

        const uploadRes = await fetch('/api/upload/media', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error('Error al subir imagen');

        await supabase.from('ads').update({ status: 'pending_verification' }).eq('id', adData.id);
      }

      setMessage('✅ ¡Anuncio completo enviado!');
      setTimeout(() => router.push('/mis-anuncios'), 2000);

    } catch (error: any) {
      console.error(error);
      setMessage(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  if (!userId) return <div className="p-10 text-center">Cargando sesión...</div>;

  return (
    <div className="max-w-3xl mx-auto p-5 font-sans">
      <h1 className="text-2xl font-bold text-blue-600 mb-6">Publicar Nuevo Qviso</h1>

      {/* Banner KIT QR */}
      {codigoQR && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-6 flex items-center gap-3">
          <span className="text-2xl">🔗</span>
          <div>
            <div className="font-bold">Kit Vinculado: {codigoQR}</div>
            <div className="text-sm opacity-90 uppercase">Categoría: {tipoUrl?.replace('-', ' ') || 'GENERAL'}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 1. INFORMACIÓN BÁSICA */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-700 border-b pb-2">1. Datos Principales</h2>
          <div>
            <label className="block text-sm font-semibold mb-1">Título del Aviso</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder={category === 'auto' ? "Ej: Toyota RAV4 2020 Impecable" : "Ej: Depto 2D/2B en Centro"}
              required className="w-full p-3 border rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Precio (CLP)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                required className="w-full p-3 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Categoría</label>
              <select value={category} onChange={e => setCategory(e.target.value)} disabled={!!tipoUrl}
                className={`w-full p-3 border rounded-md ${tipoUrl ? 'bg-gray-100' : 'bg-white'}`}>
                <option value="auto">Vehículo</option>
                <option value="propiedad">Propiedad</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Descripción Detallada</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={3} placeholder="Cuenta más detalles sobre el estado, ubicación exacta, o extras..."
              className="w-full p-3 border rounded-md"></textarea>
          </div>
        </div>

        {/* 2. DATOS ESPECÍFICOS (CONDICIONALES) */}
        <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 shadow-sm space-y-4">
          <h2 className="font-bold text-blue-800 border-b border-blue-200 pb-2">
            2. Detalles de {category === 'propiedad' ? 'la Propiedad' : 'el Vehículo'}
          </h2>

          {category === 'propiedad' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Tipo</label>
                <select value={propType} onChange={e => setPropType(e.target.value)} className="w-full p-3 border rounded-md">
                  <option value="casa">Casa</option>
                  <option value="departamento">Departamento</option>
                  <option value="parcela">Parcela / Terreno</option>
                  <option value="comercial">Local / Oficina</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Superficie (m²)</label>
                <input type="number" value={m2Total} onChange={e => setM2Total(e.target.value)} placeholder="Total" className="w-full p-3 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Habitaciones</label>
                <input type="number" value={rooms} onChange={e => setRooms(e.target.value)} className="w-full p-3 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Baños</label>
                <input type="number" value={bathrooms} onChange={e => setBathrooms(e.target.value)} className="w-full p-3 border rounded-md" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Año</label>
                <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2020" className="w-full p-3 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Kilometraje</label>
                <input type="number" value={km} onChange={e => setKm(e.target.value)} placeholder="Ej: 45000" className="w-full p-3 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Transmisión</label>
                <select value={transmission} onChange={e => setTransmission(e.target.value)} className="w-full p-3 border rounded-md">
                  <option value="automatica">Automática</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Combustible</label>
                <select value={fuel} onChange={e => setFuel(e.target.value)} className="w-full p-3 border rounded-md">
                  <option value="bencina">Bencina</option>
                  <option value="diesel">Diesel</option>
                  <option value="electrico">Eléctrico / Híbrido</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 3. FOTOGRAFÍA */}
        <div className="border-2 dashed border-gray-300 p-8 rounded-lg text-center bg-gray-50 hover:bg-gray-100 transition">
          <p className="text-gray-600 mb-2 font-medium">📸 Foto Principal (Portada)</p>
          <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 shadow-lg transition transform active:scale-95 disabled:opacity-50">
          {loading ? 'Guardando y Vinculando...' : 'Publicar Aviso'}
        </button>
      </form>

      {message && (
        <div className={`mt-6 p-4 rounded-lg text-center font-bold ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default function CreateAdPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-500">Cargando formulario inteligente...</div>}>
      <AnuncioForm />
    </Suspense>
  );
}
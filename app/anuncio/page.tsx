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

  // --- ESTADOS ESPECÍFICOS (PROPIEDADES CHILE) ---
  const [m2Total, setM2Total] = useState('');
  const [rooms, setRooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [propType, setPropType] = useState('departamento');
  const [ggcc, setGgcc] = useState(''); // Gastos Comunes
  const [parking, setParking] = useState(false);
  const [bodega, setBodega] = useState(false);
  const [orientation, setOrientation] = useState('Norte');

  // --- ESTADOS ESPECÍFICOS (AUTOS CHILE) ---
  const [year, setYear] = useState('');
  const [km, setKm] = useState('');
  const [transmission, setTransmission] = useState('automatica');
  const [fuel, setFuel] = useState('bencina');
  const [owners, setOwners] = useState('1'); // Dueños
  const [legalStatus, setLegalStatus] = useState('al_dia'); // Papeles
  const [patenteDigit, setPatenteDigit] = useState('');

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
      // 1. Preparar el objeto de detalles (JSON estructurado)
      let details = {};
      if (category === 'propiedad') {
        details = {
          m2Total, rooms, bathrooms, type: propType,
          ggcc, parking, bodega, orientation // Datos CL
        };
      } else {
        details = {
          year, km, transmission, fuel,
          owners, legalStatus, patenteDigit // Datos CL
        };
      }

      // 2. Insertar en Supabase
      // Concatenamos info clave en la descripción para búsquedas simples si no hay búsqueda JSON
      const extraDesc = category === 'propiedad'
        ? `GGCC: $${ggcc} | Estac: ${parking ? 'Sí' : 'No'}`
        : `Papeles: ${legalStatus.replace('_', ' ')} | Dueños: ${owners}`;

      const finalDescription = `${description}\n\n--- Detalles ---\n${extraDesc}`;

      const { data: adData, error: adError } = await supabase
        .from('ads')
        .insert({
          title,
          price: parseFloat(price),
          category,
          user_id: userId,
          status: 'draft',
          qr_code: codigoQR || null,
          description: finalDescription,
          details: details
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

      setMessage('✅ ¡Anuncio publicado exitosamente!');
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

        {/* 1. DATOS PRINCIPALES */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-700 border-b pb-2">1. Lo Básico</h2>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder={category === 'auto' ? "Ej: Mazda CX-5 2021 Único Dueño" : "Ej: Depto en Las Condes con Estacionamiento"}
            required className="w-full p-3 border rounded-md" />

          <div className="grid grid-cols-2 gap-4">
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Precio (CLP)" required className="w-full p-3 border rounded-md" />
            <select value={category} onChange={e => setCategory(e.target.value)} disabled={!!tipoUrl}
              className={`w-full p-3 border rounded-md ${tipoUrl ? 'bg-gray-100' : 'bg-white'}`}>
              <option value="auto">Vehículo</option>
              <option value="propiedad">Propiedad</option>
            </select>
          </div>
        </div>

        {/* 2. DETALLES ESPECÍFICOS (MODO CHILE) */}
        <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 shadow-sm space-y-4">
          <h2 className="font-bold text-blue-800 border-b border-blue-200 pb-2">
            2. Detalles {category === 'propiedad' ? 'Propiedad' : 'Vehículo'}
          </h2>

          {category === 'propiedad' ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <select value={propType} onChange={e => setPropType(e.target.value)} className="w-full p-3 border rounded-md col-span-2">
                  <option value="departamento">Departamento</option>
                  <option value="casa">Casa</option>
                  <option value="parcela">Parcela / Terreno</option>
                  <option value="oficina">Oficina / Local</option>
                </select>
                <input type="number" value={m2Total} onChange={e => setM2Total(e.target.value)} placeholder="m² Totales" className="w-full p-3 border rounded-md" />
                <input type="number" value={ggcc} onChange={e => setGgcc(e.target.value)} placeholder="$ Gastos Comunes" className="w-full p-3 border rounded-md border-blue-300" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input type="number" value={rooms} onChange={e => setRooms(e.target.value)} placeholder="Dormitorios" className="w-full p-3 border rounded-md" />
                <input type="number" value={bathrooms} onChange={e => setBathrooms(e.target.value)} placeholder="Baños" className="w-full p-3 border rounded-md" />

                <div className="flex items-center gap-2 bg-white p-3 rounded border">
                  <input type="checkbox" id="chk_parking" checked={parking} onChange={e => setParking(e.target.checked)} className="w-5 h-5" />
                  <label htmlFor="chk_parking" className="text-sm cursor-pointer">Estacionamiento</label>
                </div>
                <div className="flex items-center gap-2 bg-white p-3 rounded border">
                  <input type="checkbox" id="chk_bodega" checked={bodega} onChange={e => setBodega(e.target.checked)} className="w-5 h-5" />
                  <label htmlFor="chk_bodega" className="text-sm cursor-pointer">Bodega</label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Orientación (Sol)</label>
                <select value={orientation} onChange={e => setOrientation(e.target.value)} className="w-full p-3 border rounded-md">
                  <option value="Norte">Norte (Sol todo el día)</option>
                  <option value="Oriente">Oriente (Sol mañana)</option>
                  <option value="Poniente">Poniente (Sol tarde)</option>
                  <option value="Sur">Sur (Fresco)</option>
                </select>
              </div>
            </>
          ) : (
            // FORMULARIO AUTO
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="Año (Ej: 2019)" className="w-full p-3 border rounded-md" />
                <input type="number" value={km} onChange={e => setKm(e.target.value)} placeholder="Kilometraje" className="w-full p-3 border rounded-md" />
                <select value={transmission} onChange={e => setTransmission(e.target.value)} className="w-full p-3 border rounded-md">
                  <option value="automatica">Automática</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Estado Legal</label>
                  <select value={legalStatus} onChange={e => setLegalStatus(e.target.value)} className={`w-full p-3 border rounded-md ${legalStatus !== 'al_dia' ? 'border-red-400 bg-red-50' : 'border-green-400 bg-green-50'}`}>
                    <option value="al_dia">✅ Papeles al día (Sin multas)</option>
                    <option value="atrasado">⚠️ Papeles Atrasados</option>
                    <option value="multas">🛑 Con Multas / Prenda</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Dueños Anteriores</label>
                  <input type="number" value={owners} onChange={e => setOwners(e.target.value)} placeholder="Ej: 1 (Único dueño)" className="w-full p-3 border rounded-md" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* 3. DESCRIPCIÓN Y FOTO */}
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          rows={4} placeholder="Describe lo que no se ve en las fotos: Estado de mantenciones, cercanía a metro, etc."
          className="w-full p-3 border rounded-md bg-gray-50 border-gray-200"></textarea>

        <div className="border-2 dashed border-gray-300 p-8 rounded-lg text-center bg-gray-50">
          <p className="text-gray-600 mb-2 font-medium">📸 Foto Principal</p>
          <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 shadow-md transition disabled:opacity-50">
          {loading ? 'Publicando...' : 'Publicar Aviso'}
        </button>
      </form>

      {message && <p className={`mt-4 text-center font-bold ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
    </div>
  );
}

export default function CreateAdPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-500">Cargando formulario...</div>}>
      <AnuncioForm />
    </Suspense>
  );
}
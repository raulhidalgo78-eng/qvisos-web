// Archivo: app/anuncio/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
// Importamos iconos visuales
import {
  Car, Home, Bed, Bath, Warehouse, Square,
  MapPin, Calendar, Gauge, Fuel, Settings,
  FileCheck, Users, UploadCloud, CheckCircle,
  Coins // Nuevo icono para moneda
} from 'lucide-react';

function AnuncioForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- LÓGICA DE NEGOCIO ---
  const codigoQR = searchParams.get('code');
  const tipoUrl = searchParams.get('tipo');

  // --- ESTADOS ---
  const [title, setTitle] = useState('');

  // MONEDA Y PRECIO
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('CLP'); // CLP, UF, USD

  const [category, setCategory] = useState(tipoUrl?.includes('propiedad') ? 'propiedad' : 'auto');
  const [description, setDescription] = useState('');

  // Propiedades
  const [m2Total, setM2Total] = useState('');
  const [rooms, setRooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [propType, setPropType] = useState('departamento');
  const [ggcc, setGgcc] = useState('');
  const [parking, setParking] = useState(false);
  const [bodega, setBodega] = useState(false);
  const [orientation, setOrientation] = useState('Norte');

  // Autos
  const [year, setYear] = useState('');
  const [km, setKm] = useState('');
  const [transmission, setTransmission] = useState('automatica');
  const [fuel, setFuel] = useState('bencina');
  const [owners, setOwners] = useState('1');
  const [legalStatus, setLegalStatus] = useState('al_dia');

  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // --- SESIÓN ---
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
    if (!userId) return;

    try {
      let details = {};
      // Guardamos la moneda en los detalles
      const commonDetails = { currency };

      if (category === 'propiedad') {
        details = { ...commonDetails, m2Total, rooms, bathrooms, type: propType, ggcc, parking, bodega, orientation };
      } else {
        details = { ...commonDetails, year, km, transmission, fuel, owners, legalStatus };
      }

      // Descripción enriquecida
      const precioFmt = `${currency} ${parseFloat(price).toLocaleString('es-CL')}`;
      const extraDesc = category === 'propiedad'
        ? `Precio: ${precioFmt} | Tipo: ${propType} | GGCC: $${ggcc} | Estac: ${parking ? 'Sí' : 'No'}`
        : `Precio: ${precioFmt} | Año: ${year} | Km: ${km} | Papeles: ${legalStatus}`;

      const finalDescription = `${description}\n\n--- Resumen Técnico ---\n${extraDesc}`;

      const { data: adData, error: adError } = await supabase
        .from('ads')
        .insert({
          title,
          price: parseFloat(price), // Guardamos el número puro
          category,
          user_id: userId,
          status: 'draft',
          qr_code: codigoQR || null,
          description: finalDescription,
          details: details // Aquí va la moneda
        })
        .select('id').single();

      if (adError) throw adError;

      if (photos.length > 0) {
        const file = photos[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${adData.id}/image_${Date.now()}.${fileExt}`;

        // 1. SUBIDA DIRECTA DESDE EL CLIENTE (Mantiene Auth)
        const { error: uploadError } = await supabase.storage
          .from('qvisos-media')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Error subiendo imagen:', uploadError);
          // No lanzamos error fatal para que el anuncio se guarde aunque falle la foto
          setMessage('⚠️ Anuncio guardado, pero hubo un error con la imagen.');
        } else {
          // 2. Si sube bien, actualizamos el estado
          await supabase
            .from('ads')
            .update({ status: 'pending_verification' })
            .eq('id', adData.id);
        }
      }

      setMessage('✅ ¡Anuncio Publicado!');
      setTimeout(() => router.push('/mis-anuncios'), 2000);

    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  if (!userId) return <div className="p-10 text-center animate-pulse">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans text-gray-800">
      <h1 className="text-3xl font-extrabold text-blue-700 mb-8 text-center">Crear Nuevo Qviso</h1>

      {codigoQR && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl mb-8 flex items-center gap-4 shadow-sm">
          <div className="bg-white p-2 rounded-full shadow-sm"><CheckCircle className="w-6 h-6 text-emerald-500" /></div>
          <div>
            <div className="font-bold text-lg">Kit Vinculado: {codigoQR}</div>
            <div className="text-sm opacity-80 uppercase tracking-wide">Categoría: {tipoUrl?.replace('-', ' ') || 'GENERAL'}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* 1. SELECCIÓN VISUAL DE CATEGORÍA */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider">1. ¿Qué publicas?</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => !tipoUrl && setCategory('auto')}
              disabled={!!tipoUrl}
              className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${category === 'auto' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md transform scale-105' : 'border-gray-200 hover:border-blue-300 text-gray-500'}`}
            >
              <Car size={40} strokeWidth={1.5} />
              <span className="font-bold text-lg">Vehículo</span>
            </button>
            <button
              type="button"
              onClick={() => !tipoUrl && setCategory('propiedad')}
              disabled={!!tipoUrl}
              className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${category === 'propiedad' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md transform scale-105' : 'border-gray-200 hover:border-blue-300 text-gray-500'}`}
            >
              <Home size={40} strokeWidth={1.5} />
              <span className="font-bold text-lg">Propiedad</span>
            </button>
          </div>
        </div>

        {/* 2. DATOS PRINCIPALES */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
          <h2 className="font-bold text-xl text-gray-800 border-b pb-3 mb-2 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" /> Información Básica
          </h2>

          <div>
            <label className="block text-sm font-bold mb-2">Título del Aviso</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder={category === 'auto' ? "Ej: Suzuki Swift 2021 GLX" : "Ej: Casa en Condominio Peñalolén"}
              required className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-sm font-bold mb-2">Precio</label>
              <div className="flex">
                <div className="relative w-1/3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Coins className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full pl-10 p-4 border border-gray-300 rounded-l-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                  >
                    <option value="CLP">CLP ($)</option>
                    <option value="UF">UF</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div className="relative w-2/3">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={currency === 'UF' ? 'Ej: 3500' : 'Ej: 12000000'}
                    className="w-full p-4 border border-l-0 border-gray-300 rounded-r-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. DETALLES ESPECÍFICOS CON ICONOS */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner space-y-5">
          <h2 className="font-bold text-xl text-slate-700 border-b border-slate-200 pb-3 mb-2 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" />
            Detalles {category === 'propiedad' ? 'de la Propiedad' : 'del Auto'}
          </h2>

          {category === 'propiedad' ? (
            <>
              {/* Grid Propiedades */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Home className="w-3 h-3" /> Tipo</label>
                  <select value={propType} onChange={e => setPropType(e.target.value)} className="w-full p-3 rounded-lg border border-slate-300">
                    <option value="departamento">Departamento</option>
                    <option value="casa">Casa</option>
                    <option value="parcela">Parcela</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Square className="w-3 h-3" /> M² Total</label>
                  <input type="number" value={m2Total} onChange={e => setM2Total(e.target.value)} className="w-full p-3 rounded-lg border border-slate-300" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">💰 GGCC</label>
                  <input type="number" value={ggcc} onChange={e => setGgcc(e.target.value)} placeholder="$ Aprox" className="w-full p-3 rounded-lg border border-slate-300" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Bed className="w-3 h-3" /> Dorms</label>
                  <input type="number" value={rooms} onChange={e => setRooms(e.target.value)} className="w-full p-3 rounded-lg border border-slate-300" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Bath className="w-3 h-3" /> Baños</label>
                  <input type="number" value={bathrooms} onChange={e => setBathrooms(e.target.value)} className="w-full p-3 rounded-lg border border-slate-300" />
                </div>

                {/* Botones Toggle Visuales */}
                <button type="button" onClick={() => setParking(!parking)}
                  className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all ${parking ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400'}`}>
                  <Car className="w-5 h-5 mb-1" /> <span className="text-xs font-bold">Estacionamiento</span>
                </button>
                <button type="button" onClick={() => setBodega(!bodega)}
                  className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all ${bodega ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400'}`}>
                  <Warehouse className="w-5 h-5 mb-1" /> <span className="text-xs font-bold">Bodega</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Grid Autos - ACTUALIZADO CON COMBUSTIBLE */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* 1. Año */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Año
                  </label>
                  <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2021" className="w-full p-3 rounded-lg border border-slate-300" />
                </div>

                {/* 2. Kilometraje */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <Gauge className="w-3 h-3" /> Km
                  </label>
                  <input type="number" value={km} onChange={e => setKm(e.target.value)} className="w-full p-3 rounded-lg border border-slate-300" />
                </div>

                {/* 3. Transmisión */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <Settings className="w-3 h-3" /> Caja
                  </label>
                  <select value={transmission} onChange={e => setTransmission(e.target.value)} className="w-full p-3 rounded-lg border border-slate-300">
                    <option value="automatica">Automática</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                {/* 4. COMBUSTIBLE (NUEVO) */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <Fuel className="w-3 h-3" /> Combustible
                  </label>
                  <select value={fuel} onChange={e => setFuel(e.target.value)} className="w-full p-3 rounded-lg border border-slate-300">
                    <option value="bencina">Bencina</option>
                    <option value="diesel">Diesel</option>
                    <option value="electrico">Eléctrico</option>
                    <option value="hibrido">Híbrido</option>
                  </select>
                </div>

                {/* 5. Situación Legal */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <FileCheck className="w-3 h-3" /> Papeles
                  </label>
                  <select value={legalStatus} onChange={e => setLegalStatus(e.target.value)} className="w-full p-3 rounded-lg border border-slate-300">
                    <option value="al_dia">✅ Al día</option>
                    <option value="atrasado">⚠️ Atrasado</option>
                    <option value="multas">🛑 Con Multas</option>
                  </select>
                </div>

                {/* 6. Dueños */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Dueños
                  </label>
                  <input type="number" value={owners} onChange={e => setOwners(e.target.value)} className="w-full p-3 rounded-lg border border-slate-300" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* 4. FOTO */}
        <div className="relative border-3 border-dashed border-blue-200 p-10 rounded-2xl text-center bg-blue-50 hover:bg-blue-100 transition cursor-pointer group">
          <div className="flex flex-col items-center justify-center gap-3">
            <UploadCloud className="w-12 h-12 text-blue-400 group-hover:text-blue-600 transition" />
            <p className="text-blue-800 font-bold text-lg">Sube tu Foto Principal</p>
            <p className="text-sm text-blue-600">Haz clic o arrastra la imagen aquí</p>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
          />
          {photos.length > 0 && (
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <p className="text-green-600 font-bold text-sm bg-white/80 inline-block px-2 rounded">
                ✅ Imagen seleccionada
              </p>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-extrabold text-xl shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:scale-100">
          {loading ? 'Subiendo...' : '🚀 Publicar Aviso'}
        </button>
      </form>

      {message && <div className={`mt-6 p-4 rounded-xl text-center font-bold ${message.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}
    </div>
  );
}

export default function CreateAdPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-blue-600">Cargando...</div>}>
      <AnuncioForm />
    </Suspense>
  );
}
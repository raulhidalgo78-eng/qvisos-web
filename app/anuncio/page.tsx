'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

// --- 1. LÓGICA DEL FORMULARIO (CLIENT COMPONENT) ---
function AnuncioForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // RECUPERACIÓN DE LÓGICA DE NEGOCIO
  const codigoQR = searchParams.get('code');
  const tipoUrl = searchParams.get('tipo'); // ej: 'propiedad-venta'

  // ESTADOS
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  // Autoselección inteligente: Si la URL dice propiedad, marcamos propiedad.
  const [category, setCategory] = useState(tipoUrl?.includes('propiedad') ? 'propiedad' : 'auto');

  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // SEGURIDAD: Verificar sesión y redirección inteligente
  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        // Si no hay sesión, mandamos al login PERO guardamos los parámetros del QR
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
      // 1. Guardar Anuncio (Draft + QR)
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .insert({
          title,
          price: parseFloat(price),
          category,
          user_id: userId,
          status: 'draft',
          qr_code: codigoQR || null // Vinculación en BDD
        })
        .select('id')
        .single();

      if (adError) throw adError;

      // 2. Subir Foto (Si existe)
      if (photos.length > 0) {
        const formData = new FormData();
        formData.append('adId', adData.id);
        formData.append('mediaType', 'image');
        formData.append('file', photos[0]);

        const uploadRes = await fetch('/api/upload/media', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) throw new Error('Error al subir imagen');

        // Activar verificación
        await supabase.from('ads').update({ status: 'pending_verification' }).eq('id', adData.id);
      }

      setMessage('✅ ¡Anuncio vinculado y enviado!');
      setTimeout(() => router.push('/mis-anuncios'), 2000);

    } catch (error: any) {
      console.error(error);
      setMessage(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  if (!userId) return <div className="p-10 text-center">Cargando sesión...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#0070f3', marginBottom: '20px' }}>Publicar Nuevo Qviso</h1>

      {/* FEEDBACK VISUAL DE VINCULACIÓN (Lo que faltaba) */}
      {codigoQR && (
        <div style={{ background: '#e6fffa', border: '1px solid #38b2ac', color: '#2c7a7b', padding: '15px', borderRadius: '8px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🔗</span>
          <div>
            <strong>Kit Vinculado: {codigoQR}</strong>
            <div style={{ fontSize: '0.9em', opacity: 0.9 }}>
              Categoría detectada: {tipoUrl?.replace('-', ' ').toUpperCase() || 'GENERAL'}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Título</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={category === 'auto' ? "Ej: Kia Morning 2023" : "Ej: Depto en Viña del Mar"}
            required
            style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Precio (CLP)</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Categoría</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              // Bloqueamos si viene del QR para evitar errores
              disabled={!!tipoUrl}
              style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '6px', background: tipoUrl ? '#f0f0f0' : 'white', cursor: tipoUrl ? 'not-allowed' : 'pointer' }}
            >
              <option value="auto">Vehículo</option>
              <option value="propiedad">Propiedad</option>
            </select>
          </div>
        </div>

        <div style={{ border: '2px dashed #ccc', padding: '30px', borderRadius: '8px', textAlign: 'center', marginTop: '10px' }}>
          <p style={{ marginBottom: '10px', color: '#666' }}>📸 Sube la foto principal</p>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: '20px', padding: '15px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
        >
          {loading ? 'Subiendo...' : 'Guardar y Publicar'}
        </button>
      </form>

      {message && <p style={{ marginTop: '20px', fontWeight: 'bold', textAlign: 'center', color: message.startsWith('✅') ? 'green' : 'red' }}>{message}</p>}
    </div>
  );
}

// --- 2. SOLUCIÓN FINAL ERROR #310 (SUSPENSE) ---
export default function CreateAdPage() {
  return (
    <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>Cargando formulario inteligente...</div>}>
      <AnuncioForm />
    </Suspense>
  );
}
// Archivo: app/anuncio/page.tsx

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

// --- COMPONENTE INTERNO (El que lee la URL) ---
function AnuncioForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Esto es lo que causa el error si no hay Suspense
  const codigoQR = searchParams.get('code');

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('auto');
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Verificar sesión
  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        // Si no hay sesión, guardamos a donde iba y mandamos al login
        router.push(`/login?returnUrl=/anuncio`);
        return;
      }
      setUserId(session.user.id);
    };
    checkUserSession();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setPhotos(Array.from(e.target.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!userId) { setMessage('Error de sesión'); setLoading(false); return; }

    try {
      // 1. Guardar datos
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .insert({
          title,
          price: parseFloat(price),
          category,
          user_id: userId,
          status: 'draft'
        })
        .select('id')
        .single();

      if (adError) throw adError;

      // 2. Subir imagen (si hay)
      if (photos.length > 0) {
        const formData = new FormData();
        formData.append('adId', adData.id);
        formData.append('mediaType', 'image');
        formData.append('file', photos[0]);

        await fetch('/api/upload/media', { method: 'POST', body: formData });

        // Actualizar estado
        await supabase.from('ads').update({ status: 'pending_verification' }).eq('id', adData.id);
      }

      setMessage('✅ Anuncio enviado correctamente.');
      setTimeout(() => router.push('/mis-anuncios'), 2000);

    } catch (error: any) {
      console.error(error);
      setMessage(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  if (!userId) return <div className="p-10">Cargando sesión...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h1 style={{ color: '#0070f3' }}>Publicar Aviso</h1>
      {codigoQR && <div style={{ background: '#eef', padding: '10px', marginBottom: '20px' }}>🏷️ Kit QR detectado: {codigoQR}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="text" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} required style={{ padding: '10px' }} />
        <input type="number" placeholder="Precio" value={price} onChange={e => setPrice(e.target.value)} required style={{ padding: '10px' }} />
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '10px' }}>
          <option value="auto">Vehículo</option>
          <option value="propiedad">Propiedad</option>
        </select>
        <div style={{ border: '1px dashed #ccc', padding: '10px' }}>
          <label>Foto Principal:</label>
          <input type="file" onChange={handleFileChange} style={{ marginTop: '5px' }} />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '12px', background: '#0070f3', color: 'white', border: 'none' }}>{loading ? 'Enviando...' : 'Publicar'}</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

// --- ESTA ES LA PARTE QUE ARREGLA VERCEL ---
export default function CreateAdPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <AnuncioForm />
    </Suspense>
  );
}
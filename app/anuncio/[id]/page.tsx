import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import AdChat from '@/components/AdChat';
import AdActions from '@/components/AdActions';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ad, error } = await supabase
    .from('ads')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !ad) {
    notFound();
  }

  // Verificar si el usuario actual es el dueño
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user && user.id === ad.user_id;

  const colors = {
    primary: '#1a202c',
    success: '#10b981',
    textSecondary: '#4a5568',
    border: '#e2e8f0',
    white: '#ffffff',
    bg: '#f8f9fa',
  };

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto 20px auto' }}>
        <Link href="/" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
          ← Volver al Inicio
        </Link>
      </div>

      <div style={{
        maxWidth: '1024px', margin: 'auto', backgroundColor: colors.white,
        borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '0'
      }}>

        {/* COLUMNA IZQUIERDA: IMAGEN */}
        <div style={{ backgroundColor: '#f3f4f6', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {ad.media_url ? (
            <img src={ad.media_url} alt={ad.title} style={{ width: '100%', height: '100%', maxHeight: '600px', objectFit: 'contain' }} />
          ) : (
            <span style={{ color: '#9ca3af' }}>Sin imagen</span>
          )}
        </div>

        {/* COLUMNA DERECHA: INFO */}
        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column' }}>
          <span style={{ alignSelf: 'flex-start', padding: '4px 12px', borderRadius: '99px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.8rem', fontWeight: '600', marginBottom: '15px', textTransform: 'capitalize' }}>
            {ad.category || 'General'}
          </span>

          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: colors.primary, marginBottom: '10px', lineHeight: '1.1' }}>{ad.title}</h1>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: colors.success, marginBottom: '30px' }}>
            ${ad.price ? ad.price.toLocaleString('es-CL') : 'A convenir'}
          </p>

          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '20px', marginBottom: '30px', flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.primary, marginBottom: '10px' }}>Descripción</h3>
            <p style={{ color: colors.textSecondary, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{ad.description}</p>
          </div>

          {/* --- ZONA DE ACCIÓN --- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

            {/* Lógica Condicional: Dueño vs Visitante */}
            {isOwner ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h3 className="text-yellow-800 font-bold text-sm mb-2">👑 Eres el dueño de este aviso</h3>
                <AdActions adId={ad.id} />
                {/* Opcional: También puedes ver el chat para probarlo */}
                <div className="mt-4 pt-4 border-t border-yellow-200">
                  <p className="text-xs text-yellow-700 mb-2">Así ven el chat tus clientes:</p>
                  <AdChat adData={ad} />
                </div>
              </div>
            ) : (
              /* Caso 2: Soy VISITANTE -> Muestro el Chat para comprar */
              <AdChat adData={ad} />
            )}

            {/* 2. WHATSAPP (Solo si hay teléfono) */}
            {ad.contact_phone ? (
              <a
                href={`https://wa.me/${ad.contact_phone.replace(/\D/g, '')}?text=Hola, vi tu anuncio ${encodeURIComponent(ad.title)} en Qvisos.cl`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', width: '100%', padding: '15px', textAlign: 'center',
                  backgroundColor: '#25D366', color: 'white', textDecoration: 'none',
                  borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold',
                  boxShadow: '0 4px 6px -1px rgba(37, 211, 102, 0.3)'
                }}
              >
                Contactar por WhatsApp
              </a>
            ) : (
              <button disabled style={{ width: '100%', padding: '15px', backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'not-allowed' }}>
                Contacto no disponible
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
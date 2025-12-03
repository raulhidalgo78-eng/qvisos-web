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

  // Determinar preferencia de contacto (default: whatsapp_directo para anuncios antiguos)
  const contactPreference = ad.features?.contact_preference || 'whatsapp_directo';
  const showWhatsAppButton = contactPreference === 'whatsapp_directo' || isOwner; // El dueño siempre ve el botón

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

            {/* 2. WHATSAPP (Condicional) */}
            {ad.contact_phone && (
              /* Lógica: Si prefiere Agente IA, ocultamos el botón verde directo */
              ad.features?.contact_preference === 'agente_ia' && !isOwner ? (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-6 text-center shadow-sm">
                  <p className="text-blue-800 font-bold text-sm flex items-center justify-center gap-2">
                    <span>🤖</span> Contacto Gestionado por Agente
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Usa el chat de arriba para resolver dudas y agendar.
                  </p>
                </div>
              ) : (
                /* Botón Clásico de WhatsApp */
                <a
                  href={`https://wa.me/${ad.contact_phone.replace(/\D/g, '')}?text=Hola, vi tu anuncio ${encodeURIComponent(ad.title)} en Qvisos.cl`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl text-center transition-all shadow-md hover:shadow-lg mt-6 flex items-center justify-center gap-2"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                  Contactar por WhatsApp
                </a>
              )
            )}

            {!ad.contact_phone && (
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
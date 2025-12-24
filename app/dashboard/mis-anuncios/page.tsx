// En: app/dashboard/mis-anuncios/page.tsx

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import AdManageButtons from '@/components/AdManageButtons';

const ADMIN_USER_ID = '6411ba0e-5e36-4e4e-aa1f-4183a2f88d45';

export default async function MisAnunciosPage() {

  const supabase = await createClient();

  // 1. Auth Guard
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 2. Fetch Ads
  const { data: ads, error } = await supabase
    .from('ads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching ads:', error);
  }

  // --- ESTILOS ---
  const styles = {
    container: { padding: '40px 20px', maxWidth: '1024px', margin: 'auto', fontFamily: 'system-ui, sans-serif', color: '#333' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
    title: { fontSize: '2rem', fontWeight: '800', margin: 0 },
    subTitle: { color: '#666', marginTop: '5px' },
    createBtn: {
      backgroundColor: '#2563eb', color: 'white', padding: '12px 20px', borderRadius: '8px',
      textDecoration: 'none', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '8px',
      boxShadow: '0 4px 6px -1px rgb(37 99 235 / 0.2)'
    },
    adminBox: { marginBottom: '30px', padding: '15px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px' },
    grid: { display: 'grid', gap: '20px' },
    card: {
      display: 'flex', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden',
      border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)'
    },
    thumb: { width: '120px', height: '120px', objectFit: 'cover' as const, backgroundColor: '#f3f4f6' },
    thumbPlaceholder: { width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', color: '#9ca3af', fontSize: '0.8rem', textAlign: 'center' as const, padding: '5px' },
    cardBody: { padding: '20px', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardInfo: { display: 'flex', flexDirection: 'column' as const, gap: '5px' },
    cardTitle: { fontSize: '1.25rem', fontWeight: 'bold', margin: 0 },
    cardPrice: { fontSize: '1.1rem', color: '#059669', fontWeight: '600' },
    badge: (status: string) => ({
      display: 'inline-block', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' as const,
      backgroundColor: (status === 'aprobado' || status === 'verified') ? '#dcfce7' : '#fef9c3',
      color: (status === 'aprobado' || status === 'verified') ? '#166534' : '#854d0e',
      width: 'fit-content'
    }),
    actions: { display: 'flex', gap: '10px' },
    btnOutline: {
      padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', textDecoration: 'none',
      color: '#374151', fontSize: '0.9rem', fontWeight: '500', transition: 'background 0.2s'
    }
  };

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Mis Anuncios</h1>
          <p style={styles.subTitle}>Gestiona tus publicaciones activas</p>
        </div>
        <Link href="/anuncio" style={styles.createBtn}>
          + Activar Nuevo QR
        </Link>
      </div>

      {/* Panel Admin (Solo visible para ti) */}
      {user.id === ADMIN_USER_ID && (
        <div style={styles.adminBox}>
          <p style={{ margin: '0 0 10px 0', color: '#0369a1', fontWeight: 'bold' }}>👋 Modo Administrador</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/admin/dashboard" style={{ ...styles.btnOutline, backgroundColor: 'white', borderColor: '#0284c7', color: '#0284c7' }}>
              Ir a Aprobaciones
            </Link>
            <Link href="/admin/imprimir" style={{ ...styles.btnOutline, backgroundColor: 'white', borderColor: '#0284c7', color: '#0284c7' }}>
              Imprimir QRs
            </Link>
          </div>
        </div>
      )}

      {/* Lista de Anuncios */}
      <div style={styles.grid}>
        {ads && ads.length > 0 ? (
          ads.map((ad: any) => (
            <div key={ad.id} style={styles.card}>
              {/* Imagen Thumbnail */}
              {ad.media_url ? (
                <img src={ad.media_url} alt={ad.title} style={styles.thumb} />
              ) : (
                <div style={styles.thumbPlaceholder}>Sin imagen</div>
              )}

              <div style={styles.cardBody}>
                <div style={styles.cardInfo}>
                  <h3 style={styles.cardTitle}>{ad.title}</h3>
                  <span style={styles.badge(ad.status)}>{ad.status.replace('_', ' ')}</span>
                  <span style={styles.cardPrice}>${ad.price?.toLocaleString('es-CL') || '0'}</span>
                </div>

                <div style={styles.actions}>
                  <Link href={`/anuncio/${ad.id}`} style={styles.btnOutline}>
                    Ver Ficha
                  </Link>
                  <AdManageButtons adId={ad.id} currentStatus={ad.status} isOwnerOrAdmin={true} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '2px dashed #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Aún no has publicado nada.</p>
            <Link href="/anuncio" style={{ ...styles.createBtn, marginTop: '15px' }}>Comenzar ahora</Link>
          </div>
        )}
      </div>
    </div>
  );
}
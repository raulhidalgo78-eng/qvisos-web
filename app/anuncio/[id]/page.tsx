// En: app/anuncio/[id]/page.tsx

import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import React from 'react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Consultamos el anuncio por ID
  const { data: ad, error } = await supabase
    .from('ads')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !ad) {
    console.error('Error fetching ad:', error);
    notFound();
  }

  // Estilos simples para la ficha
  const styles = {
    container: {
      padding: '40px 20px',
      maxWidth: '1024px',
      margin: 'auto',
      fontFamily: 'system-ui, sans-serif',
    },
    backLink: {
      display: 'inline-block',
      marginBottom: '20px',
      color: '#3b82f6',
      textDecoration: 'none',
      fontWeight: '500',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '40px',
      alignItems: 'start',
    },
    imageContainer: {
      backgroundColor: '#f3f4f6',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '300px',
    },
    image: {
      width: '100%',
      height: 'auto',
      display: 'block',
    },
    info: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '15px',
    },
    badge: {
      display: 'inline-block',
      padding: '5px 10px',
      backgroundColor: '#e0f2fe',
      color: '#0369a1',
      borderRadius: '99px',
      fontSize: '0.875rem',
      fontWeight: '600',
      alignSelf: 'flex-start',
      textTransform: 'capitalize' as const,
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '800',
      color: '#1a202c',
      margin: 0,
      lineHeight: 1.1,
    },
    price: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#10b981',
      margin: 0,
    },
    description: {
      fontSize: '1.1rem',
      color: '#4b5563',
      lineHeight: 1.6,
      whiteSpace: 'pre-wrap' as const,
    },
    button: {
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#25D366',
      color: 'white',
      textAlign: 'center' as const,
      borderRadius: '8px',
      fontWeight: 'bold',
      textDecoration: 'none',
      fontSize: '1.1rem',
    }
  };

  return (
    <div style={styles.container}>
      <Link href="/" style={styles.backLink}>← Volver al Inicio</Link>
      
      <div style={styles.grid}>
        {/* Imagen */}
        <div style={styles.imageContainer}>
          {ad.media_url ? (
            <img src={ad.media_url} alt={ad.title} style={styles.image} />
          ) : (
            <span style={{ color: '#9ca3af' }}>Sin imagen</span>
          )}
        </div>

        {/* Información */}
        <div style={styles.info}>
          <span style={styles.badge}>{ad.category || 'General'}</span>
          <h1 style={styles.title}>{ad.title}</h1>
          <p style={styles.price}>${ad.price?.toLocaleString('es-CL')}</p>
          
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px' }}>Descripción</h3>
            <p style={styles.description}>{ad.description}</p>
          </div>

          {ad.contact_phone ? (
            <a
              href={`httpshttps://wa.me/${ad.contact_phone.replace(/\D/g, '')}?text=Hola, vi tu anuncio ${encodeURIComponent(ad.title)} en Qvisos.cl`}
              style={styles.button}
              target="_blank"
              rel="noopener noreferrer"
            >
              Contactar Vendedor
            </a>
          ) : (
            <button
              style={{ ...styles.button, backgroundColor: '#9ca3af', cursor: 'not-allowed' }}
              disabled
            >
              Contacto no disponible
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
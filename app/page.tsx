// En: app/page.tsx

import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import React from 'react';

// Esta es una página pública
export default async function HomePage() {
  
  const supabase = await createClient();

  // Consultamos solo los anuncios aprobados
  const { data: ads, error } = await supabase
    .from('ads')
    .select('*')
    .eq('status', 'aprobado') 
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching approved ads:', error);
  }

  // --- PALETA DE COLORES Y ESTILOS ---
  const colors = {
    primary: '#1a202c',       // Azul Marino/Índigo
    accent: '#3b82f6',        // Azul Eléctrico
    backgroundLight: '#f8f9fa', // Gris Muy Claro
    success: '#10b981',       // Verde
    textSecondary: '#4a5568', // Gris Oscuro
    border: '#e2e8f0',        // Gris Borde
    white: '#ffffff',
  };

  const styles = {
    container: {
      padding: '0 20px 40px 20px',
      maxWidth: '1280px',
      margin: 'auto',
      backgroundColor: colors.white,
      color: colors.primary,
      fontFamily: 'system-ui, sans-serif', 
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 0',
      borderBottom: `1px solid ${colors.border}`, 
    },
    logo: {
      fontSize: '2rem', 
      fontWeight: 'bold',
      color: colors.primary, 
      textDecoration: 'none',
      letterSpacing: '-0.02em', 
    },
    nav: {
      display: 'flex',
      gap: '15px',
      alignItems: 'center',
    },
    link: {
      color: colors.textSecondary,
      textDecoration: 'none',
      fontSize: '0.95rem',
      fontWeight: '500',
      transition: 'color 0.2s ease',
    },
    buttonPrimary: {
      padding: '10px 18px',
      backgroundColor: colors.accent,
      color: colors.white,
      borderRadius: '6px',
      textDecoration: 'none',
      fontSize: '0.95rem',
      fontWeight: '500',
      transition: 'background-color 0.2s ease',
      border: 'none', 
      cursor: 'pointer',
    },
    heroSection: {
      padding: '6rem 0',
      textAlign: 'center' as const,
      backgroundColor: colors.backgroundLight,
      borderRadius: '12px',
      margin: '20px 0 40px 0',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
    },
    heroTitle: {
      fontSize: '3.5rem', 
      fontWeight: 'extrabold', 
      color: colors.primary,
      marginBottom: '1rem',
      lineHeight: '1.1',
    },
    heroSubtitle: {
      fontSize: '1.25rem', 
      color: colors.textSecondary,
      marginBottom: '2.5rem',
      maxWidth: '600px',
      margin: '0 auto 2.5rem auto',
    },
    searchBar: {
      display: 'flex',
      maxWidth: '500px',
      margin: '0 auto 40px auto',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      overflow: 'hidden', 
    },
    searchInput: {
      flex: 1,
      border: 'none',
      padding: '12px 15px',
      fontSize: '1rem',
      color: colors.primary,
      backgroundColor: colors.white,
      outline: 'none', 
    },
    searchButton: {
      padding: '0 20px',
      border: 'none',
      backgroundColor: colors.accent,
      color: colors.white,
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
    },
    sectionTitle: {
      fontSize: '2rem', 
      fontWeight: '700', 
      color: colors.primary,
      margin: '40px 0 20px 0',
      borderBottom: `1px solid ${colors.border}`,
      paddingBottom: '10px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '25px',
    },
    card: {
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 10px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)', 
      backgroundColor: colors.white,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease', 
      cursor: 'pointer',
      height: '100%', 
      display: 'flex',
      flexDirection: 'column' as const,
    },
    cardImagePlaceholder: {
      width: '100%',
      height: '180px',
      backgroundColor: '#e5e7eb', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6b7280', 
      fontSize: '0.9rem',
    },
    cardContent: {
      padding: '16px',
    },
    cardTitle: {
      fontSize: '1.25rem', 
      fontWeight: '600',
      color: colors.primary,
      marginBottom: '8px',
    },
    cardPrice: {
      fontSize: '1.5rem', 
      fontWeight: 'bold',
      color: colors.success, 
      margin: '10px 0',
    },
  };

  return (
    <div style={styles.container}>
      
      {/* --- Encabezado --- */}
      <header style={styles.header}>
        <Link href="/" style={{ ...styles.logo, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="https://wcczvedassfquzdrmwko.supabase.co/storage/v1/object/public/media/logo-qvisos.jpg" 
            alt="Logo Qvisos" 
            style={{ height: '200px', width: '200px' }} 
          />
          <span>Qvisos.cl</span>
        </Link> 
        <nav style={styles.nav}>
          <Link href="/anuncio" style={styles.link}>
            Activa tu QR
          </Link>
          <Link href="/login" style={styles.buttonPrimary}>
            Ingresar
          </Link>
        </nav>
      </header>

      {/* --- Hero Section (ACTUALIZADO) --- */}
      <section style={styles.heroSection}>
        <h1 style={styles.heroTitle}>No son avisos, son QVisos</h1>
        
        {/* Sello de Verificación */}
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '10px', 
          backgroundColor: '#e0f2fe', borderRadius: '99px', padding: '8px 20px', 
          marginBottom: '2rem', color: '#0369a1', fontWeight: 'bold', fontSize: '1.1rem'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L3 6V12C3 17.5 7.5 22 12 22C16.5 22 21 17.5 21 12V6L12 2ZM12 4.14L19 7.07V12C19 16.14 15.86 19.43 12 19.43C8.14 19.43 5 16.14 5 12V7.07L12 4.14ZM11.5 8.5C9.01 8.5 7 10.51 7 13C7 15.49 9.01 17.5 11.5 17.5C13.99 17.5 16 15.49 16 13C16 10.51 13.99 8.5 11.5 8.5ZM11.5 10.5C12.88 10.5 14 11.62 14 13C14 14.38 12.88 15.5 11.5 15.5C10.12 15.5 9 14.38 9 13C9 11.62 10.12 10.5 11.5 10.5ZM14 14.5C14 15.05 13.55 15.5 13 15.5C12.45 15.5 12 15.05 12 14.5C12 13.95 12.45 13.5 13 13.5C13.55 13.5 14 13.95 14 14.5Z" fill="#2563eb"/>
          </svg>
          <span>Avisos Verificados con QR Físico</span>
        </div>

        <p style={styles.heroSubtitle}>
          La forma más segura de vender. Adquiere tu Kit QR, pégalo en tu auto o propiedad y actívalo aquí.
        </p>

        {/* BOTONES DE ACCIÓN */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          
          {/* Botón 1: Activar (Principal) */}
          <Link href="/anuncio" style={{
            padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white',
            borderRadius: '8px', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'
          }}>
            🚀 Ya tengo mi QR: Activar
          </Link>

          {/* Botón 2: Comprar (Secundario - MercadoLibre) */}
          <a 
            href="https://www.mercadolibre.cl" // <-- TU ENLACE DE MERCADOLIBRE VA AQUÍ
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              padding: '12px 24px', backgroundColor: '#fff159', color: '#2d3277', // Colores ML
              borderRadius: '8px', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold',
              border: '1px solid #e6e6e6', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            🛒 Comprar Kit en MercadoLibre
          </a>
        </div>
        
        <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666' }}>
          ¿Cómo funciona? <span style={{fontWeight:'bold'}}>1. Compra el Kit</span> → <span style={{fontWeight:'bold'}}>2. Escanea/Ingresa el Código</span> → <span style={{fontWeight:'bold'}}>3. Publica Gratis</span>
        </p>
      </section>

      {/* --- Barra de Búsqueda (Visual) --- */}
      <form style={styles.searchBar}>
        <input 
          type="text" 
          placeholder="¿Qué estás buscando?" 
          style={styles.searchInput}
        />
        <button type="submit" style={styles.searchButton}>Buscar</button>
      </form>

      {/* --- Sección de Anuncios --- */}
      <main>
        <h2 style={styles.sectionTitle}>
          Anuncios Recientes
        </h2>

        {/* --- Grilla de Anuncios --- */}
        <div style={styles.grid}>
          {ads && ads.length > 0 ? (
            ads.map((ad: any) => (
              // 1. El Link ahora es el contenedor principal
              <Link 
                key={ad.id} 
                href={`/anuncio/${ad.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={styles.card}>
                  
                  {/* Usamos media_url (arreglado) */}
                  {ad.media_url ? (
                    <img 
                      src={ad.media_url} 
                      alt={ad.title} 
                      style={{ width: '100%', height: '180px', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={styles.cardImagePlaceholder}>
                      <span>Imagen no disponible</span>
                    </div>
                  )}
                  
                  <div style={styles.cardContent}>
                    <h3 style={styles.cardTitle}>{ad.title}</h3>
                    <p style={styles.cardPrice}>
                      CLP ${ad.price ? ad.price.toLocaleString('es-CL') : '0'}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p>No hay anuncios disponibles en este momento.</p>
          )}
        </div>
      </main>
    </div>
  );
}
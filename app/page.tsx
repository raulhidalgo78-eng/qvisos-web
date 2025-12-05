// En: app/page.tsx

import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import React from 'react';
import AdCard from '@/components/AdCard';
import HomeSearchWidget from '@/components/HomeSearchWidget';

// Esta es una página pública
export default async function HomePage() {

  const supabase = await createClient();

  // 1. Fetch Autos (Últimos 4)
  const { data: autos } = await supabase
    .from('ads')
    .select('*')
    .eq('status', 'aprobado')
    .eq('category', 'autos') // Asegurar coincidencia con valor en BD
    .order('created_at', { ascending: false })
    .limit(4);

  // 2. Fetch Propiedades Venta
  const { data: ventas } = await supabase
    .from('ads')
    .select('*')
    .eq('status', 'aprobado')
    .eq('category', 'inmuebles')
    .contains('features', { operacion: 'Venta' })
    .order('created_at', { ascending: false })
    .limit(4);

  // 3. Fetch Propiedades Arriendo
  const { data: arriendos } = await supabase
    .from('ads')
    .select('*')
    .eq('status', 'aprobado')
    .eq('category', 'inmuebles')
    .contains('features', { operacion: 'Arriendo' })
    .order('created_at', { ascending: false })
    .limit(4);


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
    heroSection: {
      padding: '6rem 0 8rem 0', // Added bottom padding for the widget overlap
      textAlign: 'center' as const,
      backgroundColor: colors.backgroundLight,
      borderRadius: '12px',
      margin: '20px 0 0 0', // Removed bottom margin to connect with widget
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
    sectionTitle: {
      fontSize: '1.8rem',
      fontWeight: '700',
      color: colors.primary,
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    sectionContainer: {
      marginBottom: '60px'
    }
  };

  // Componente de Sección Reutilizable
  const Section = ({ title, ads, icon }: any) => (
    <section style={styles.sectionContainer}>
      <h2 style={styles.sectionTitle}>
        <span>{icon}</span> {title}
      </h2>

      {(!ads || ads.length === 0) ? (
        <div className="p-8 bg-gray-50 rounded-xl text-center text-gray-500 border border-dashed border-gray-300">
          No hay publicaciones recientes en esta categoría.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ads.map((ad: any) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div style={styles.container}>

      {/* --- Hero Section --- */}
      <section style={styles.heroSection}>
        <h1 style={styles.heroTitle}>No son avisos, son QVisos</h1>

        {/* Sello de Verificación */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          backgroundColor: '#e0f2fe', borderRadius: '99px', padding: '8px 20px',
          marginBottom: '2rem', color: '#0369a1', fontWeight: 'bold', fontSize: '1.1rem'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L3 6V12C3 17.5 7.5 22 12 22C16.5 22 21 17.5 21 12V6L12 2ZM12 4.14L19 7.07V12C19 16.14 15.86 19.43 12 19.43C8.14 19.43 5 16.14 5 12V7.07L12 4.14ZM11.5 8.5C9.01 8.5 7 10.51 7 13C7 15.49 9.01 17.5 11.5 17.5C13.99 17.5 16 15.49 16 13C16 10.51 13.99 8.5 11.5 8.5ZM11.5 10.5C12.88 10.5 14 11.62 14 13C14 14.38 12.88 15.5 11.5 15.5C10.12 15.5 9 14.38 9 13C9 11.62 10.12 10.5 11.5 10.5ZM14 14.5C14 15.05 13.55 15.5 13 15.5C12.45 15.5 12 15.05 12 14.5C12 13.95 12.45 13.5 13 13.5C13.55 13.5 14 13.95 14 14.5Z" fill="#2563eb" />
          </svg>
          <span>Avisos Verificados con QR Físico</span>
        </div>

        <p style={styles.heroSubtitle}>
          La forma más segura de vender. Adquiere tu Kit QR, pégalo en tu auto o propiedad y actívalo aquí.
        </p>

        {/* BOTONES DE ACCIÓN */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/activar" style={{
            padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white',
            borderRadius: '8px', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'
          }}>
            🚀 Ya tengo mi QR: Activar
          </Link>

          <a
            href="https://www.mercadolibre.cl"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '12px 24px', backgroundColor: '#fff159', color: '#2d3277',
              borderRadius: '8px', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold',
              border: '1px solid #e6e6e6', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            🛒 Comprar Kit en MercadoLibre
          </a>
        </div>

        {/* --- BUSCADOR VISUAL ELIMINADO (Reemplazado por Widget) --- */}
      </section>

      {/* --- WIDGET DE BÚSQUEDA --- */}
      <div className="mb-12 px-4">
        <HomeSearchWidget />
      </div>

      {/* --- Secciones Dinámicas --- */}
      <main className="space-y-4">
        <Section title="Vehículos Recientes" ads={autos} icon="🚗" />
        <Section title="Propiedades en Venta" ads={ventas} icon="🏡" />
        <Section title="Arriendos Destacados" ads={arriendos} icon="🔑" />
      </main>

    </div>
  );
}
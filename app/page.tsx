// En: app/page.tsx

import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import React from 'react';
import AdCard from '@/components/AdCard';
import HomeSearchWidget from '@/components/HomeSearchWidget';

// Esta es una página pública
export default async function HomePage() {

  const supabase = await createClient();

  // 1. Fetch Autos (Últimos 4, Status verified)
  const { data: autos, error: errAutos } = await supabase
    .from('ads')
    .select('*')
    .eq('status', 'verified')
    .eq('category', 'autos')
    .order('created_at', { ascending: false })
    .limit(4);

  console.log('[HOME] Autos Fetch:', { count: autos?.length, error: errAutos });

  // 2. Fetch Propiedades Venta
  const { data: ventas, error: errVentas } = await supabase
    .from('ads')
    .select('*')
    .eq('status', 'verified')
    .eq('category', 'inmuebles')
    .contains('features', { operacion: 'Venta' })
    .order('created_at', { ascending: false })
    .limit(4);

  console.log('[HOME] Ventas Fetch:', { count: ventas?.length, error: errVentas });

  // 3. Fetch Propiedades Arriendo
  const { data: arriendos, error: errArriendos } = await supabase
    .from('ads')
    .select('*')
    .eq('status', 'verified')
    .eq('category', 'inmuebles')
    .contains('features', { operacion: 'Arriendo' })
    .order('created_at', { ascending: false })
    .limit(4);

  console.log('[HOME] Arriendos Fetch:', { count: arriendos?.length, error: errArriendos });


  // Componente de Sección Reutilizable
  const Section = ({ title, ads, icon }: any) => (
    <section>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>

      {(!ads || ads.length === 0) ? (
        <div className="p-10 bg-gray-50 rounded-2xl text-center border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 hover:border-blue-300 transition-colors group">
          <div className="text-4xl opacity-50 grayscale group-hover:grayscale-0 transition-all">✨</div>
          <div>
            <p className="text-gray-600 font-medium text-lg">¿Vendes tu vehículo o propiedad?</p>
            <p className="text-gray-500 text-sm">¡Sé el primero en aparecer aquí!</p>
          </div>
          <Link href="/activar" className="mt-2 px-6 py-2 bg-white text-blue-600 border border-blue-200 rounded-full font-bold text-sm hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm">
            Publicar Ahora
          </Link>
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
    <div className="min-h-screen bg-white font-sans">

      {/* --- Hero Section --- */}
      <section className="relative bg-gradient-to-r from-blue-700 to-blue-600 pt-24 pb-32 px-4 text-center rounded-b-[3rem] shadow-md mb-[-4rem]">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
            No son avisos, son QVisos
          </h1>

          {/* Sello de Verificación */}
          <div className="inline-flex items-center gap-2 bg-blue-800/50 backdrop-blur-sm text-blue-100 px-4 py-2 rounded-full mb-8 font-medium text-sm border border-blue-500/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 6V12C3 17.5 7.5 22 12 22C16.5 22 21 17.5 21 12V6L12 2ZM12 4.14L19 7.07V12C19 16.14 15.86 19.43 12 19.43C8.14 19.43 5 16.14 5 12V7.07L12 4.14ZM11.5 8.5C9.01 8.5 7 10.51 7 13C7 15.49 9.01 17.5 11.5 17.5C13.99 17.5 16 15.49 16 13C16 10.51 13.99 8.5 11.5 8.5ZM11.5 10.5C12.88 10.5 14 11.62 14 13C14 14.38 12.88 15.5 11.5 15.5C10.12 15.5 9 14.38 9 13C9 11.62 10.12 10.5 11.5 10.5ZM14 14.5C14 15.05 13.55 15.5 13 15.5C12.45 15.5 12 15.05 12 14.5C12 13.95 12.45 13.5 13 13.5C13.55 13.5 14 13.95 14 14.5Z" fill="currentColor" />
            </svg>
            <span>Avisos Verificados con QR Físico</span>
          </div>

          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            La forma más segura de vender. Adquiere tu Kit QR, pégalo en tu auto o propiedad y actívalo aquí.
          </p>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/activar" className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-50 transition-all transform hover:-translate-y-1">
              🚀 Ya tengo mi QR: Activar
            </Link>

            <a
              href="https://www.mercadolibre.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-[#fff159] text-[#2d3277] rounded-xl font-bold text-lg shadow-lg hover:bg-[#f9ea54] transition-all transform hover:-translate-y-1 flex items-center gap-2"
            >
              🛒 Comprar Kit en MercadoLibre
            </a>
          </div>

          {/* SEÑALES DE CONFIANZA (Trust Signals) */}
          <div className="flex justify-center gap-8 text-blue-100/80 text-sm font-medium">
            <div className="flex items-center gap-2">
              <span>🛡️</span> Sin Estafas
            </div>
            <div className="flex items-center gap-2">
              <span>⚡</span> Trato Directo
            </div>
            <div className="flex items-center gap-2">
              <span>📱</span> Escanea y Compra
            </div>
          </div>
        </div>
      </section>

      {/* --- WIDGET DE BÚSQUEDA --- */}
      <div className="mb-16 px-4 relative z-10">
        <HomeSearchWidget />
      </div>

      {/* --- Secciones Dinámicas --- */}
      <main className="space-y-12 pb-20 max-w-7xl mx-auto px-4">
        <Section title="Vehículos Recientes" ads={autos} icon="🚗" />
        <Section title="Propiedades en Venta" ads={ventas} icon="🏡" />
        <Section title="Arriendos Destacados" ads={arriendos} icon="🔑" />
      </main>

    </div>
  );
}
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import { MapPin, ChevronLeft, Share2, Heart } from 'lucide-react';
import AdChat from '@/components/AdChat';
import AdActions from '@/components/AdActions';
import AdMap from '@/components/AdMap';
import AdKeySpecs from '@/components/AdKeySpecs';
import AdAdvancedDetails from '@/components/AdAdvancedDetails';

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdDetailPage(props: Props) {
  const params = await props.params;
  const { id } = params;

  // UUID check
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const supabase = await createClient();

  let query = supabase.from('ads').select('*');
  if (isUuid) query = query.eq('id', id);
  else query = query.eq('slug', id);

  const { data: ad, error } = await query.single();
  if (error || !ad) notFound();

  // User check
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user && user.id === ad.user_id;

  // Lógica de Preferencias (Exclusive)
  const contactPreference = ad.features?.contact_preference || 'ai_filter';

  // Helpers
  const operacion = ad.features?.operacion || 'Venta';
  const isArriendo = operacion.toLowerCase().includes('arriendo');
  const city = ad.features?.city || 'Ubicación no especificada';
  const region = ad.features?.region || '';
  const currency = ad.features?.moneda || 'CLP';
  const price = ad.price || 0;

  // Formato Precio
  const priceDisplay = price > 0
    ? (currency === 'UF' ? `UF ${price.toLocaleString('es-CL')}` : `$${price.toLocaleString('es-CL')}`)
    : 'Precio a convenir';

  return (
    <div className="bg-gray-50 min-h-screen pb-20">

      {/* NAV SUTIL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center text-gray-500 hover:text-gray-900 transition-colors font-medium">
          <ChevronLeft size={20} />
          <span>Volver</span>
        </Link>
        {isOwner && (
          <Link href="/mis-anuncios" className="text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg text-sm">
            Administrar
          </Link>
        )}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* --- HEADER NIVEL SUPERIOR --- */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-4">
          <div className="flex-1">
            {/* BADGE OPERACIÓN */}
            <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-widest text-white mb-4 uppercase shadow-sm ${isArriendo ? 'bg-orange-500' : 'bg-green-600'}`}>
              {isArriendo ? 'En Arriendo' : 'En Venta'}
            </span>

            {/* TÍTULO H1 */}
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-3 capitalize">
              {ad.title.toLowerCase()}
            </h1>

            {/* UBICACIÓN */}
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin size={24} className="text-gray-400" />
              <span className="text-xl font-medium">{city}, {region}</span>
            </div>
          </div>

          {/* PRECIO (Derecha o abajo en movil) */}
          <div className="flex-shrink-0 mt-4 md:mt-0">
            <div className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              {priceDisplay}
            </div>
            {currency === 'UF' && <p className="text-right text-gray-400 text-sm font-medium mt-1">Valor en UF referencial</p>}
          </div>
        </div>

        {/* --- LAYOUT GRID PRINCIPAL --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* COLUMNA IZQUIERDA (Galería + Detalles) - 8 Cols */}
          <div className="lg:col-span-8 space-y-8">

            {/* GALERÍA (Placeholder mejorado) */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 aspect-video relative group">
              {ad.media_url ? (
                <img
                  src={ad.media_url}
                  alt={ad.title}
                  className="w-full h-full object-contain bg-gray-100" // object-contain para no cortar, bg-gray para relleno
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  Sin imagen disponible
                </div>
              )}
              {/* Botones flotantes (ejemplo) */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-white/90 rounded-full shadow hover:bg-white"><Share2 size={20} className="text-gray-700" /></button>
                <button className="p-2 bg-white/90 rounded-full shadow hover:bg-white"><Heart size={20} className="text-gray-700" /></button>
              </div>
            </div>

            {/* --- BARRA DE ESPECIFICACIONES (KEY SPECS) --- */}
            <div className="py-2">
              <AdKeySpecs category={ad.category} features={ad.features} />
            </div>

            {/* --- DETALLES AVANZADOS --- */}
            <AdAdvancedDetails category={ad.category} features={ad.features} />

            {/* LOREM / DESCRIPCIÓN */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Descripción Oficial</h3>
              <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                {ad.description}
              </div>
            </div>

            {/* MAPA */}
            {ad.lat && ad.lng && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm overflow-hidden">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Ubicación en Mapa</h3>
                <div className="h-[300px] rounded-xl overflow-hidden">
                  <AdMap lat={ad.lat} lng={ad.lng} />
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA (Sidebar Sticky) - 4 Cols */}
          <div className="lg:col-span-4">
            <div className="sticky top-8 space-y-6">

              {/* TARJETA CONTACTO (Lógica Exclusiva) */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">¿Te interesa?</h3>
                  <p className="text-sm text-gray-500">Contacta al vendedor ahora</p>
                </div>

                {/* RENDERIZADO CONDICIONAL EXCLUSIVO */}
                {(() => {
                  // Si es dueño, ve AMBOS (Modo Debug/Admin)
                  if (isOwner) {
                    return (
                      <div className="space-y-4">
                        <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-xs font-bold text-center border border-yellow-200">
                          Vista de Dueño (Ves ambas opciones)
                        </div>
                        <AdChat adData={ad} />
                        <div className="border-t pt-4">
                          <div className="text-center text-xs text-gray-400 mb-2">Opción Directa (Simulada)</div>
                          <WhatsAppButton ad={ad} />
                        </div>
                      </div>
                    );
                  }

                  // Si prefiere IA -> Solo Chat
                  if (contactPreference === 'ai_filter') {
                    return (
                      <div className="animate-in fade-in zoom-in duration-300">
                        <AdChat adData={ad} />
                      </div>
                    );
                  }

                  // Si prefiere WhatsApp -> Solo Botón
                  if (contactPreference === 'whatsapp_directo' || contactPreference === 'direct_whatsapp') {
                    return (
                      <div className="animate-in fade-in zoom-in duration-300">
                        <WhatsAppButton ad={ad} />
                        <p className="text-xs text-center text-gray-400 mt-3">
                          Serás redirigido a WhatsApp Web/App
                        </p>
                      </div>
                    );
                  }

                  // Fallback
                  return <AdChat adData={ad} />;
                })()}

              </div>

              {/* Safety Banner */}
              <div className="bg-blue-50 rounded-xl p-4 flex gap-3 items-start">
                <div className="mt-1 bg-blue-100 text-blue-600 p-1 rounded">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>Consejo de Seguridad:</strong> Nunca transfieras dinero sin haber visitado la propiedad o probado el vehículo.
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Subcomponente Botón WhatsApp para reutilizar
function WhatsAppButton({ ad }: { ad: any }) {
  if (!ad.contact_phone) return <div className="text-center text-gray-400 text-sm">Sin teléfono configurado</div>;
  const phone = ad.contact_phone.replace(/\D/g, '');
  const text = encodeURIComponent(`Hola, estoy interesado en tu anuncio: ${ad.title} (Qvisos)`);
  return (
    <a
      href={`https://wa.me/${phone}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1"
    >
      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
      <span>WhatsApp Directo</span>
    </a>
  )
}
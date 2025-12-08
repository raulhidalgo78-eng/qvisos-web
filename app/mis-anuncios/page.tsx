// En: app/mis-anuncios/page.tsx

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import MyAdCard from '@/components/MyAdCard';
import { PlusCircle, ShieldCheck, Printer } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Mis Anuncios</h1>
            <p className="text-gray-500 mt-1">Gestiona tus publicaciones activas</p>
          </div>
          <Link
            href="/anuncio"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all transform hover:-translate-y-0.5"
          >
            <PlusCircle size={20} />
            Activar Nuevo QR
          </Link>
        </div>

        {/* Panel Admin (Solo visible para ti) */}
        {user.id === ADMIN_USER_ID && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <p className="text-blue-800 font-bold mb-4 flex items-center gap-2">
              <ShieldCheck size={20} />
              Modo Administrador
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
              >
                <ShieldCheck size={16} />
                Ir a Aprobaciones
              </Link>
              <Link
                href="/admin/imprimir"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
              >
                <Printer size={16} />
                Imprimir QRs
              </Link>
            </div>
          </div>
        )}

        {/* Lista de Anuncios */}
        <div className="space-y-4">
          {ads && ads.length > 0 ? (
            ads.map((ad: any) => (
              <MyAdCard key={ad.id} ad={ad} />
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <PlusCircle size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Aún no has publicado nada</h3>
              <p className="text-gray-500 mt-1 mb-6">¡Comienza activando tu primer código QR!</p>
              <Link
                href="/anuncio"
                className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline"
              >
                Comenzar ahora →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

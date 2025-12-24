import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin'; // Importar cliente admin
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

const ADMIN_USER_ID = '6411ba0e-5e36-4e4e-aa1f-4183a2f88d45';

export default async function AdminDashboard() {

  const supabase = await createClient();

  // --- ¡ARREGLO DE SEGURIDAD! ---
  const { data, error: authError } = await supabase.auth.getUser();

  if (authError || !data?.user) {
    redirect('/login'); // A la página de login si falla
  }

  const user = data.user;
  // --- Fin del arreglo ---

  if (user.id !== ADMIN_USER_ID) {
    redirect('/'); // Al inicio si no es admin
  }

  // Fetch ALL ads using ADMIN CLIENT (Bypass RLS)
  const supabaseAdmin = createAdminClient();
  const { data: ads, error } = await supabaseAdmin
    .from('ads')
    .select('*')
    .eq('status', 'pending_verification') // <--- Esta es la clave
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching ads:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administrador</h1>
          <div className="flex gap-4">
            <Link href="/" className="text-blue-600 hover:underline">
              ← Ir al Inicio
            </Link>
            <Link href="/mis-anuncios" className="text-blue-600 hover:underline">
              ← Volver a Mis Anuncios
            </Link>
          </div>
        </div>

        <AdminDashboardClient ads={ads || []} />
      </div>
    </div>
  );
}
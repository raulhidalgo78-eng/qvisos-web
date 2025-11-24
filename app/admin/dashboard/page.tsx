// En: app/admin/dashboard/page.tsx
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ApproveButton from './ApproveButton';
import AdManageButtons from '@/components/AdManageButtons';

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

  // El resto del código ya es seguro
  const { data: ads, error } = await supabase
    .from('ads')
    .select('*')
    // --- ¡LA CORRECCIÓN ESTÁ AQUÍ! ---
    .eq('status', 'pending_verification'); // De 'pending' a 'pendiente'
  // ---------------------------------

  if (error) {
    console.error('Error fetching pending ads:', error);
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Panel de Administrador</h1>

      <div style={{ display: 'flex', gap: '20px', margin: '10px 0 20px 0' }}>
        <Link href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>
          ← Ir al Inicio
        </Link>
        <Link href="/mis-anuncios" style={{ color: '#0070f3', textDecoration: 'underline' }}>
          ← Volver a Mis Anuncios
        </Link>
      </div>

      <p>Bienvenido, Admin. Aquí están los anuncios por aprobar.</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Título</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Estado</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {ads && ads.length > 0 ? (
            ads.map((ad: any) => (
              <tr key={ad.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{ad.title}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{ad.status}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                  <div className="flex flex-col gap-2 items-center">
                    <ApproveButton adId={ad.id} />
                    <AdManageButtons adId={ad.id} currentStatus={ad.status} isOwnerOrAdmin={true} />
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                No hay anuncios pendientes.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
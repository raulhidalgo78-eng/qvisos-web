// En: app/admin/dashboard/actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

const ADMIN_USER_ID = '6411ba0e-5e36-4e4e-aa1f-4183a2f88d45';

export async function approveAd(adId: string) {
  const supabase = await createClient();

  // --- ¡ARREGLO DE SEGURIDAD! ---
  // Esta es la forma segura de obtener el usuario
  const { data, error: authError } = await supabase.auth.getUser();

  if (authError || !data?.user) {
    return { error: 'No autorizado (Error de autenticación).' };
  }
  
  const user = data.user;
  // --- Fin del arreglo ---

  if (user.id !== ADMIN_USER_ID) {
    return { error: 'No autorizado. Se requiere ser administrador.' };
  }

  const { error: updateError } = await supabase
    .from('ads')
    // --- ¡LA CORRECCIÓN ESTÁ AQUÍ! ---
    .update({ status: 'aprobado' })
    // ---------------------------------
    .eq('id', adId);

  if (updateError) {
    console.error('Error approving ad:', updateError);
    return { error: 'Error al aprobar el anuncio.' };
  }

  revalidatePath('/admin/dashboard');

  return { success: true };
}
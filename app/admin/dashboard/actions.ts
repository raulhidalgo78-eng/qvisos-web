'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin'; // Importar cliente admin
import { revalidatePath } from 'next/cache';

const ADMIN_USER_ID = '6411ba0e-5e36-4e4e-aa1f-4183a2f88d45';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user || user.id !== ADMIN_USER_ID) {
    throw new Error('No autorizado');
  }
  // Retornar cliente con privilegios de admin para operaciones de BD
  return createAdminClient();
}

export async function approveAd(adId: string) {
  try {
    const supabase = await checkAdmin();

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 90); // 90 days validity

    const { error } = await supabase
      .from('ads')
      .update({
        status: 'verified',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      })
      .eq('id', adId);

    if (error) throw error;
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function toggleAdStatus(adId: string, currentStatus: string) {
  try {
    const supabase = await checkAdmin();
    // Toggle between 'verified' (public) and 'draft' (hidden/paused)
    // Note: 'paused' is not in DB ENUM, using 'draft' as equivalent.
    const newStatus = currentStatus === 'verified' ? 'draft' : 'verified';

    const { error } = await supabase
      .from('ads')
      .update({ status: newStatus })
      .eq('id', adId);

    if (error) throw error;
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function unlinkQr(adId: string) {
  try {
    const supabase = await checkAdmin();
    const { error } = await supabase
      .from('qr_codes')
      .update({ ad_id: null, status: 'printed' })
      .eq('ad_id', adId);

    if (error) throw error;
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteAd(adId: string) {
  try {
    const supabase = await checkAdmin();

    // 1. Unlink QR first
    await supabase
      .from('qr_codes')
      .update({ ad_id: null, status: 'printed' })
      .eq('ad_id', adId);

    // 2. Delete Ad
    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', adId);

    if (error) throw error;
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function extendAd(adId: string, currentEndDate?: string) {
  try {
    const supabase = await checkAdmin();

    // Calculate new end date (Current End Date + 30 days OR Now + 30 days if null)
    const baseDate = currentEndDate ? new Date(currentEndDate) : new Date();
    const newEndDate = new Date(baseDate);
    newEndDate.setDate(newEndDate.getDate() + 30);

    const { error } = await supabase
      .from('ads')
      .update({ end_date: newEndDate.toISOString() })
      .eq('id', adId);

    if (error) throw error;
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
'use server';

import { createClient } from '@/utils/supabase/server';

export async function getLastQrCode() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('qr_codes')
        .select('code')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        // Si no hay registros (error PGRST116), devolvemos null
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching last QR:', error);
        return null;
    }

    return data?.code;
}

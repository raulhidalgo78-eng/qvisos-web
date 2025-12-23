'use server';

import { createAdminClient } from '@/utils/supabase/admin';

export async function checkQrCategory(code: string) {
    try {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('qr_codes')
            .select('category, status')
            .eq('code', code)
            .single();

        if (error) {
            console.error('SUPABASE QUERY ERROR:', error);
            return null;
        }

        if (!data) {
            console.warn('QR CODE NOT FOUND:', code);
            return null;
        }

        if (data.status !== 'printed') {
            console.warn('QR CODE NOT PRINTED (Status invalid):', data.status);
            return null;
        }

        return data.category;
    } catch (error) {
        console.error('SERVER ACTION ERROR:', error);
        return null; // Or throw, but user asked to return readable error/object. Returning null is handled as "invalid" in the client.
    }
}

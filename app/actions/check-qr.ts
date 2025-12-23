'use server';

import { createClient } from '@supabase/supabase-js';

export async function checkQrCategory(code: string) {
    // 1. Safety Check: Verify Env Vars
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('CRITICAL: Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.');
        return null;
    }

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

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

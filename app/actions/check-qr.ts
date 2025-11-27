'use server';

import { createClient } from '@supabase/supabase-js';

export async function checkQrCategory(code: string) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from('qr_codes')
        .select('category')
        .eq('code', code)
        .single();

    if (error || !data) {
        return null;
    }

    return data.category;
}

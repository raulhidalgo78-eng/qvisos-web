'use server';

import { createClient } from '@/utils/supabase/server';

export async function checkQrCategory(code: string) {
    const supabase = await createClient();

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

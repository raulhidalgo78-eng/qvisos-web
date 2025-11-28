'use server';

import { createClient } from '@/utils/supabase/server';

export async function registerCodes(newCodes: any[]) {
    // 1. Crear cliente de servidor
    const supabase = await createClient();

    // 2. Insertar los códigos (El servidor tiene permisos más estables)
    const { data, error } = await supabase
        .from('qr_codes')
        .upsert(newCodes, { onConflict: 'code', ignoreDuplicates: true })
        .select();

    if (error) {
        console.error('Error registrando códigos en servidor:', error);
        throw new Error(error.message);
    }

    return { success: true, data };
}

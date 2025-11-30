'use server'
import { createClient } from '@supabase/supabase-js'

export async function registerCodes(newCodes: any[]) {
    console.log('Iniciando registro de códigos con Admin Client...');

    // 1. Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Faltan variables de entorno en Vercel');
        throw new Error('Configuración de servidor incompleta (Missing Env Vars)');
    }

    // 2. Crear cliente Admin (Bypass RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // 3. Insertar códigos
    const { data, error } = await supabase
        .from('qr_codes')
        .upsert(newCodes, { onConflict: 'code' })
        .select();

    if (error) {
        console.error('Error Supabase Admin:', error);
        throw new Error(`Error al guardar: ${error.message}`);
    }

    console.log('Códigos registrados con éxito:', data?.length);
    return { success: true, count: data?.length };
}

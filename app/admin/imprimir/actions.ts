'use server'
import { createClient } from '@supabase/supabase-js'

export async function registerCodes(newCodes: any[]) {
    console.log('--- Server Action: Registrando códigos ---');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 1. Verificación de Seguridad
    if (!supabaseUrl || !serviceKey) {
        console.error('ERROR CRÍTICO: Faltan variables de entorno en Vercel.');
        console.error('URL:', supabaseUrl ? 'OK' : 'MISSING');
        console.error('KEY:', serviceKey ? 'OK' : 'MISSING');
        throw new Error('Error de configuración del servidor (Faltan Keys). Revisa los logs de Vercel.');
    }

    // 2. Crear Cliente Admin (Bypass RLS)
    // Usamos createClient directo para no depender de cookies de usuario
    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // 3. Insertar/Actualizar
    const { data, error } = await supabase
        .from('qr_codes')
        .upsert(newCodes, { onConflict: 'code' })
        .select();

    if (error) {
        console.error('Error Supabase:', error);
        throw new Error(`Error al guardar en BD: ${error.message}`);
    }

    console.log('Éxito. Códigos guardados:', data?.length);
    return { success: true, count: data?.length };
}

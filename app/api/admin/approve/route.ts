// Archivo: app/api/admin/approve/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { isAdminUser } from '@/utils/admin';

export async function POST(request: Request) {

    // 1. SEGURIDAD: Verificar que quien llama es el administrador autenticado.
    //    (Antes este endpoint era público: cualquiera podía aprobar avisos.)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !isAdminUser(user.id)) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    // 2. Obtener el ID del anuncio desde el request
    const { adId } = await request.json();
    if (!adId) {
        return NextResponse.json({ message: 'Falta el ID del anuncio (adId).' }, { status: 400 });
    }

    // 3. Actualizar con cliente de servicio (bypass RLS) en la tabla correcta: 'ads'
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('ads')
        .update({ status: 'verified' })
        .eq('id', adId)
        .select();

    if (error) {
        console.error('Error al aprobar el anuncio:', error);
        return NextResponse.json({ message: 'Error al actualizar el anuncio.', details: error.message }, { status: 500 });
    }

    // 4. Éxito
    return NextResponse.json({ message: 'Anuncio aprobado con éxito.', data });
}

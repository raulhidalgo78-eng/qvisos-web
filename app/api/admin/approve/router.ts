// Archivo: app/api/admin/approve/route.ts

import { NextResponse } from 'next/server';
// Asegúrate de que la ruta a tu cliente supabase sea correcta
import { supabase } from '../../../../lib/supabase'; // Sube 4 niveles (approve -> admin -> api -> app -> raíz)
import { createClient } from '@supabase/supabase-js';

// NOTA: Para operaciones seguras de ADMIN, no usamos el cliente 'anon'
// Usamos el cliente de SERVICIO (Service Role Key) que tiene control total.

export async function POST(request: Request) {
    
    // 1. Obtener el ID del anuncio desde el request
    const { adId } = await request.json();
    if (!adId) {
        return NextResponse.json({ message: 'Falta el ID del anuncio (adId).' }, { status: 400 });
    }

    // 2. Crear un cliente de Supabase con ROL DE SERVICIO (Admin)
    // Esto es NECESARIO para saltarse las políticas de RLS de forma segura.
    // DEBES AÑADIR esta variable a tu .env.local y a Vercel
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // ¡Esta es la llave secreta!
    );

    // 3. Actualizar el estado del anuncio en la BDD
    const { data, error } = await supabaseAdmin
        .from('ads')
        .update({ status: 'verified' }) // ¡Cambiamos el estado a Verificado!
        .eq('id', adId)
        .select();

    if (error) {
        console.error('Error al aprobar el anuncio:', error);
        return NextResponse.json({ message: 'Error al actualizar el anuncio.', details: error.message }, { status: 500 });
    }

    // 4. Éxito
    return NextResponse.json({ message: 'Anuncio aprobado con éxito.', data });
}

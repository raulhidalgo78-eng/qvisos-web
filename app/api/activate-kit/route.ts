// Archivo: app/api/activate-kit/route.ts

import { NextResponse } from 'next/server';
// Asegúrate de que la ruta a tu cliente supabase sea correcta
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { email, password, activationCode } = await request.json();

        if (!email || !password || !activationCode) {
            return NextResponse.json({ message: 'Faltan datos requeridos.' }, { status: 400 });
        }

        // PASO 1: Validar el Código de Activación
        const { data: codeData, error: codeError } = await supabase
            .from('activation_codes')
            .select('id, is_used')
            .eq('code_string', activationCode)
            .single();

        if (codeError || !codeData) {
            return NextResponse.json({ message: 'Código de activación inválido.' }, { status: 400 });
        }

        if (codeData.is_used) {
            return NextResponse.json({ message: 'Este código de activación ya fue utilizado.' }, { status: 400 });
        }

        // PASO 2: Intentar registrar al nuevo usuario
        const { data: userData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signUpError) {
            return NextResponse.json({ message: 'Error en el registro', details: signUpError.message }, { status: 400 });
        }

        const userId = userData.user?.id;
        if (!userId) {
             return NextResponse.json({ message: 'Error interno: No se obtuvo el ID del usuario.' }, { status: 500 });
        }

        // PASO 3: Marcar el Código como Usado
        const { error: updateError } = await supabase
            .from('activation_codes')
            .update({
                is_used: true,
                user_id: userId,
                activated_at: new Date().toISOString(),
            })
            .eq('code_string', activationCode);

        if (updateError) {
            return NextResponse.json({ message: 'Error al marcar el código como usado.', details: updateError.message }, { status: 500 });
        }

        // ÉXITO
        return NextResponse.json({
            message: 'Kit activado y registro exitoso. ¡Bienvenido a Qvisos!',
            user: userData.user
        });

    } catch (error: any) {
        return NextResponse.json({ message: 'Error interno del servidor.', details: error.message }, { status: 500 });
    }
}
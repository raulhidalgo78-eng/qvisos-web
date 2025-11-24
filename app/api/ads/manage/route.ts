import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    const supabase = await createClient();

    // 1. Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const { adId, action } = await request.json();

        if (!adId || !action) {
            return NextResponse.json({ message: 'Faltan parámetros' }, { status: 400 });
        }

        // 2. Verificar propiedad (o si es admin)
        // Primero obtenemos el anuncio para ver de quién es
        const { data: ad, error: fetchError } = await supabase
            .from('ads')
            .select('user_id')
            .eq('id', adId)
            .single();

        if (fetchError || !ad) {
            return NextResponse.json({ message: 'Anuncio no encontrado' }, { status: 404 });
        }

        // Verificamos si es el dueño
        const isOwner = ad.user_id === user.id;

        // Verificamos si es admin (opcional, dependiendo de tu lógica de roles)
        // Por ahora asumiremos que si tiene rol 'admin' en metadata o tabla de perfiles
        // Para simplificar, consultamos una tabla de perfiles o metadata si existe, 
        // pero el prompt dice "Admin o Dueño". 
        // Vamos a asumir que si no es dueño, rechazamos por ahora salvo que tengamos lógica de admin clara.
        // Si el usuario pidió explícitamente lógica de admin, podríamos agregarla si hay tabla de roles.
        // El prompt dice: "Recibe { adId, action }. Si action === ...".
        // Y "Validar autenticación (Admin o Dueño del aviso)".

        // Vamos a intentar ver si el usuario tiene rol de admin en su metadata (común en Supabase)
        // O si hay una tabla de perfiles. 
        // Por seguridad, si no es dueño, verificamos si es admin.

        let isAdmin = false;
        // Intento básico de chequear admin en user_metadata
        if (user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin') {
            isAdmin = true;
        }

        // Si no es dueño ni admin, chau.
        if (!isOwner && !isAdmin) {
            return NextResponse.json({ message: 'No tienes permisos para modificar este anuncio' }, { status: 403 });
        }

        if (action === 'close_and_release' || action === 'delete') {
            const newStatus = action === 'delete' ? 'deleted' : 'closed';

            // A. Actualizar estado del Aviso
            const { error: adError } = await supabase
                .from('ads')
                .update({ status: newStatus })
                .eq('id', adId);

            if (adError) throw adError;

            // B. LIBERAR EL QR (La magia del negocio)
            // Buscamos QRs que apunten a este ad y los soltamos
            const { error: qrError } = await supabase
                .from('qr_codes')
                .update({
                    ad_id: null,      // Romper el vínculo
                    status: 'active'  // Dejarlo listo para el siguiente uso
                })
                .eq('ad_id', adId);

            if (qrError) throw qrError;

            return NextResponse.json({ success: true, message: 'Aviso actualizado y QR liberado' });
        }

        return NextResponse.json({ message: 'Acción no válida' }, { status: 400 });

    } catch (error: any) {
        console.error("Error en manage ads:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

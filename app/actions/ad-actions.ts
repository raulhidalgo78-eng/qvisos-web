'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteAd(adId: string) {
    const supabase = await createClient();

    // PASO 1: Desvincular el QR (Hacerlo 'libre' de nuevo)
    // Buscamos el QR asociado a este anuncio y le quitamos el ad_id
    const { error: qrError } = await supabase
        .from('qr_codes')
        .update({
            ad_id: null,
            status: 'printed' // Volvemos al estado 'printed' (libre)
        })
        .eq('ad_id', adId);

    if (qrError) {
        console.error("Error desvinculando QR:", qrError);
        throw new Error("No se pudo liberar el código QR");
    }

    // PASO 2: Ahora sí, borrar el anuncio
    const { error: adError } = await supabase
        .from('ads')
        .delete()
        .eq('id', adId);

    if (adError) {
        console.error("Error borrando anuncio:", adError);
        throw new Error("No se pudo eliminar el anuncio");
    }

    // Redireccionar
    revalidatePath('/mis-anuncios');
    redirect('/mis-anuncios');
}

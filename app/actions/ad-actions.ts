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

export async function updateAd(formData: FormData) {
    const supabase = await createClient();
    const adId = formData.get('id') as string;

    if (!adId) throw new Error("ID de anuncio requerido");

    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("No autorizado");

    // 2. Verificar propiedad (o admin)
    // 2. Verificar propiedad (o admin)
    const isAdmin = user.id === '6411ba0e-5e36-4e4e-aa1f-4183a2f88d45';

    let dbClient = supabase;
    if (isAdmin) {
        const { createAdminClient } = await import('@/utils/supabase/admin');
        dbClient = createAdminClient();
    }

    const { data: ad, error: fetchError } = await dbClient
        .from('ads')
        .select('user_id, media_url')
        .eq('id', adId)
        .single();

    if (fetchError || !ad) throw new Error("Anuncio no encontrado");

    // Permitir si es dueño O si es el admin específico
    if (ad.user_id !== user.id && !isAdmin) {
        throw new Error("No tienes permiso para editar este anuncio");
    }

    // 3. Recolectar datos
    const title = formData.get('titulo') as string;
    const description = formData.get('descripcion') as string;
    const price = formData.get('precio') ? parseFloat(formData.get('precio') as string) : null;
    const category = formData.get('categoria') as string;
    const contact_phone = formData.get('contact_phone') as string;
    const featuresRaw = formData.get('features') as string;

    let features = {};
    if (featuresRaw) {
        try {
            features = JSON.parse(featuresRaw);
        } catch (e) {
            console.error("Error parsing features", e);
        }
    }

    // 4. Manejar Imagen (Opcional)
    const file = formData.get('file') as File;
    let mediaUrl = ad.media_url;

    if (file && file.size > 0) {
        const fileName = `${Date.now()}-${file.name}`;
        const bucketName = 'media';

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file);

        if (uploadError) throw new Error("Error subiendo imagen");

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        mediaUrl = publicUrl;
    }

    // 5. Update DB
    const { error: updateError } = await dbClient
        .from('ads')
        .update({
            title,
            description,
            price,
            category,
            contact_phone,
            features,
            media_url: mediaUrl,
            updated_at: new Date().toISOString()
        })
        .eq('id', adId);

    if (updateError) throw new Error("Error actualizando base de datos");

    revalidatePath('/mis-anuncios');
    revalidatePath(`/anuncio/${adId}`);
    revalidatePath(`/admin/editar/${adId}`);

    return { success: true };
}

'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// --- ELIMINAR ANUNCIO ---
export async function deleteAd(adId: string) {
    const supabase = await createClient();

    // 1. Desvincular QR
    const { error: qrError } = await supabase
        .from('qr_codes')
        .update({
            ad_id: null,
            status: 'printed'
        })
        .eq('ad_id', adId);

    if (qrError) console.error("Error desvinculando QR (no fatal):", qrError);

    // 2. Borrar Anuncio
    const { error: adError } = await supabase
        .from('ads')
        .delete()
        .eq('id', adId);

    if (adError) throw new Error("No se pudo eliminar el anuncio");

    revalidatePath('/mis-anuncios');
    redirect('/mis-anuncios');
}

// --- ACTUALIZAR ANUNCIO ---
export async function updateAd(formData: FormData) {
    const supabase = await createClient();
    const adId = formData.get('id') as string;

    if (!adId) throw new Error("ID requerido");

    // 1. Auth & Permisos
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("No autorizado");

    const isAdmin = user.id === '6411ba0e-5e36-4e4e-aa1f-4183a2f88d45';
    let dbClient = supabase;

    // 2. Verificar Dueño
    const { data: ad, error: fetchError } = await dbClient
        .from('ads')
        .select('user_id, media_url')
        .eq('id', adId)
        .single();

    if (fetchError || !ad) throw new Error("Anuncio no encontrado");
    if (ad.user_id !== user.id && !isAdmin) throw new Error("Sin permiso");

    // 3. Procesar Datos
    const featuresRaw = formData.get('features') as string;
    let features: any = {};
    try { features = JSON.parse(featuresRaw || '{}'); } catch (e) { }

    // 4. Imagen (Bucket UNIFICADO: 'media')
    const file = formData.get('file') as File;
    let mediaUrl = ad.media_url;

    if (file && file.size > 0) {
        // Limpieza de nombre
        const fileName = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(fileName, file);

        if (uploadError) throw new Error("Error subiendo imagen");

        const { data } = supabase.storage.from('media').getPublicUrl(fileName);
        mediaUrl = data.publicUrl;
    }

    // 5. Update DB
    const { error: updateError } = await dbClient
        .from('ads')
        .update({
            title: formData.get('titulo') as string,
            description: formData.get('descripcion') as string,
            price: Number(formData.get('precio')) || 0,
            category: formData.get('categoria') as string,
            contact_phone: formData.get('contact_phone') as string,
            features,
            media_url: mediaUrl,
            updated_at: new Date().toISOString()
        })
        .eq('id', adId);

    if (updateError) throw new Error("Error DB: " + updateError.message);

    revalidatePath('/mis-anuncios');
    return { success: true };
}

// --- CREAR ANUNCIO ---
export async function createAd(formData: FormData) {
    try {
        const supabase = await createClient();

        // 1. Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Debes iniciar sesión.");

        // 2. Recolectar datos
        const title = formData.get('titulo') as string;
        const description = formData.get('descripcion') as string;
        const price = Number(formData.get('precio')) || 0;
        const category = formData.get('categoria') as string;
        const qrCode = formData.get('qr_code') as string;
        const contact_phone = formData.get('contact_phone') as string;

        // Features JSON Safe Parse
        let features: any = {};
        try {
            features = JSON.parse(formData.get('features') as string || '{}');
            if (features['latitude']) features['latitude'] = Number(features['latitude']) || null;
            if (features['longitude']) features['longitude'] = Number(features['longitude']) || null;
        } catch (e) { }

        // 3. Imagen (Bucket: 'media')
        let mediaUrl = formData.get('media_url') as string;
        const file = formData.get('file') as File;

        if (!mediaUrl && file && file.size > 0) {
            // Limpieza de nombre
            const fileName = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;

            const { error: uploadError } = await supabase.storage
                .from('media') // <--- UNIFICADO A 'media'
                .upload(fileName, file);

            if (uploadError) throw new Error("Error subiendo imagen: " + uploadError.message);

            const { data } = supabase.storage.from('media').getPublicUrl(fileName);
            mediaUrl = data.publicUrl;
        }

        if (!mediaUrl) throw new Error("La imagen es obligatoria.");

        // 4. INSERTAR EN 'ads'
        const { data: newAd, error: insertError } = await supabase
            .from('ads')
            .insert({
                user_id: user.id,
                title,
                description,
                price,
                category,
                contact_phone,
                features,
                media_url: mediaUrl,
                status: 'pending'
            })
            .select('id')
            .single();

        if (insertError) throw new Error("Error guardando aviso: " + insertError.message);

        // 5. VINCULAR QR (Si existe)
        if (qrCode) {
            await supabase
                .from('qr_codes')
                .update({ ad_id: newAd.id, status: 'active' })
                .eq('code', qrCode);
        }

        revalidatePath('/mis-anuncios');
        revalidatePath('/admin/dashboard');

        return { success: true, adId: newAd.id };

    } catch (error: any) {
        console.error("CreateAd Failed:", error);
        throw new Error(error.message);
    }
}
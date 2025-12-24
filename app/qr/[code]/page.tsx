import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function QRRedirectPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    const upperCode = code.toUpperCase();
    const supabase = await createClient();

    // Consultamos estado del código
    const { data: qrData, error } = await supabase
        .from('qr_codes')
        .select('status, ad_id, category')
        .eq('code', upperCode)
        .single();

    if (error || !qrData) {
        return redirect('/?error=codigo_invalido');
    }

    // CASO A: Código ya activo -> Ir al anuncio
    if (qrData.status === 'active' && qrData.ad_id) {
        // Buscar el Slug y Estado del Anuncio
        const { data: ad } = await supabase
            .from('ads')
            .select('slug, status')
            .eq('id', qrData.ad_id)
            .single();

        // Validar que exista el anuncio y esté publicado
        if (ad && (ad.status === 'verified' || ad.status === 'aprobado')) {
            // Redirigir al SLUG si existe, sino al ID
            return redirect(`/anuncio/${ad.slug || qrData.ad_id}`);
        }

        // Si el anuncio no está activo o no existe -> Homepage (Edge case fallback)
        return redirect('/');
    }

    // CASO B: Código libre -> Ir a Activar (Experiencia Unboxing)
    return redirect(`/activar?prefill=${upperCode}`);
}

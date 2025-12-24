import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

interface Props {
    params: {
        code: string;
    };
}

export default async function QRRedirectionPage({ params }: Props) {
    const code = params.code;
    const supabase = await createClient();

    // 1. Buscar el código en la BD
    const { data: qr, error } = await supabase
        .from('qr_codes')
        .select('status, category, ad_id')
        .eq('code', code)
        .single();

    if (error || !qr) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
                <h1 style={{ color: 'red' }}>Código QR No Válido</h1>
                <p>El código <strong>{code}</strong> no existe en nuestro sistema.</p>
            </div>
        );
    }

    // 2. Si ya está activo (tiene anuncio), redirigir al anuncio
    if (qr.status === 'active' && qr.ad_id) {
        // Buscar el Slug y Estado del Anuncio
        const { data: ad } = await supabase
            .from('ads')
            .select('slug, status')
            .eq('id', qr.ad_id)
            .single();

        // Validar que exista el anuncio y esté publicado
        if (ad && (ad.status === 'verified' || ad.status === 'aprobado')) {
            // Redirigir al SLUG si existe, sino al ID
            redirect(`/anuncio/${ad.slug || qr.ad_id}`);
        }

        // EDGE CASE: QR tiene anuncio asignado, pero está pausado/borrado -> Home
        redirect('/');
    }

    // 3. Si es nuevo, redirigir al formulario de creación con los parámetros correctos
    if (qr.status === 'new') {
        let targetUrl = `/anuncio?code=${code}`;

        // Mapeo de categorías a parámetros de URL
        switch (qr.category) {
            case 'venta_auto':
                targetUrl += '&tipo=auto';
                break;
            case 'venta_propiedad':
                targetUrl += '&tipo=propiedad-venta';
                break;
            case 'arriendo_propiedad':
                targetUrl += '&tipo=propiedad-arriendo';
                break;
            // Si es 'generico' o null, no agregamos 'tipo', el formulario preguntará o mostrará default
            default:
                break;
        }

        redirect(targetUrl);
    }

    // 4. Estado desconocido
    return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h1>Estado del Código: {qr.status}</h1>
            <p>Este código no se puede utilizar en este momento.</p>
        </div>
    );
}

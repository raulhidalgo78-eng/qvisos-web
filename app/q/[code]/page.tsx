import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

interface Props {
    params: Promise<{ code: string }>;
}

export default async function QRRedirectionPage({ params }: Props) {
    // FIX Next.js 15+: params es una Promise y debe esperarse
    const { code } = await params;
    const upperCode = code.toUpperCase();
    const supabase = await createClient();

    // 1. Buscar el código en la BD
    const { data: qr, error } = await supabase
        .from('qr_codes')
        .select('status, category, ad_id')
        .eq('code', upperCode)
        .single();

    if (error || !qr) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <h1 className="text-2xl font-bold text-red-600 mb-2">Código QR No Válido</h1>
                <p className="text-gray-600">El código <strong>{upperCode}</strong> no existe en nuestro sistema.</p>
            </div>
        );
    }

    // 2. Si ya está activo (tiene anuncio), redirigir al anuncio
    if (qr.status === 'active' && qr.ad_id) {
        const { data: ad } = await supabase
            .from('ads')
            .select('slug, status')
            .eq('id', qr.ad_id)
            .single();

        if (ad && (ad.status === 'verified' || ad.status === 'aprobado')) {
            redirect(`/anuncio/${ad.slug || qr.ad_id}`);
        }

        // EDGE CASE: QR tiene anuncio asignado, pero está pausado/borrado -> Home
        redirect('/');
    }

    // 3. Código impreso pero libre -> Flujo de activación con código precargado
    if (qr.status === 'printed' || qr.status === 'new') {
        redirect(`/activar?prefill=${upperCode}`);
    }

    // 4. Estado desconocido
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Estado del Código: {qr.status}</h1>
            <p className="text-gray-600">Este código no se puede utilizar en este momento.</p>
        </div>
    );
}

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
        // Redirección inteligente al anuncio público
        // let tipoUrl = 'auto'; // Default (unused variable)
        // if (qrData.category === 'venta_propiedad') tipoUrl = 'propiedad-venta';
        // if (qrData.category === 'arriendo_propiedad') tipoUrl = 'propiedad-arriendo';

        return redirect(`/anuncio/${qrData.ad_id}`);
    }

    // CASO B: Código libre -> Ir a Activar (Experiencia Unboxing)
    return redirect(`/activar?prefill=${upperCode}`);
}

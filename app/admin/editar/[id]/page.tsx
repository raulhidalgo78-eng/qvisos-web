import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AnuncioForm from '@/components/AnuncioForm';

export default async function EditAdPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect('/login?message=Debes iniciar sesión');
    }

    const isAdmin = user.id === '6411ba0e-5e36-4e4e-aa1f-4183a2f88d45';

    // 2. Fetch Ad (Robust Logic with Logging)
    console.log(`🔍 Buscando anuncio: ${id}`);
    let fetchClient = supabase;

    // Si es admin, usamos el cliente Admin para saltar RLS (Equivalente a buscar en toda la DB)
    if (isAdmin) {
        try {
            const { createAdminClient } = await import('@/utils/supabase/admin');
            fetchClient = createAdminClient();
            console.log("🛡️ Usando cliente Admin (RLS Bypass)");
        } catch (e: any) {
            console.error("🔥 Error creando admin client:", e);
            // Fallback a cliente normal si falla la config de admin
        }
    }

    let ad = null;
    let fetchError = null;

    try {
        // INTENTO 1: Buscar en la tabla 'ads' (Colección Global)
        const result = await fetchClient
            .from('ads')
            .select('*')
            .eq('id', id)
            .single();

        ad = result.data;
        fetchError = result.error;

        if (ad) {
            console.log("✅ Encontrado en tabla 'ads'");
        } else {
            console.warn("❌ No encontrado en tabla 'ads'");
            // Aquí podríamos intentar buscar en otra tabla si existiera una 'legacy_ads', 
            // pero en Supabase usualmente todo está en una tabla.
        }

    } catch (err) {
        console.error("🔥 Error controlado en fetchAdData:", err);
    }

    if (fetchError || !ad) {
        console.warn("❌ Anuncio no encontrado o error de acceso.", fetchError);
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-500 mb-2">Anuncio no encontrado</h2>
                <p className="text-gray-600">No se pudo cargar el anuncio con ID: {id}</p>
                <p className="text-xs text-gray-400 mt-4">Error: {fetchError?.message || 'Documento inexistente'}</p>
                <a href="/mis-anuncios" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Volver a Mis Anuncios
                </a>
            </div>
        );
    }

    // 3. Permission Check
    // const isAdmin already declared above
    if (ad.user_id !== user.id && !isAdmin) {
        return <div className="p-8 text-center text-red-500">No tienes permiso para editar este anuncio</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <AnuncioForm initialData={ad} />
        </div>
    );
}

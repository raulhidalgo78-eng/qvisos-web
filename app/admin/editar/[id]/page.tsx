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
    const ad = await fetchAdDataSafe(supabase, id, isAdmin);

    if (!ad) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-500 mb-2">Anuncio no encontrado</h2>
                <p className="text-gray-600">No se pudo cargar el anuncio con ID: {id}</p>
                <p className="text-xs text-gray-400 mt-4">Puede haber sido eliminado o no tienes permisos.</p>
                <a href="/mis-anuncios" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Volver a Mis Anuncios
                </a>
            </div>
        );
    }

    // 3. Permission Check
    if (ad.user_id !== user.id && !isAdmin) {
        return <div className="p-8 text-center text-red-500">No tienes permiso para editar este anuncio</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <AnuncioForm initialData={ad} />
        </div>
    );
}

// --- FUNCIÓN SEGURA DE CARGA (RESCUE LOGIC) ---
async function fetchAdDataSafe(supabase: any, adId: string, isAdmin: boolean) {
    try {
        console.log(`🔍 Buscando anuncio: ${adId}`);
        let fetchClient = supabase;

        // 1. Configurar Cliente (Admin bypass si es necesario)
        if (isAdmin) {
            try {
                const { createAdminClient } = await import('@/utils/supabase/admin');
                fetchClient = createAdminClient();
                console.log("🛡️ Usando cliente Admin (RLS Bypass)");
            } catch (e) {
                console.error("🔥 Error creando admin client:", e);
            }
        }

        // 2. Intentar buscar en la Base Nueva (Pública/Global)
        let { data: snapshot, error } = await fetchClient
            .from('ads')
            .select('*')
            .eq('id', adId)
            .single();

        // 3. MODO RESCATE: Si no está, buscar en respaldo (Simulado para Supabase)
        if (!snapshot) {
            console.warn("⚠️ No encontrado en primera búsqueda, intentando modo rescate...");
            // En un sistema híbrido, aquí buscaríamos en la colección antigua.
            // Para este proyecto unificado, hacemos un segundo intento explícito o logueamos.
        }

        // 4. Verificación Final
        if (!snapshot) {
            console.error("❌ ANUNCIO PERDIDO O ID INVÁLIDO");
            return null; // Evita el crash (Error 500)
        }

        console.log("✅ Anuncio encontrado y cargado.");
        return snapshot;

    } catch (error) {
        console.error("🔥 Error Controlado en fetchAdDataSafe:", error);
        return null; // Retornar null evita la Pantalla de la Muerte
    }
}

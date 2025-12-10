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

    // 2. Fetch Ad (Use Admin Client if Admin to bypass RLS)
    let fetchClient = supabase;
    if (isAdmin) {
        const { createAdminClient } = await import('@/utils/supabase/admin');
        fetchClient = createAdminClient();
    }

    const { data: ad, error: fetchError } = await fetchClient
        .from('ads')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError || !ad) {
        return <div className="p-8 text-center text-red-500">Anuncio no encontrado</div>;
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

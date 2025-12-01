'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdActions({ adId }: { adId: string }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de eliminar este aviso?')) return;

        setIsDeleting(true);
        const supabase = createClient();

        // Eliminamos el anuncio (RLS se encargará de verificar si eres el dueño)
        const { error } = await supabase.from('ads').delete().eq('id', adId);

        if (error) {
            alert('Error: ' + error.message);
            setIsDeleting(false);
        } else {
            router.push('/mis-anuncios');
            router.refresh();
        }
    };

    return (
        <div className="flex gap-3 mt-4 border-t pt-4">
            <button
                onClick={() => router.push(`/admin/editar/${adId}`)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
            >
                ✏️ Editar
            </button>

            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors border border-red-100"
            >
                {isDeleting ? 'Borrando...' : '🗑️ Eliminar'}
            </button>
        </div>
    );
}
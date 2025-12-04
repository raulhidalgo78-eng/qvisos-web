'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteAd } from '@/app/actions/ad-actions';

export default function AdActions({ adId }: { adId: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de eliminar este aviso?')) return;

        startTransition(async () => {
            try {
                await deleteAd(adId);
            } catch (error: any) {
                alert('Error: ' + error.message);
            }
        });
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
                disabled={isPending}
                className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors border border-red-100"
            >
                {isPending ? 'Borrando...' : '🗑️ Eliminar'}
            </button>
        </div>
    );
}
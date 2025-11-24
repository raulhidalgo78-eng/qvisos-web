'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Archive, Loader2 } from 'lucide-react';

interface AdManageButtonsProps {
    adId: string;
    currentStatus: string;
    isOwnerOrAdmin: boolean;
}

export default function AdManageButtons({ adId, currentStatus, isOwnerOrAdmin }: AdManageButtonsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    if (!isOwnerOrAdmin) return null;

    // Solo mostramos botones si el anuncio no está ya cerrado o eliminado
    // Ajusta según tus estados. El prompt dice "si el aviso está activo".
    // Asumimos 'active' o 'published' o 'pending_verification' como estados "vivos".
    const isActive = ['active', 'published', 'pending_verification'].includes(currentStatus);

    if (!isActive) return null;

    const handleAction = async (action: 'close_and_release' | 'delete') => {
        if (!confirm(action === 'delete' ? '¿Estás seguro de eliminar este aviso?' : '¿Finalizar aviso y liberar QR?')) return;

        setLoading(true);
        try {
            const res = await fetch('/api/ads/manage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adId, action }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Error al procesar la solicitud');
            }

            alert('Acción realizada con éxito');
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-2 mt-4">
            <button
                onClick={() => handleAction('close_and_release')}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-sm font-medium"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                Finalizar y Liberar QR
            </button>

            <button
                onClick={() => handleAction('delete')}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Eliminar
            </button>
        </div>
    );
}

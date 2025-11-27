'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface AdActionsProps {
    id: string;
    status: string;
    code: string;
}

export default function AdActions({ id, status, code }: AdActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleToggleStatus = async () => {
        if (loading) return;
        setLoading(true);

        const newStatus = status === 'publicado' ? 'pausado' : 'publicado';

        try {
            const { error } = await supabase
                .from('ads')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            router.refresh();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar el estado del anuncio.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este anuncio? Esta acción liberará el código QR para ser usado nuevamente.')) {
            return;
        }

        if (loading) return;
        setLoading(true);

        try {
            // 1. Eliminar anuncio
            const { error: deleteError } = await supabase
                .from('ads')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            // 2. Liberar código QR (Reciclaje)
            if (code) {
                const { error: qrError } = await supabase
                    .from('qr_codes')
                    .update({ status: 'printed' }) // Volver a estado 'impreso' pero libre
                    .eq('code', code);

                if (qrError) console.error('Error recycling QR code:', qrError);
            }

            router.refresh();
        } catch (error) {
            console.error('Error deleting ad:', error);
            alert('Error al eliminar el anuncio.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '8px' }}>
            <button
                onClick={handleToggleStatus}
                disabled={loading}
                title={status === 'publicado' ? 'Pausar Anuncio' : 'Reanudar Anuncio'}
                style={{
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: loading ? 'wait' : 'pointer',
                    fontSize: '1.2rem',
                    lineHeight: 1,
                    transition: 'background 0.2s',
                    opacity: loading ? 0.5 : 1
                }}
            >
                {status === 'publicado' ? '⏸️' : '▶️'}
            </button>

            <button
                onClick={handleDelete}
                disabled={loading}
                title="Eliminar Anuncio y Reciclar QR"
                style={{
                    padding: '8px',
                    border: '1px solid #fee2e2',
                    borderRadius: '6px',
                    backgroundColor: '#fef2f2',
                    cursor: loading ? 'wait' : 'pointer',
                    fontSize: '1.2rem',
                    lineHeight: 1,
                    transition: 'background 0.2s',
                    opacity: loading ? 0.5 : 1
                }}
            >
                🗑️
            </button>
        </div>
    );
}

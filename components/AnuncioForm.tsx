'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { updateAd, createAd } from '@/app/actions/ad-actions';
// import { checkQrCategory } from '@/app/actions/check-qr'; // COMENTADO POR SEGURIDAD (Causa Error 500)

// --- NOTA: HEMOS ELIMINADO EL MAPA TEMPORALMENTE ---
// No importamos RobustMapPicker para aislar el error 500.

interface AnuncioFormProps {
    initialData?: any;
}

export default function AnuncioForm({ initialData }: AnuncioFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Estados
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Campos del Formulario
    const [qrCodeInput, setQrCodeInput] = useState(initialData?.qr_code || searchParams.get('code') || '');
    const [category, setCategory] = useState(initialData?.category || '');
    const [operacion, setOperacion] = useState(initialData?.features?.operacion || 'Venta');
    const [moneda, setMoneda] = useState(initialData?.features?.moneda || 'CLP');
    const [description, setDescription] = useState(initialData?.description || '');

    // Validar Montaje
    useEffect(() => { setIsMounted(true); }, []);

    // Inicializar Usuario
    useEffect(() => {
        const init = async () => {
            if (initialData) { setLoading(false); return; }
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) router.push('/login');
            setUser(user);
            setLoading(false);
        };
        init();
    }, [initialData, router]);

    // PROTECCIÓN DE RENDERIZADO
    if (!isMounted) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData(e.currentTarget);
            if (file) formData.set('file', file);
            // Lógica simplificada para probar
            formData.set('categoria', category || 'otros');
            formData.set('features', JSON.stringify({ operacion, moneda }));

            if (initialData) {
                formData.append('id', initialData.id);
                await updateAd(formData);
            } else {
                await createAd(formData);
            }
            alert('Aviso guardado (Versión Sin Mapa)');
            router.push('/mis-anuncios');
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Cargando...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-4 border border-green-500">
            <div className="bg-green-100 p-4 mb-6 rounded text-green-800 text-center font-bold">
                🧪 MODO PRUEBA: SIN MAPA
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block font-bold mb-1">Título</label>
                    <input name="titulo" type="text" required defaultValue={initialData?.title} className="w-full p-3 border rounded" placeholder="Título del aviso" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-bold mb-1">Precio</label>
                        <input name="precio" type="number" required defaultValue={initialData?.price} className="w-full p-3 border rounded" placeholder="999000" />
                    </div>
                    <div>
                        <label className="block font-bold mb-1">Categoría</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 border rounded">
                            <option value="">Seleccione...</option>
                            <option value="autos">Autos</option>
                            <option value="inmuebles">Propiedades</option>
                            <option value="otros">Otros</option>
                        </select>
                    </div>
                </div>

                {/* AQUÍ DEBERÍA IR EL MAPA - LO HEMOS QUITADO PARA PROBAR */}
                <div className="p-10 bg-gray-100 border-2 border-dashed border-gray-300 rounded text-center text-gray-500">
                    🗺️ El mapa está desactivado temporalmente para aislar el error.
                </div>

                <div>
                    <label className="block font-bold mb-1">Foto</label>
                    <input type="file" onChange={e => e.target.files && setFile(e.target.files[0])} className="w-full" />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold">
                    {isSubmitting ? 'Guardando...' : 'Publicar Aviso (Test)'}
                </button>
            </form>
        </div>
    );
}
'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { deleteAd } from '@/app/actions/ad-actions';

interface Ad {
    id: string;
    title: string;
    price: number;
    status: string;
    media_url: string | null;
    currency: string;
}

export default function MyAdCard({ ad }: { ad: Ad }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (!confirm('¿Estás seguro de eliminar este anuncio?')) return;
        startTransition(async () => {
            try {
                await deleteAd(ad.id);
            } catch (error: any) {
                alert('Error: ' + error.message);
            }
        });
    };

    const formatPrice = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: currency || 'CLP',
        }).format(amount);
    };

    return (
        <div className="flex flex-col sm:flex-row bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Left: Image */}
            <div className="relative w-full sm:w-[150px] h-48 sm:h-auto bg-gray-100 flex-shrink-0">
                {ad.media_url ? (
                    <Image
                        src={ad.media_url}
                        alt={ad.title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                        Sin imagen
                    </div>
                )}
            </div>

            {/* Center: Info */}
            <div className="flex-1 p-4 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${ad.status === 'active' || ad.status === 'verified' ? 'bg-green-100 text-green-700' :
                        ad.status === 'pending' || ad.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                        {ad.status === 'pending' || ad.status === 'pending_verification' ? 'Pendiente de Aprobación' :
                            ad.status === 'active' || ad.status === 'verified' ? 'Activo' : ad.status}
                    </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 line-clamp-2">
                    {ad.title}
                </h3>

                <p className="text-xl font-bold text-blue-600">
                    {formatPrice(ad.price, ad.currency)}
                </p>
            </div>

            {/* Right: Actions */}
            <div className="p-4 flex flex-row sm:flex-col justify-center gap-2 border-t sm:border-t-0 sm:border-l border-gray-100 bg-gray-50 sm:bg-transparent">
                <Link
                    href={`/anuncio/${ad.id}`}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors text-sm font-medium shadow-sm"
                    title="Ver Ficha"
                >
                    <Eye size={16} />
                    <span className="sm:hidden">Ver</span>
                </Link>

                <Link
                    href={`/admin/editar/${ad.id}`}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors text-sm font-medium shadow-sm"
                    title="Editar"
                >
                    <Pencil size={16} />
                    <span className="sm:hidden">Editar</span>
                </Link>

                <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-red-100 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium shadow-sm"
                    title="Eliminar"
                >
                    <Trash2 size={16} />
                    <span className="sm:hidden">Eliminar</span>
                </button>
            </div>
        </div>
    );
}

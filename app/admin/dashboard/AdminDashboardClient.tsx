'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { CheckCircle, PauseCircle, PlayCircle, Trash2, QrCode, AlertCircle, Archive } from 'lucide-react';
import { approveAd, toggleAdStatus, unlinkQr, deleteAd } from './actions';

interface Ad {
    id: string;
    title: string;
    price: number;
    currency: string;
    status: string;
    images: string[];
    created_at: string;
}

interface AdminDashboardClientProps {
    ads: Ad[];
}

export default function AdminDashboardClient({ ads }: AdminDashboardClientProps) {
    const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
    const [isPending, startTransition] = useTransition();

    const pendingAds = ads.filter(ad => ad.status === 'pending');
    const activeAds = ads.filter(ad => ['active', 'paused'].includes(ad.status));

    const handleAction = (action: () => Promise<any>, confirmMsg?: string) => {
        if (confirmMsg && !confirm(confirmMsg)) return;
        startTransition(async () => {
            const result = await action();
            if (result?.error) alert(result.error);
        });
    };

    const formatPrice = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: currency || 'CLP',
        }).format(amount);
    };

    const renderAdCard = (ad: Ad, isPendingTab: boolean) => (
        <div key={ad.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col">
            {/* Image Thumbnail */}
            <div className="relative h-48 w-full bg-gray-100">
                {ad.images && ad.images.length > 0 ? (
                    <Image
                        src={ad.images[0]}
                        alt={ad.title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <span className="text-sm">Sin imagen</span>
                    </div>
                )}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold uppercase ${ad.status === 'active' ? 'bg-green-100 text-green-800' :
                    ad.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                    }`}>
                    {ad.status === 'pending' ? 'Por Aprobar' : ad.status}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-1">{ad.title}</h3>
                <p className="text-xl font-bold text-blue-600 mb-4">{formatPrice(ad.price, ad.currency)}</p>

                <div className="mt-auto space-y-2">
                    {isPendingTab ? (
                        <button
                            onClick={() => handleAction(() => approveAd(ad.id))}
                            disabled={isPending}
                            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors font-medium"
                        >
                            <CheckCircle size={18} />
                            Aprobar
                        </button>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleAction(() => toggleAdStatus(ad.id, ad.status))}
                                disabled={isPending}
                                className={`flex items-center justify-center gap-1 py-2 px-2 rounded-md transition-colors text-sm font-medium ${ad.status === 'paused'
                                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                    }`}
                            >
                                {ad.status === 'paused' ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                                {ad.status === 'paused' ? 'Reactivar' : 'Pausar'}
                            </button>

                            <button
                                onClick={() => handleAction(() => unlinkQr(ad.id), "¿Liberar el código QR de este anuncio?")}
                                disabled={isPending}
                                className="flex items-center justify-center gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200 py-2 px-2 rounded-md transition-colors text-sm font-medium"
                            >
                                <QrCode size={16} />
                                Liberar QR
                            </button>

                            <button
                                onClick={() => handleAction(() => deleteAd(ad.id), "¿Estás seguro de ELIMINAR este anuncio? Esta acción no se puede deshacer.")}
                                disabled={isPending}
                                className="col-span-2 flex items-center justify-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 py-2 px-2 rounded-md transition-colors text-sm font-medium mt-1"
                            >
                                <Trash2 size={16} />
                                Eliminar Definitivamente
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-4 px-6 text-sm font-medium transition-colors relative ${activeTab === 'pending'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Por Aprobar
                    <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                        {pendingAds.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-4 px-6 text-sm font-medium transition-colors relative ${activeTab === 'active'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Inventario Activo
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                        {activeAds.length}
                    </span>
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'pending' ? (
                    pendingAds.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {pendingAds.map(ad => renderAdCard(ad, true))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <CheckCircle size={48} className="mb-4 text-green-500" />
                            <p className="text-lg">¡Todo al día! No hay anuncios pendientes.</p>
                        </div>
                    )
                ) : (
                    activeAds.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {activeAds.map(ad => renderAdCard(ad, false))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <Archive size={48} className="mb-4 text-gray-400" />
                            <p className="text-lg">No hay anuncios activos en el inventario.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

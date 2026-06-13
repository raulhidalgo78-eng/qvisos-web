'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { CheckCircle, PauseCircle, PlayCircle, Trash2, QrCode, AlertCircle, Archive, Calendar, History } from 'lucide-react';
import { approveAd, toggleAdStatus, unlinkQr, deleteAd, extendAd } from './actions';

interface Ad {
    id: string;
    title: string;
    price: number;
    currency: string;
    status: string;
    media_url: string; // Updated to match DB
    created_at: string;
    category: string; // Added for filtering
    features: any; // Added for filtering
    start_date?: string; // New
    end_date?: string;   // New
}

interface AdminDashboardClientProps {
    ads: Ad[];
}

export default function AdminDashboardClient({ ads }: AdminDashboardClientProps) {
    const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
    const [activeFilter, setActiveFilter] = useState<'all' | 'prop_venta' | 'prop_arriendo' | 'autos'>('all'); // NEW: Filter state
    const [isPending, startTransition] = useTransition();

    const pendingAds = ads.filter(ad => ['pending', 'pending_verification'].includes(ad.status));

    // Base active ads
    const allActiveAds = ads.filter(ad => ['verified', 'draft', 'aprobado'].includes(ad.status));

    // Filtered active ads
    const activeAds = allActiveAds.filter(ad => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'autos') return ad.category === 'autos';
        if (activeFilter === 'prop_venta') return ad.category === 'inmuebles' && ad.features?.operacion === 'Venta';
        if (activeFilter === 'prop_arriendo') return ad.category === 'inmuebles' && ad.features?.operacion === 'Arriendo';
        return true;
    });

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

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Sin fecha';
        return new Date(dateString).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getDaysRemaining = (endDateString?: string) => {
        if (!endDateString) return null;
        const end = new Date(endDateString);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const renderAdCard = (ad: Ad, isPendingTab: boolean) => {
        const daysRemaining = getDaysRemaining(ad.end_date);
        const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
        const isExpired = daysRemaining !== null && daysRemaining <= 0;

        return (
            <div key={ad.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col">
                {/* Image Thumbnail */}
                <div className="relative h-48 w-full bg-gray-100">
                    {ad.media_url ? ( // Check media_url
                        <Image
                            src={ad.media_url} // Use media_url
                            alt={ad.title}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <span className="text-sm">Sin imagen</span>
                        </div>
                    )}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold uppercase ${(ad.status === 'verified' || ad.status === 'aprobado') ? 'bg-green-100 text-green-800' :
                        ad.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                        }`}>
                        {(ad.status === 'pending' || ad.status === 'pending_verification') ? 'Por Aprobar' :
                            (ad.status === 'verified' || ad.status === 'aprobado') ? 'Publicado' :
                                ad.status === 'draft' ? 'Pausado' : ad.status}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-1">{ad.title}</h3>
                    <p className="text-xl font-bold text-blue-600 mb-2">{formatPrice(ad.price, ad.currency)}</p>

                    {/* Expiration Info */}
                    {!isPendingTab && (
                        <div className={`text-sm mb-4 flex items-center gap-1 ${isExpired ? 'text-red-600 font-bold' : isExpiringSoon ? 'text-orange-600 font-bold' : 'text-gray-500'}`}>
                            <Calendar size={14} />
                            <span>Vence: {formatDate(ad.end_date)}</span>
                            {daysRemaining !== null && (
                                <span className="text-xs ml-1">
                                    ({isExpired ? 'Vencido' : `${daysRemaining} días`})
                                </span>
                            )}
                        </div>
                    )}

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
                                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md transition-colors text-xs font-medium ${ad.status === 'draft'
                                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                        }`}
                                >
                                    {ad.status === 'draft' ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                                    {ad.status === 'draft' ? 'Reactivar' : 'Pausar'}
                                </button>

                                <button
                                    onClick={() => handleAction(() => extendAd(ad.id, ad.end_date), `¿Extender vigencia del anuncio por 30 días?`)}
                                    disabled={isPending}
                                    className="flex items-center justify-center gap-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 py-1.5 px-2 rounded-md transition-colors text-xs font-medium"
                                >
                                    <History size={14} />
                                    Extender
                                </button>

                                <button
                                    onClick={() => handleAction(() => unlinkQr(ad.id), "¿Liberar el código QR de este anuncio?")}
                                    disabled={isPending}
                                    className="flex items-center justify-center gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200 py-1.5 px-2 rounded-md transition-colors text-xs font-medium"
                                >
                                    <QrCode size={14} />
                                    Liberar QR
                                </button>

                                <button
                                    onClick={() => handleAction(() => deleteAd(ad.id), "¿Estás seguro de ELIMINAR este anuncio? Esta acción no se puede deshacer.")}
                                    disabled={isPending}
                                    className="flex items-center justify-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 py-1.5 px-2 rounded-md transition-colors text-xs font-medium"
                                >
                                    <Trash2 size={14} />
                                    Eliminar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Tabs Principal */}
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
                        {allActiveAds.length}
                    </span>
                </button>
            </div>

            {/* Filter Content for Active Tab */}
            {activeTab === 'active' && (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === 'all'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 border hover:bg-gray-50'
                            }`}
                    >
                        Todos ({allActiveAds.length})
                    </button>
                    <button
                        onClick={() => setActiveFilter('prop_venta')}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === 'prop_venta'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 border hover:bg-gray-50'
                            }`}
                    >
                        Propiedades Venta ({allActiveAds.filter(a => a.category === 'inmuebles' && a.features?.operacion === 'Venta').length})
                    </button>
                    <button
                        onClick={() => setActiveFilter('prop_arriendo')}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === 'prop_arriendo'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 border hover:bg-gray-50'
                            }`}
                    >
                        Propiedades Arriendo ({allActiveAds.filter(a => a.category === 'inmuebles' && a.features?.operacion === 'Arriendo').length})
                    </button>
                    <button
                        onClick={() => setActiveFilter('autos')}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === 'autos'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 border hover:bg-gray-50'
                            }`}
                    >
                        Autos Venta ({allActiveAds.filter(a => a.category === 'autos').length})
                    </button>
                </div>
            )}

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
                            <p className="text-lg">No hay anuncios activos en esta categoría.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

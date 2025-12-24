import Link from 'next/link';
import React from 'react';

interface AdCardProps {
    ad: {
        id: string;
        slug?: string; // Add slug to interface
        title: string;
        price: number;
        media_url?: string;
        category: string;
        features?: any; // JSONB
    };
}

export default function AdCard({ ad }: AdCardProps) {
    // Helper to format price
    const formatPrice = (price: number, currency: string = 'CLP') => {
        return `${currency} $${price?.toLocaleString('es-CL') || '0'}`;
    };

    // Helper to get specific details based on category
    const getDetails = () => {
        const f = ad.features || {};
        if (ad.category === 'autos' || ad.category === 'Autos') {
            return (
                <div className="text-xs text-gray-500 mt-1 flex gap-2">
                    <span>{f.anio || ''}</span>
                    <span>•</span>
                    <span>{f.kilometraje ? `${f.kilometraje} km` : ''}</span>
                </div>
            );
        }
        if (ad.category === 'inmuebles' || ad.category === 'Propiedades') {
            return (
                <div className="text-xs text-gray-500 mt-1 flex gap-2">
                    {f.m2_utiles && <span>{f.m2_utiles} m²</span>}
                    {f.dormitorios && <span>• {f.dormitorios}d</span>}
                    {f.banos && <span>• {f.banos}b</span>}
                </div>
            );
        }
        return null;
    };

    // Determine currency (default to CLP if not in features)
    const currency = ad.features?.moneda || 'CLP';

    return (
        <Link
            href={`/anuncio/${ad.slug || ad.id}`} // Prefer slug, fallback to ID
            className="block group"
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300 h-full flex flex-col relative">

                {/* Image */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {/* Badge Category */}
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow z-10">
                        {ad.category}
                    </div>

                    {ad.media_url ? (
                        <img
                            src={ad.media_url}
                            alt={ad.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            Sin imagen
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                        {ad.title}
                    </h3>

                    <div className="mt-auto">
                        <p className="text-xl font-bold text-green-600">
                            {ad.price > 0 ? formatPrice(ad.price, currency) : "Precio a conversar"}
                        </p>
                        {getDetails()}
                    </div>
                </div>
            </div>
        </Link>
    );
}

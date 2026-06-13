import Link from 'next/link';
import React from 'react';
import { Snowflake, Sun, Waves, Zap, Wind, Armchair, Flame, Car, ShieldCheck, MapPin, Bed, Bath, Ruler } from 'lucide-react';

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
    // Helper to format price
    const formatPrice = (price: number, currency: string = 'CLP') => {
        if (currency === 'UF') {
            return `UF ${price?.toLocaleString('es-CL')}`;
        }
        return `$${price?.toLocaleString('es-CL')}`;
    };

    // Helper to get specific details based on category
    // Helper to get specific details based on category
    const getDetails = () => {
        const f = ad.features || {};
        if (ad.category === 'autos' || ad.category === 'Autos') {
            return (
                <div className="text-sm text-gray-500 mt-2 flex gap-3 items-center">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">{f.anio || 'Año N/A'}</span>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1">
                        {f.kilometraje ? `${Number(f.kilometraje).toLocaleString('es-CL')} km` : '0 km'}
                    </span>
                </div>
            );
        }
        if (ad.category === 'inmuebles' || ad.category === 'Propiedades') {
            return (
                <div className="flex gap-4 mt-3 text-gray-600 text-sm">
                    {f.dormitorios && (
                        <div className="flex items-center gap-1" title="Dormitorios">
                            <Bed size={16} className="text-blue-500" />
                            <span>{f.dormitorios}</span>
                        </div>
                    )}
                    {f.banos && (
                        <div className="flex items-center gap-1" title="Baños">
                            <Bath size={16} className="text-blue-500" />
                            <span>{f.banos}</span>
                        </div>
                    )}
                    {(f.m2_utiles || f.m2_total) && (
                        <div className="flex items-center gap-1" title="Metros Cuadrados">
                            <Ruler size={16} className="text-blue-500" />
                            <span>{f.m2_utiles || f.m2_total} m²</span>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    // Determine currency (default to CLP if not in features)
    // Determine currency (default to CLP if not in features)
    const currency = ad.features?.moneda || 'CLP';

    // Determine Badge Logic
    const operacion = ad.features?.operacion || 'Venta'; // Default to Venta if missing
    const isArriendo = operacion.toLowerCase().includes('arriendo');

    // Badge Styles
    const badgeColor = isArriendo ? 'bg-orange-500' : 'bg-green-600'; // Orange for Rent, Green for Sale
    const badgeText = isArriendo ? 'ARRIENDO' : 'EN VENTA';

    // Location
    const locationText = ad.features?.city ? `${ad.features.city}, ${ad.features.region || ''}` : null;

    return (
        <Link
            href={`/anuncio/${ad.slug || ad.id}`} // Prefer slug, fallback to ID
            className="block group"
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300 h-full flex flex-col relative">

                {/* Image */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {/* Badge Operation (Dynamic) */}
                    <div className={`absolute top-3 left-3 ${badgeColor} text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md z-10 tracking-wide`}>
                        {badgeText}
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
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors capitalize">
                        {ad.title.toLowerCase()}
                    </h3>

                    {/* Location Line */}
                    {locationText ? (
                        <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                            <MapPin size={14} className="text-gray-400" />
                            <span className="line-clamp-1">{locationText}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                            <MapPin size={14} className="text-gray-400" />
                            <span className="capitalize">Ubicación Disponible</span>
                        </div>
                    )}

                    <div className="mt-auto">
                        <p className="text-2xl font-extrabold text-gray-900">
                            {ad.price > 0 ? formatPrice(ad.price, currency) : "Precio a conversar"}
                        </p>
                        {getDetails()}

                        {/* Pro Feature Icons */}
                        {ad.features?.equipamiento && Array.isArray(ad.features.equipamiento) && ad.features.equipamiento.length > 0 && (
                            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 overflow-hidden">
                                {ad.features.equipamiento.slice(0, 4).map((item: string, i: number) => {
                                    let Icon = ShieldCheck; // Fallback
                                    // Auto Icons
                                    if (item === 'Aire Acondicionado') Icon = Snowflake;
                                    if (item === 'Sunroof / Techo Panorámico') Icon = Sun;
                                    if (item === 'Asientos de Cuero') Icon = Armchair;
                                    if (item === 'Velocidad Crucero') Icon = Wind;
                                    // Propiedad Icons
                                    if (item === 'Piscina') Icon = Waves;
                                    if (item === 'Paneles Solares') Icon = Zap;
                                    if (item === 'Calefacción Central') Icon = Flame;
                                    if (item === 'Estacionamiento' || item.includes('Estacionamiento')) Icon = Car;
                                    if (item === 'Quincho') Icon = Flame;

                                    return (
                                        <div key={i} className="text-gray-400" title={item}>
                                            <Icon size={16} />
                                        </div>
                                    );
                                })}
                                {ad.features.equipamiento.length > 4 && (
                                    <span className="text-xs text-gray-400 font-bold self-center">+{ad.features.equipamiento.length - 4}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

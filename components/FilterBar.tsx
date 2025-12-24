'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function FilterBar() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Estado inicial
    const [filters, setFilters] = useState({
        q: searchParams.get('q') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        // Autos
        anio: searchParams.get('anio') || '',
        transmision: searchParams.get('transmision') || '',
        // Propiedades
        dormitorios: searchParams.get('dormitorios') || '',
        banos: searchParams.get('banos') || '',
        tipoPropiedad: searchParams.get('tipoPropiedad') || '',
    });

    const category = searchParams.get('category')?.toLowerCase() || '';

    // Sincronizar URL -> Estado
    useEffect(() => {
        setFilters({
            q: searchParams.get('q') || '',
            minPrice: searchParams.get('minPrice') || '',
            maxPrice: searchParams.get('maxPrice') || '',
            anio: searchParams.get('anio') || '',
            transmision: searchParams.get('transmision') || '',
            dormitorios: searchParams.get('dormitorios') || '',
            banos: searchParams.get('banos') || '',
            tipoPropiedad: searchParams.get('tipoPropiedad') || '',
        });
    }, [searchParams]);

    const handleFilter = () => {
        const params = new URLSearchParams(searchParams.toString());

        // Helper para set/delete
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.set(key, value);
            else params.delete(key);
        });

        router.push(`/buscar?${params.toString()}`);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col gap-6">
            <h3 className="font-bold text-gray-800 text-lg border-b pb-2">Filtros</h3>

            {/* --- GENERAL: Búsqueda --- */}
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Palabra Clave</label>
                <input
                    type="text"
                    placeholder="Ej: Toyota, Santiago..."
                    value={filters.q}
                    onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* --- GENERAL: Precio --- */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Precio Mín</label>
                    <input
                        type="number"
                        placeholder="0"
                        value={filters.minPrice}
                        onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Precio Max</label>
                    <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* --- CONDICIONAL: AUTOS --- */}
            {(category === 'autos' || category === 'autos_venta') && (
                <div className="space-y-4 border-t pt-4">
                    <h4 className="font-semibold text-sm text-gray-700">Vehículos</h4>

                    {/* Año */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Año</label>
                        <select
                            value={filters.anio}
                            onChange={(e) => setFilters({ ...filters, anio: e.target.value })}
                            className="w-full p-2 border rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Cualquiera</option>
                            {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    {/* Transmisión (Pills) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">Transmisión</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setFilters({ ...filters, transmision: filters.transmision === 'Automática' ? '' : 'Automática' })}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${filters.transmision === 'Automática'
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                Automática
                            </button>
                            <button
                                onClick={() => setFilters({ ...filters, transmision: filters.transmision === 'Manual' ? '' : 'Manual' })}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${filters.transmision === 'Manual'
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                Manual
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CONDICIONAL: INMUEBLES --- */}
            {(category === 'inmuebles' || category === 'propiedades') && (
                <div className="space-y-4 border-t pt-4">
                    <h4 className="font-semibold text-sm text-gray-700">Propiedades</h4>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label>
                        <select
                            value={filters.tipoPropiedad}
                            onChange={(e) => setFilters({ ...filters, tipoPropiedad: e.target.value })}
                            className="w-full p-2 border rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Cualquiera</option>
                            <option value="Casa">Casa</option>
                            <option value="Departamento">Departamento</option>
                            <option value="Terreno">Terreno</option>
                        </select>
                    </div>

                    {/* Stepper-ish inputs for Dorms/Baños using clean small inputs */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Dormitorios</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.dormitorios}
                                    onChange={(e) => setFilters({ ...filters, dormitorios: e.target.value })}
                                    className="w-full p-2 pl-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="absolute right-2 top-2 text-xs text-gray-400 font-bold">+</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Baños</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.banos}
                                    onChange={(e) => setFilters({ ...filters, banos: e.target.value })}
                                    className="w-full p-2 pl-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="absolute right-2 top-2 text-xs text-gray-400 font-bold">+</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Botón Filtrar */}
            <button
                onClick={handleFilter}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md mt-2"
            >
                Aplicar Filtros
            </button>
        </div>
    );
}

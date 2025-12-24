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
        combustible: searchParams.get('combustible') || '',
        duenos: searchParams.get('duenos') || '',
        // Propiedades
        dormitorios: searchParams.get('dormitorios') || '',
        banos: searchParams.get('banos') || '',
        tipoPropiedad: searchParams.get('tipoPropiedad') || '',
        gastosComunes: searchParams.get('gastosComunes') || '',
        orientacion: searchParams.get('orientacion') || '',
        operacion: searchParams.get('operacion') || '',
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
            combustible: searchParams.get('combustible') || '',
            duenos: searchParams.get('duenos') || '',
            dormitorios: searchParams.get('dormitorios') || '',
            banos: searchParams.get('banos') || '',
            tipoPropiedad: searchParams.get('tipoPropiedad') || '',
            gastosComunes: searchParams.get('gastosComunes') || '',
            orientacion: searchParams.get('orientacion') || '',
            operacion: searchParams.get('operacion') || '',
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
                <div className="space-y-6 pt-2">
                    <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        🚗 Vehículos
                    </h4>

                    {/* Año */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <label className="block text-xs font-bold text-gray-500 mb-2">Año</label>
                        <select
                            value={filters.anio}
                            onChange={(e) => setFilters({ ...filters, anio: e.target.value })}
                            className="w-full p-2 border rounded-lg outline-none bg-white font-medium text-sm"
                        >
                            <option value="">Cualquiera</option>
                            {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    {/* Transmisión (Pills) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">Transmisión</label>
                        <div className="flex flex-wrap gap-2">
                            {['Manual', 'Automática'].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setFilters({ ...filters, transmision: filters.transmision === opt ? '' : opt })}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${filters.transmision === opt
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ACORDEÓN: Detalles Técnicos (Combustible, Dueños) */}
                    <details className="group border rounded-xl overflow-hidden">
                        <summary className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors list-none font-bold text-sm text-gray-700">
                            <span>⚙️ Detalles Técnicos</span>
                            <span className="transition group-open:rotate-180">▼</span>
                        </summary>
                        <div className="p-4 bg-white border-t space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">Combustible</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Bencina', 'Diesel', 'Híbrido', 'Eléctrico'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setFilters({ ...filters, combustible: filters.combustible === opt ? '' : opt })}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${filters.combustible === opt
                                                    ? 'bg-green-600 text-white border-green-600'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">Dueños</label>
                                <select
                                    value={filters.duenos}
                                    onChange={(e) => setFilters({ ...filters, duenos: e.target.value })}
                                    className="w-full p-2 border rounded-lg bg-gray-50 outline-none text-sm"
                                >
                                    <option value="">Todos</option>
                                    <option value="1">Único Dueño</option>
                                    <option value="2">Hasta 2 Dueños</option>
                                </select>
                            </div>
                        </div>
                    </details>
                </div>
            )}

            {/* --- CONDICIONAL: INMUEBLES --- */}
            {(category === 'inmuebles' || category === 'propiedades') && (
                <div className="space-y-6 pt-2">
                    <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        🏡 Propiedades
                    </h4>

                    {/* Operación TABS */}
                    <div className="bg-gray-100 p-1 rounded-xl flex text-sm font-bold">
                        <button
                            onClick={() => setFilters({ ...filters, operacion: 'Venta' })}
                            className={`flex-1 py-2 rounded-lg transition-all ${filters.operacion === 'Venta' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >Venta</button>
                        <button
                            onClick={() => setFilters({ ...filters, operacion: 'Arriendo' })}
                            className={`flex-1 py-2 rounded-lg transition-all ${filters.operacion === 'Arriendo' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >Arriendo</button>
                    </div>

                    {/* Tipo y Dorms */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label>
                            <select
                                value={filters.tipoPropiedad}
                                onChange={(e) => setFilters({ ...filters, tipoPropiedad: e.target.value })}
                                className="w-full p-2 border rounded-lg outline-none bg-white font-medium text-sm"
                            >
                                <option value="">Cualquiera</option>
                                <option value="Casa">Casa</option>
                                <option value="Departamento">Departamento</option>
                                <option value="Terreno">Terreno</option>
                                <option value="Oficina">Oficina</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Dormitorios</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">Min</span>
                                    <input
                                        type="number"
                                        value={filters.dormitorios}
                                        onChange={(e) => setFilters({ ...filters, dormitorios: e.target.value })}
                                        className="w-full p-2 pl-9 border rounded-lg outline-none text-center font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Baños</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">Min</span>
                                    <input
                                        type="number"
                                        value={filters.banos}
                                        onChange={(e) => setFilters({ ...filters, banos: e.target.value })}
                                        className="w-full p-2 pl-9 border rounded-lg outline-none text-center font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ACORDEÓN: Costos y Detalles (Gastos Comunes, Orientación) */}
                    <details className="group border rounded-xl overflow-hidden">
                        <summary className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors list-none font-bold text-sm text-gray-700">
                            <span>💎 Detalles y Costos</span>
                            <span className="transition group-open:rotate-180">▼</span>
                        </summary>
                        <div className="p-4 bg-white border-t space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Gastos Comunes (Max)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        placeholder="Ej: 100000"
                                        value={filters.gastosComunes}
                                        onChange={(e) => setFilters({ ...filters, gastosComunes: e.target.value })}
                                        className="w-full p-2 pl-7 border rounded-lg outline-none text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Orientación</label>
                                <select
                                    value={filters.orientacion}
                                    onChange={(e) => setFilters({ ...filters, orientacion: e.target.value })}
                                    className="w-full p-2 border rounded-lg outline-none bg-gray-50 text-sm"
                                >
                                    <option value="">Cualquiera</option>
                                    <option value="Norte">Norte</option>
                                    <option value="Sur">Sur</option>
                                    <option value="Oriente">Oriente</option>
                                    <option value="Poniente">Poniente</option>
                                </select>
                            </div>
                        </div>
                    </details>
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

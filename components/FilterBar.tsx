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
    const [currency, setCurrency] = useState('CLP');

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
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-6">

            {/* --- NIVEL 1: UBICACIÓN --- */}
            <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-wide">
                    📍 Ubicación
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                    <input
                        type="text"
                        placeholder="¿Dónde buscas? (Ej. Las Condes)"
                        value={filters.q}
                        onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                        className="w-full pl-9 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-shadow"
                    />
                </div>
            </div>

            {/* --- NIVEL 2: TIPO --- */}
            <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-wide">
                    Tipo de {category === 'autos' ? 'Vehículo' : 'Propiedad'}
                </label>
                {category === 'autos' ? (
                    // Autos Body Type (Simplificado para MVP, usando 'combustible' como placeholder de tipo si no hay campo car_body)
                    // O simplemente no mostramos nada si no hay filtro de "Carrocería" en el estado actual. 
                    // Mostraremos el de Transmisión aquí si es relevante, o nada si no hay campo mapeado.
                    // El usuario pidió "Dropdown: Carrocería". Como no tengo ese filtro en `filters`, usaré un placeholder visual o el de 'Combustible' si aplica.
                    // Usaremos Combustible como "Tipo" por ahora.
                    <select
                        value={filters.combustible}
                        onChange={(e) => setFilters({ ...filters, combustible: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none bg-gray-50 text-sm font-medium"
                    >
                        <option value="">Cualquier Motor</option>
                        <option value="Bencina">Bencina</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Híbrido">Híbrido</option>
                        <option value="Eléctrico">Eléctrico</option>
                    </select>
                ) : (
                    <select
                        value={filters.tipoPropiedad}
                        onChange={(e) => setFilters({ ...filters, tipoPropiedad: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none bg-gray-50 text-sm font-medium"
                    >
                        <option value="">Todo tipo</option>
                        <option value="Casa">Casa</option>
                        <option value="Departamento">Departamento</option>
                        <option value="Terreno">Terreno</option>
                        <option value="Oficina">Oficina</option>
                    </select>
                )}
            </div>

            {/* --- NIVEL 3: PRECIO --- */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold uppercase text-gray-500 tracking-wide">Presupuesto</label>
                    {/* Toggle UF/CLP */}
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                        <button
                            onClick={() => setCurrency('CLP')}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${currency === 'CLP' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}
                        >CLP</button>
                        <button
                            onClick={() => setCurrency('UF')}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${currency === 'UF' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}
                        >UF</button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative w-1/2">
                        <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">{currency === 'UF' ? 'UF' : '$'}</span>
                        <input
                            type="number"
                            placeholder="Min"
                            value={filters.minPrice}
                            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                            className="w-full pl-8 p-2 border border-gray-200 rounded-xl outline-none text-sm"
                        />
                    </div>
                    <div className="relative w-1/2">
                        <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">{currency === 'UF' ? 'UF' : '$'}</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={filters.maxPrice}
                            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                            className="w-full pl-8 p-2 border border-gray-200 rounded-xl outline-none text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* --- NIVEL 4: CARACTERÍSTICAS (Pills) --- */}

            {/* AUTOS */}
            {(category === 'autos' || category === 'autos_venta') && (
                <div className="space-y-4 pt-2 border-t border-dashed border-gray-200">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-wide">Año</label>
                        <select
                            value={filters.anio}
                            onChange={(e) => setFilters({ ...filters, anio: e.target.value })}
                            className="w-full p-2 border border-gray-200 rounded-xl outline-none bg-white text-sm"
                        >
                            <option value="">Cualquiera</option>
                            {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-wide">Transmisión</label>
                        <div className="flex gap-2">
                            {['Manual', 'Automática'].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setFilters({ ...filters, transmision: filters.transmision === opt ? '' : opt })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${filters.transmision === opt
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* PROPIEDADES */}
            {(category === 'inmuebles' || category === 'propiedades') && (
                <div className="space-y-4 pt-2 border-t border-dashed border-gray-200">
                    {/* Operación (Simplificado como Pill) */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-wide">Operación</label>
                        <div className="flex bg-gray-50 p-1 rounded-xl">
                            {['Venta', 'Arriendo'].map(op => (
                                <button
                                    key={op}
                                    onClick={() => setFilters({ ...filters, operacion: op })}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${filters.operacion === op
                                        ? 'bg-white shadow text-gray-900'
                                        : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {op}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dorms & Baños Pill Selector */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-wide">Dormitorios</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setFilters({ ...filters, dormitorios: String(num) })}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${filters.dormitorios === String(num)
                                            ? 'bg-gray-800 text-white border-gray-800'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                                    >
                                        {num}+
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-wide">Baños</label>
                            <div className="flex gap-1">
                                {[1, 2, 3].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setFilters({ ...filters, banos: String(num) })}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${filters.banos === String(num)
                                            ? 'bg-gray-800 text-white border-gray-800'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                                    >
                                        {num}+
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* BOTÓN FILTRAR */}
            <button
                onClick={handleFilter}
                className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl mt-2 flex justify-center items-center gap-2"
            >
                <span>Ver Resultados</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">→</span>
            </button>
        </div>
    );
}

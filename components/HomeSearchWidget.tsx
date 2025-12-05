'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeSearchWidget() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'autos' | 'venta' | 'arriendo'>('autos');

    // Estados para los inputs
    const [query, setQuery] = useState('');
    const [tipoPropiedad, setTipoPropiedad] = useState('');

    const handleSearch = () => {
        const params = new URLSearchParams();

        if (activeTab === 'autos') {
            params.set('category', 'Autos');
            if (query) params.set('q', query); // Marca o modelo
        } else {
            params.set('category', 'Propiedades');
            params.set('operacion', activeTab === 'venta' ? 'Venta' : 'Arriendo');
            if (tipoPropiedad) params.set('tipo', tipoPropiedad);
            if (query) params.set('ubicacion', query); // Comuna
        }
        // Redirigir al home con query params para filtrar la lista
        router.push(`/?${params.toString()}`);
    };

    return (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto -mt-8 relative z-10 border border-gray-100">

            {/* 1. Pestañas */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('autos')}
                    className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'autos' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    🚗 Autos
                </button>
                <button
                    onClick={() => setActiveTab('venta')}
                    className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'venta' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    🏡 Venta
                </button>
                <button
                    onClick={() => setActiveTab('arriendo')}
                    className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'arriendo' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    🔑 Arriendo
                </button>
            </div>

            {/* 2. Área de Filtros (Cambia según Pestaña) */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

                {/* --- FILTROS DE AUTOS --- */}
                {activeTab === 'autos' && (
                    <>
                        <div className="md:col-span-8">
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">¿Qué buscas?</label>
                            <input
                                type="text"
                                placeholder="Ej: Toyota Yaris, Mazda 3..."
                                className="w-full p-4 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all bg-gray-100"
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        {/* Aquí podrías agregar más selects (Año, Precio) en el futuro */}
                    </>
                )}

                {/* --- FILTROS DE PROPIEDADES (Venta y Arriendo) --- */}
                {(activeTab === 'venta' || activeTab === 'arriendo') && (
                    <>
                        <div className="md:col-span-4">
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Tipo</label>
                            <select
                                className="w-full p-4 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 appearance-none bg-gray-100"
                                onChange={(e) => setTipoPropiedad(e.target.value)}
                            >
                                <option value="">Todo</option>
                                <option value="Departamento">Departamento</option>
                                <option value="Casa">Casa</option>
                                <option value="Oficina">Oficina</option>
                                <option value="Parcela">Parcela</option>
                            </select>
                        </div>
                        <div className="md:col-span-4">
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Ubicación</label>
                            <input
                                type="text"
                                placeholder="Ej: Viña del Mar, Providencia..."
                                className="w-full p-4 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 bg-gray-100"
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                    </>
                )}

                {/* 3. Botón Buscar (Común a todos) */}
                <div className="md:col-span-4">
                    <button
                        onClick={handleSearch}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                        🔍 Buscar {activeTab === 'autos' ? 'Auto' : 'Propiedad'}
                    </button>
                </div>
            </div>
        </div>
    );
}

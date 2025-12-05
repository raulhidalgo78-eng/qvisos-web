'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function FilterBar() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Estado inicial basado en URL
    const [filters, setFilters] = useState({
        q: searchParams.get('q') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
    });

    // Actualizar estado si cambia la URL
    useEffect(() => {
        setFilters({
            q: searchParams.get('q') || '',
            minPrice: searchParams.get('minPrice') || '',
            maxPrice: searchParams.get('maxPrice') || '',
        });
    }, [searchParams]);

    const handleFilter = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (filters.q) params.set('q', filters.q); else params.delete('q');
        if (filters.minPrice) params.set('minPrice', filters.minPrice); else params.delete('minPrice');
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice); else params.delete('maxPrice');

        router.push(`/buscar?${params.toString()}`);
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
            {/* Buscador Texto */}
            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-500 mb-1">Búsqueda</label>
                <input
                    type="text"
                    placeholder="Ej: Toyota, Santiago..."
                    value={filters.q}
                    onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Precio Mínimo */}
            <div className="w-32">
                <label className="block text-xs font-bold text-gray-500 mb-1">Precio Mín</label>
                <input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Precio Máximo */}
            <div className="w-32">
                <label className="block text-xs font-bold text-gray-500 mb-1">Precio Max</label>
                <input
                    type="number"
                    placeholder="Sin límite"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Botón Filtrar */}
            <button
                onClick={handleFilter}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors h-[42px]"
            >
                Filtrar
            </button>
        </div>
    );
}

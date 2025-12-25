'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SortDropdown() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get('sort') || 'newest';

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const sortValue = e.target.value;
        const params = new URLSearchParams(searchParams.toString());

        if (sortValue === 'newest') {
            params.delete('sort'); // Default
        } else {
            params.set('sort', sortValue);
        }

        router.push(`/buscar?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm font-bold text-gray-500 whitespace-nowrap">
                Ordenar por:
            </label>
            <select
                id="sort"
                value={currentSort}
                onChange={handleSortChange}
                className="bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
            >
                <option value="newest">Más Recientes</option>
                <option value="price_asc">Menor Precio</option>
                <option value="price_desc">Mayor Precio</option>
            </select>
        </div>
    );
}

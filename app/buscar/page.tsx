import { createClient } from '@/utils/supabase/server';
import AdCard from '@/components/AdCard';
import FilterBar from '@/components/FilterBar';

export default async function SearchPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const supabase = await createClient();

    // Extraer parámetros
    const category = searchParams.category as string;
    const operacion = searchParams.operacion as string;
    const q = searchParams.q as string;
    const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : null;
    const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : null;

    // Construir consulta base (Usar 'verified' para coincidir con DB)
    let query = supabase
        .from('ads')
        .select('*')
        .eq('status', 'verified')
        .order('created_at', { ascending: false });

    // Aplicar filtros dinámicos
    if (category) {
        // Mapeo simple para asegurar coincidencia con BD (Autos vs autos)
        // Si la BD usa minúsculas, forzamos minúsculas, o viceversa.
        // Asumiremos que la BD es consistente con lo que enviamos, o usamos ilike si fuera texto.
        // Pero category suele ser enum o fijo. Probemos ilike para seguridad.
        query = query.ilike('category', category);
    }

    if (operacion) {
        query = query.contains('features', { operacion: operacion });
    }

    if (q) {
        // Búsqueda simple por texto en título o descripción
        // Supabase textSearch es mejor, pero ilike es más fácil de configurar rápido sin índices full-text
        query = query.ilike('title', `%${q}%`);
    }

    if (minPrice !== null) {
        query = query.gte('price', minPrice);
    }

    if (maxPrice !== null) {
        query = query.lte('price', maxPrice);
    }

    // Ejecutar consulta
    const { data: ads, error } = await query;
    console.log('[SEARCH] Query Result:', { count: ads?.length, error, filters: { category, operacion, q } });

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                    Resultados de Búsqueda
                    {category && <span className="text-blue-600"> - {category}</span>}
                    {operacion && <span className="text-green-600"> ({operacion})</span>}
                </h1>

                {/* Barra de Filtros */}
                <FilterBar />

                {/* Resultados */}
                {!ads || ads.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-xl text-gray-500">No se encontraron resultados para tu búsqueda.</p>
                        <p className="text-gray-400 mt-2">Intenta ajustar los filtros o buscar otra cosa.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {ads.map((ad: any) => (
                            <AdCard key={ad.id} ad={ad} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

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

    // Extraer parámetros específicos
    const anio = searchParams.anio ? String(searchParams.anio) : null;
    const kilometraje = searchParams.kilometraje ? Number(searchParams.kilometraje) : null;
    const transmision = searchParams.transmision as string;
    const marca = searchParams.marca as string;

    const dormitorios = searchParams.dormitorios ? Number(searchParams.dormitorios) : null;
    const banos = searchParams.banos ? Number(searchParams.banos) : null;
    const m2 = searchParams.m2 ? Number(searchParams.m2) : null;
    const tipoPropiedad = searchParams.tipoPropiedad as string;


    if (minPrice !== null) {
        query = query.gte('price', minPrice);
    }

    if (maxPrice !== null) {
        query = query.lte('price', maxPrice);
    }

    // Filtros Específicos: Autos
    if (category?.toLowerCase() === 'autos' || category?.toLowerCase() === 'autos') { // Usamos lowercase para comparar
        if (anio) query = query.contains('features', { anio: anio }); // Anio suele ser string o number en JSON, contains busca igualdad en json
        if (transmision) query = query.contains('features', { transmision: transmision });
        if (marca) query = query.ilike('title', `%${marca}%`); // Marca suele estar en titulo o features, asumimos Búsqueda en Titulo por ahora para simplificar si no hay campo marca explicito
        // Kilometraje (Rango aprox o maximo) - JSONB numbers son dificiles de filtrar con gt/lt sin casting especifico en SQL crudo. 
        // Supabase JS tiene limitaciones con JSON filters > <. 
        // Para MVP, lo haremos post-filtro en memoria O asumiremos que el usuario quiere "hasta X km" si lo soportara la DB.
        // Por simplicidad y seguridad: 'contains' para exacto, o lo omitimos si es rango complejo sin RPC.
        // Dejaremos Kilometraje pendiente de "Rango" real, pero si el usuario busca exacto, usamos contains.
    }

    // Filtros Específicos: Inmuebles
    if (category?.toLowerCase() === 'inmuebles' || category?.toLowerCase() === 'propiedades') {
        if (dormitorios) query = query.contains('features', { dormitorios: dormitorios });
        if (banos) query = query.contains('features', { banos: banos });
        if (tipoPropiedad) query = query.contains('features', { tipo_propiedad: tipoPropiedad });
        // M2 similar a kilometraje, rango numerico en JSON es complejo.
    }

    // Ejecutar consulta
    const { data: ads, error } = await query;
    console.log('[SEARCH] Query Result:', { count: ads?.length, error, filters: { category, operacion, q } });

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <h1 className="text-3xl font-bold text-gray-900 mb-6 font-sans">
                    Resultados de Búsqueda
                    {category && <span className="text-blue-600 capitalize"> - {category}</span>}
                    {operacion && <span className="text-green-600 capitalize"> ({operacion})</span>}
                </h1>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Filtros */}
                    <aside className="w-full md:w-64 flex-shrink-0">
                        <FilterBar />
                    </aside>

                    {/* Resultados */}
                    <div className="flex-1">
                        {!ads || ads.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                <p className="text-xl text-gray-500">No se encontraron resultados.</p>
                                <p className="text-gray-400 mt-2">Prueba quitando algunos filtros.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                                {ads.map((ad: any) => (
                                    <AdCard key={ad.id} ad={ad} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

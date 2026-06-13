import { createClient } from '@/utils/supabase/server';
import AdCard from '@/components/AdCard';
import FilterBar from '@/components/FilterBar';
import SortDropdown from '@/components/SortDropdown';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function SearchPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const supabase = await createClient();

    // Extraer parámetros
    const category = searchParams.category as string;
    const operacion = searchParams.operacion as string;
    const q = searchParams.q as string;
    const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : null;
    const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : null;
    const sort = searchParams.sort as string || 'newest';
    const page = searchParams.page ? Math.max(1, Number(searchParams.page)) : 1;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Construir consulta base (Usar 'verified' para coincidir con DB)
    let query = supabase
        .from('ads')
        .select('*', { count: 'exact' })
        .in('status', ['verified', 'aprobado']);

    // Ordenamiento
    if (sort === 'price_asc') {
        query = query.order('price', { ascending: true });
    } else if (sort === 'price_desc') {
        query = query.order('price', { ascending: false });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    // Aplicar filtros dinámicos
    // --- MAPPING DE FILTROS (Lógica Estricta) ---
    // Mapeamos los params de la URL (Ej: 'Propiedades', 'Venta') a los valores reales de la BD.

    // 1. Categoría
    let dbCategory = null;
    if (category) {
        const catLower = category.toLowerCase();
        // Mapeo exhaustivo
        if (catLower === 'propiedades' || catLower === 'inmuebles') dbCategory = 'inmuebles';
        else if (catLower === 'autos' || catLower === 'vehiculos') dbCategory = 'autos';
        else dbCategory = catLower; // Fallback a lo que venga en minúsculas
    }

    if (dbCategory) {
        // Usamos ilike para 'category' por si en BD se guardó 'Autos' en vez de 'autos'
        query = query.ilike('category', dbCategory);

        // FIX CRITICO: Bloqueo explícito de categorías cruzadas
        if (dbCategory === 'inmuebles') {
            query = query.not('category', 'ilike', 'autos');
        } else if (dbCategory === 'autos') {
            query = query.not('category', 'ilike', 'inmuebles');
        }
    }

    // 2. Operación (Usando operador ->> para extraer texto del JSONB y ser flexible con mayúsculas)
    if (operacion) {
        // Buscamos ignorando mayúsculas/minúsculas en el valor del JSON key "operacion"
        // Nota: features->>operacion extrae el valor como texto.
        query = query.ilike('features->>operacion', operacion);
    }

    if (q) {
        query = query.ilike('title', `%${q}%`);
    }

    // Extraer parámetros específicos
    const anio = searchParams.anio ? String(searchParams.anio) : null;
    const kilometraje = searchParams.kilometraje ? Number(searchParams.kilometraje) : null;
    const transmision = searchParams.transmision as string;
    const marca = searchParams.marca as string;
    const combustible = searchParams.combustible as string;
    const duenos = searchParams.duenos as string;

    const dormitorios = searchParams.dormitorios ? Number(searchParams.dormitorios) : null;
    const banos = searchParams.banos ? Number(searchParams.banos) : null;
    const m2 = searchParams.m2 ? Number(searchParams.m2) : null;
    const tipoPropiedad = searchParams.tipoPropiedad as string;
    const gastosComunes = searchParams.gastosComunes ? Number(searchParams.gastosComunes) : null;
    const orientacion = searchParams.orientacion as string;


    if (minPrice !== null) {
        query = query.gte('price', minPrice);
    }

    if (maxPrice !== null) {
        query = query.lte('price', maxPrice);
    }

    // Filtros Específicos: Autos
    if (dbCategory === 'autos') {
        if (anio) query = query.contains('features', { anio: anio });
        if (transmision) query = query.contains('features', { transmision: transmision });
        if (combustible) query = query.contains('features', { combustible: combustible });
        if (duenos) query = query.contains('features', { duenos: duenos });
        if (marca) query = query.ilike('title', `%${marca}%`);
    }

    // Filtros Específicos: Inmuebles
    if (dbCategory === 'inmuebles') {
        if (dormitorios) query = query.contains('features', { dormitorios: dormitorios }); // Ideally gte, but simple contains for now
        if (banos) query = query.contains('features', { banos: banos });
        if (tipoPropiedad) query = query.contains('features', { tipo_propiedad: tipoPropiedad });
        if (orientacion) query = query.contains('features', { orientacion: orientacion });

        // Gastos Comunes Limit (lte logic is tricky with raw JSON in supabase-js without arrow operators or RPC)
        // For MVP we will use simple filtering or skip if too complex without raw SQL.
        // NOTE: Supabase JS library handles basic JSON containment easily. Comparisons inside JSON are harder.
        // We will SKIP numerical limit enforcement on server for GastosComunes to prevent errors,
        // OR we can fetch and filter in memory if dataset is small (which it is for now).
        // Let's filter in memory for now to ensure accuracy for the user demo.
    }

    // Ejecutar consulta con paginación
    let { data: ads, error, count } = await query.range(from, to);

    // --- FILTROS EN MEMORIA (Para lógica compleja JSON > <) ---
    if (ads && gastosComunes) {
        ads = ads.filter(ad => {
            const val = ad.features?.gastos_comunes ? Number(ad.features.gastos_comunes) : 0;
            return val <= gastosComunes;
        });
    }

    if (error) console.error('[SEARCH] Error en consulta:', error);

    const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

    // Construir URL base para paginación (preservar todos los filtros actuales)
    const buildPageUrl = (p: number) => {
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (operacion) params.set('operacion', operacion);
        if (q) params.set('q', q);
        if (minPrice) params.set('minPrice', String(minPrice));
        if (maxPrice) params.set('maxPrice', String(maxPrice));
        if (sort !== 'newest') params.set('sort', sort);
        if (p > 1) params.set('page', String(p));
        return `/buscar?${params.toString()}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 font-sans">
                        Resultados de Búsqueda
                        {category && <span className="text-blue-600 capitalize"> - {category}</span>}
                        {operacion && <span className="text-green-600 capitalize"> ({operacion})</span>}
                        {count !== null && count !== undefined && (
                            <span className="text-gray-400 text-lg font-normal ml-2">({count} encontrados)</span>
                        )}
                    </h1>
                    <div className="flex-shrink-0">
                        <SortDropdown />
                    </div>
                </div>

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
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                                    {ads.map((ad: any) => (
                                        <AdCard key={ad.id} ad={ad} />
                                    ))}
                                </div>

                                {/* Paginación */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-10">
                                        {page > 1 && (
                                            <Link
                                                href={buildPageUrl(page - 1)}
                                                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                ← Anterior
                                            </Link>
                                        )}
                                        <span className="px-4 py-2 text-sm text-gray-600">
                                            Página {page} de {totalPages}
                                        </span>
                                        {page < totalPages && (
                                            <Link
                                                href={buildPageUrl(page + 1)}
                                                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                Siguiente →
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

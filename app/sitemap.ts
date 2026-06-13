import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600; // Regenerar cada hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = 'https://qvisos.cl';

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
        { url: `${base}/buscar?category=Autos`, changeFrequency: 'daily', priority: 0.8 },
        { url: `${base}/buscar?category=Propiedades&operacion=Venta`, changeFrequency: 'daily', priority: 0.8 },
        { url: `${base}/buscar?category=Propiedades&operacion=Arriendo`, changeFrequency: 'daily', priority: 0.8 },
        { url: `${base}/activar`, changeFrequency: 'monthly', priority: 0.5 },
    ];

    // Avisos publicados (cliente anon directo: sitemap no tiene cookies)
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: ads } = await supabase
            .from('ads')
            .select('id, slug, updated_at, created_at')
            .eq('status', 'verified')
            .limit(1000);

        const adRoutes: MetadataRoute.Sitemap = (ads || []).map((ad) => ({
            url: `${base}/anuncio/${ad.slug || ad.id}`,
            lastModified: ad.updated_at || ad.created_at || undefined,
            changeFrequency: 'weekly',
            priority: 0.7,
        }));

        return [...staticRoutes, ...adRoutes];
    } catch {
        return staticRoutes;
    }
}

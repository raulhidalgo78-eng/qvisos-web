import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Lógica de Protección de Rutas
    const path = request.nextUrl.pathname;

    // 1. Rutas que SIEMPRE requieren login
    const isProtected =
        path === '/anuncio' || // Crear anuncio (exacto)
        path.includes('/editar') || // Editar cualquier cosa
        path.startsWith('/mis-anuncios') || // Panel de usuario
        path.startsWith('/dashboard') || // Dashboard admin
        path.startsWith('/admin'); // Rutas admin

    // 2. Excepción: Ver anuncio (/anuncio/123) es PÚBLICO
    // La lógica de arriba ya lo cubre: '/anuncio/123' no es '/anuncio' exacto, ni tiene 'editar'.

    if (!user && isProtected) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return response;
}

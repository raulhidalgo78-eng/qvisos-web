# Cambios — revisión Claude (09-06-2026)

## Actualización: migración Supabase (misma fecha)

La BD vieja (`wcczvedassfquzdrmwko`) estaba pausada >90 días. Se creó el proyecto nuevo **`qvisos`** (`dafsjupnqeqrfjmgbrji.supabase.co`) con tablas `ads`/`qr_codes` + RLS + bucket `media`, y se actualizaron las 3 variables en Vercel. En el código: `next.config.ts` apunta al host nuevo y el logo ahora se sirve LOCAL desde `/media/logo-qvisos.jpg` (Navbar e imprimir). Pendientes tuyos: registrarte en el sitio nuevo, y luego poner tu nuevo UUID en Vercel como env `ADMIN_USER_ID`.

## ⚠️ Antes de hacer commit

1. **NO subas** `app/admin/imprimir/oswaldFont.ts` — es un placeholder vacío. Mantén el original de GitHub (70 KB con la fuente en Base64).
2. Esta carpeta no incluye `package-lock.json` ni las imágenes de `public/` ni `app/favicon.ico` — no las borres de tu clon; solo copia encima los archivos de aquí.
3. Como cambió `package.json`, ejecuta `npm install` en tu clon para regenerar `package-lock.json` antes del commit.

## Archivos ELIMINADOS (bórralos también en tu clon con `git rm`)

- `lib/firebase.ts` y `components/ActivarForm.tsx` — código legacy de Firebase sin uso (inflaba el bundle).
- `components/AnuncioClientWrapper.tsx`, `components/AiChat.tsx`, `components/KeyFeaturesGrid.tsx`, `components/PublicMap.tsx` — componentes sin referencias.
- `app/qr/[code]/` — ruta duplicada; los letreros impresos usan `/q/CODIGO` (lógica unificada ahí).
- `app/dashboard/` — página duplicada de /mis-anuncios con estilos inline.
- `app/api/create-kit/`, `app/api/activate-kit/`, `app/api/upload/` — endpoints sin uso.
- `app/api/admin/approve/router.ts` — archivo duplicado muerto.

## Archivos MODIFICADOS

| Archivo | Cambio |
|---|---|
| `app/api/admin/approve/route.ts` | **Seguridad**: ahora exige sesión de admin (antes era público) y usa la tabla correcta `ads` (antes `anuncios`, que no existe). |
| `app/q/[code]/page.tsx` | Fix Next 16 (`await params`), código a mayúsculas, QR libre redirige a `/activar?prefill=`. |
| `utils/admin.ts` (nuevo) | ID de admin centralizado (configurable vía env `ADMIN_USER_ID`). |
| `app/actions/ad-actions.ts`, `app/admin/dashboard/{page,actions}.tsx/ts`, `app/admin/editar/[id]/page.tsx`, `app/mis-anuncios/page.tsx` | Usan `isAdminUser()` en vez del UUID hardcodeado. |
| `app/activar/page.tsx` | Eliminado email hardcodeado; redirige según rol a `/admin/dashboard`. |
| `app/layout.tsx` | **SEO**: metadata completa (title template, description, Open Graph, Twitter, robots, canonical) + Footer. |
| `app/anuncio/[id]/page.tsx` | **SEO**: `generateMetadata` dinámico (al compartir por WhatsApp sale foto, título y precio) + JSON-LD para Google. |
| `app/sitemap.ts` (nuevo) | Sitemap con rutas estáticas + avisos publicados, regenerado cada hora. |
| `app/robots.ts` (nuevo) | Permite indexar el sitio, bloquea /admin, /login, /api. |
| `components/Footer.tsx` (nuevo) | Footer con enlaces y señales de confianza. |
| `app/login/page.tsx` | Rediseño con Tailwind consistente con el resto del sitio. |
| `components/Navbar.tsx` | Enlace "Buscar" agregado. |
| `app/page.tsx`, `app/buscar/page.tsx` | console.log de debug eliminados (solo quedan console.error). |
| `package.json` | Eliminadas 10 dependencias sin uso (firebase, busboy, html2canvas, react-markdown, @tanstack/react-table, react-icons, zod, @react-google-maps/api, @types/busboy, @types/jspdf). |

## Pendientes sugeridos (no aplicados)

- Botón "Comprar Kit en MercadoLibre" en la home apunta a `www.mercadolibre.cl` genérico — reemplazar con la URL de tu publicación real (`app/page.tsx`).
- Subir un `og-image` dedicado (1200x630) para compartir en redes.
- Galería multi-foto por aviso (hoy solo 1 imagen).
- Estado de sesión en el Navbar (mostrar "Mis Anuncios"/"Salir" si hay login).

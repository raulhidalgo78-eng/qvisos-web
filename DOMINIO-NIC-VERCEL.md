# Enlazar qvisos.cl (NIC Chile) con Vercel

## Paso 1 — En Vercel (2 min)

1. Entra a tu proyecto en vercel.com → **Settings → Domains**.
2. Agrega `qvisos.cl` y luego `www.qvisos.cl`.
3. Vercel marcará ambos como "Invalid Configuration" — normal, falta el DNS.
4. Deja `qvisos.cl` como dominio principal y configura `www` para redirigir a él (Vercel lo ofrece al agregarlo).

## Paso 2 — En NIC Chile (5 min)

Entra a [nic.cl](https://www.nic.cl) → Iniciar sesión → Mis dominios → `qvisos.cl` → **Administrar DNS**.

**Opción A — Delegar a Vercel (recomendada, más simple):**

En "Servidores de nombre (NS)" reemplaza los actuales por:

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

Con esto Vercel administra todo el DNS automáticamente (incluye www y SSL). NIC Chile valida los NS antes de aceptar el cambio; como ya agregaste el dominio en Vercel en el Paso 1, la validación pasa.

**Opción B — Mantener DNS en NIC Chile:**

Si prefieres administrar registros en NIC (p. ej. para correo futuro), usa la herramienta de DNS de NIC y crea:

| Tipo | Nombre | Valor |
|---|---|---|
| A | @ (qvisos.cl) | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

*(Verifica el valor A exacto en Vercel → Domains → qvisos.cl, ahí muestra la IP vigente.)*

## Paso 3 — Esperar y verificar

- Propagación: desde minutos hasta ~24 h (NIC suele ser rápido, 1-2 h).
- En Vercel → Domains verás el check verde ✅ y el certificado SSL se emite solo.
- Prueba: `https://qvisos.cl` y `https://www.qvisos.cl` deben cargar el sitio.

## Paso 4 — Post-conexión (importante para SEO)

1. En Vercel → Settings → Domains: confirma que `qvisos.cl` es el dominio **principal** (los deploys *.vercel.app redirigen a él).
2. Registra el sitio en [Google Search Console](https://search.google.com/search-console) (propiedad de dominio `qvisos.cl`; la verificación se hace con un registro TXT en el DNS, que con la Opción A agregas desde Vercel → Domains → DNS Records).
3. En Search Console, envía el sitemap: `https://qvisos.cl/sitemap.xml` (ya quedó implementado en el código).

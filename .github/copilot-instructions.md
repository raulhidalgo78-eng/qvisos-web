<!--
  Copilot / AI assistant instructions for the qvisos-web repository.
  Keep this file concise and fact-focused. Edit only when repo structure or workflow changes.
-->

# qvisos-web — AI assistant quick guide

Short, actionable notes to help an AI agent be productive immediately.

- Framework: Next.js (App Router) — repo uses the `app/` directory (see `app/layout.tsx`, `app/page.tsx`).
- Supabase: single client at `lib/supabase.ts` (expects NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).

Key locations
- `app/activar/page.tsx` — kit activation UI; calls `POST /api/activate-kit`.
- `app/anuncio/page.tsx` — listing creation UI; client component (must start with `"use client"`) and implements file upload logic.
- `app/api/` — server API routes (Route Handlers): examples include `app/api/upload/media/route.ts` and `app/api/activate-kit/route.ts`.
- `lib/supabase.ts` — shared Supabase client for front/back. Use the `@/` alias when importing.

Architecture & data flow (short)
- Frontend (client components) live under `app/` and call internal API routes under `app/api/` for server-side work (uploads, activation).
- File uploads: `anuncio/page.tsx` collects files (images/videos/docs), creates a draft `ads` row via Supabase, then posts each file with FormData to `/api/upload/media` which uses `formidable` (server) to persist files and register them in the DB/storage.
- Auth: Supabase Auth is used. Frontend reads session with `supabase.auth.getSession()` and subscribes with `supabase.auth.onAuthStateChange`.

Important conventions & gotchas
- Client components MUST have "use client" as the first line (see `app/activar/page.tsx`, `app/anuncio/page.tsx`).
- Import alias: use `import { supabase } from '@/lib/supabase'` (tsconfig.json path alias `@/*`).
- File upload limits: 100MB total (see constants in `app/anuncio/page.tsx`: `MAX_FILE_SIZE`, `MAX_FILE_COUNT = 35`). The client sends FormData and the server expects field name `file`.
- API routes use Next.js route handlers (exporting `POST`, `GET`, etc.) rather than Next.js pages/api legacy format.
- The DB expects these tables (discoverable from code): `ads`, `activations`, `activation_kits` (or similarly named). `ads.user_id` references the user table — don't insert a placeholder user id; use `session.user.id` from Supabase.

Developer workflows (commands for PowerShell)
```powershell
# Start dev server
npm run dev

# Build for production
npm run build

# Start built app
npm run start

# Lint (project uses eslint)
npm run lint
```

Environment notes
- Local env file: `.env.local` must contain `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. This repo may have an example `.env.local` in workspace — DO NOT commit real secrets.
- `.gitignore` already excludes `.env*`.

Quick examples (patterns to reuse)
- Get current session (client):
  - `const { data: { session } } = await supabase.auth.getSession()`
  - Subscribe: `supabase.auth.onAuthStateChange((event, session) => { ... })`
- Upload a file from client (FormData to API):
  - `const fd = new FormData(); fd.append('adId', id); fd.append('file', file); fetch('/api/upload/media', { method: 'POST', body: fd })`

DB & security notes
- Expect `ads.user_id` to be a foreign key to the users table (Supabase Auth). If you see FK errors, ensure the user exists in Auth and use `session.user.id` when inserting.
- Repository does not include explicit SQL migrations — schema lives in Supabase. When implementing new DB changes, add a short README or SQL snippet to `db/`.

Troubleshooting
- "Unexpected token '<'" when parsing JSON: frontend called an endpoint that returned HTML (usually missing API route or 404). Check `app/api/*` routes and the client fetch path.
- FK constraint on `ads.user_id`: ensure user is authenticated and you're inserting a valid `user_id` (use Supabase session).

If something is missing or ambiguous, ask for:
- the Supabase project schema or a DB dump
- intended storage target for uploaded files (Supabase Storage or another service)

Please review and tell me which section you want expanded (DB schema, sample API routes, auth flows, or file upload server code).
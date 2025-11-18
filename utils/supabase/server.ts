// En: utils/supabase/server.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Esta función AHORA ES ASÍNCRONA (async)
export async function createClient() {
  
  // Usamos 'await' para la nueva versión de cookies
  const cookieStore = await cookies() 

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) { /* Ignorar error */ }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) { /* Ignorar error */ }
        },
      },
    }
  )
}
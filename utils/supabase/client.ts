// En: utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Este cliente lee las variables NEXT_PUBLIC_ de forma segura en el navegador
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
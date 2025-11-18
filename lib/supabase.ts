// Archivo: lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

// Las variables de entorno son leídas automáticamente por Next.js
// ¡Asegúrate de haberlas configurado en tu archivo .env.local y en Vercel!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // En un entorno local, esto lanzará un error si las variables no existen.
  // En producción, Vercel ya las tiene.
  console.error("Faltan las variables de entorno de Supabase (NEXT_PUBLIC_...)");
}

// Exporta el cliente para usarlo en el frontend y backend
// Usamos ! para afirmar que las URLs existen (ya que ya hicimos el chequeo)
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
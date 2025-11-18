// En: app/login/actions.ts

'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  // 1. Obtenemos el email y password del formulario
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos.' };
  }

  // 2. Usamos el cliente del SERVIDOR (con await)
  const supabase = await createClient();

  // 3. Intentamos iniciar sesión
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error de login:', error.message);
    return { error: 'Credenciales inválidas. Por favor intente de nuevo.' };
  }

  // 4. ¡Éxito! Redirigimos al usuario.
  // Esta redirección (del lado del servidor) es la que soluciona el bucle.
  redirect('/mis-anuncios');
}
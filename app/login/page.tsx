// Archivo: app/login/page.tsx

'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

// --- COMPONENTE INTERNO (Lógica del Login) ---
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();

  // Aquí capturamos a dónde quería ir el usuario antes de que lo mandáramos al login
  const returnUrl = searchParams.get('returnUrl');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage('Credenciales inválidas. Revisa tu email y contraseña.');
      setLoading(false);
    } else {
      setMessage('');

      // 1. Si hay una URL de retorno pendiente (ej: ir a crear anuncio), vamos ahí.
      if (returnUrl) {
        router.push(returnUrl);
        return;
      }

      // 2. Si no hay retorno pendiente, usamos la lógica de roles normal.
      const userRole = data.user?.user_metadata?.role;
      if (userRole === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/mis-anuncios');
      }
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Iniciar Sesión</h1>
          <p className="text-gray-500 text-sm mt-1">Ingresa para gestionar tus avisos</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              placeholder="••••••••"
            />
          </div>

          {message && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 text-center">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Aún no tienes cuenta?{' '}
          <Link href="/activar" className="text-blue-600 font-bold hover:underline">
            Activa tu QR aquí
          </Link>
        </p>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL (Protegido con Suspense para Vercel) ---
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-gray-500">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}

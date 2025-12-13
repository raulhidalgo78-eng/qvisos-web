// Archivo: app/login/page.tsx

'use client';

import React, { useState, Suspense } from 'react';
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
      setMessage(`❌ Error: ${error.message}`);
      setLoading(false);
    } else {
      setMessage('✅ Éxito. Redirigiendo...');

      // --- AQUÍ ESTÁ EL ARREGLO ---
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
    <div style={{ padding: '40px', maxWidth: '500px', margin: '50px auto', fontFamily: 'sans-serif', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h1 style={{ textAlign: 'center', color: '#0070f3' }}>Iniciar Sesión</h1>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={{ width: '100%', padding: '12px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{ width: '100%', padding: '12px', border: '1px solid #ccc' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '12px', backgroundColor: '#0070f3', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px' }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      {message && <p style={{ marginTop: '20px', textAlign: 'center', fontWeight: 'bold' }}>{message}</p>}
    </div>
  );
}

// --- COMPONENTE PRINCIPAL (Protegido con Suspense para Vercel) ---
export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center' }}>Cargando Login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
// En: app/login/page.tsx

'use client'; // Sigue siendo un Client Component para interactividad

import { useState } from 'react';
import { login } from './actions'; // 1. Importamos la Server Action

export default function LoginPage() {
  // Estado solo para manejar el mensaje de error
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 2. Creamos el FormData directamente del formulario
    const formData = new FormData(e.currentTarget);

    // 3. Llamamos a la Server Action
    const result = await login(formData);

    // 4. Si la acción devuelve un error, lo mostramos
    if (result && result.error) {
      setError(result.error);
      setLoading(false);
    }
    // (Si tiene éxito, la Server Action ya habrá redirigido,
    // por lo que no necesitamos hacer nada aquí)
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1>Iniciar Sesión</h1>
      
      {/* 5. El formulario ahora llama a handleSubmit */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          {/* Los 'name' deben coincidir con el formData: "email" y "password" */}
          <input
            type="email"
            id="email"
            name="email"
            required
            style={{ width: '100%', padding: '8px', color: '#333' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Contraseña</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            style={{ width: '100%', padding: '8px', color: '#333' }}
          />
        </div>

        {/* 6. Mostramos el error si existe */}
        {error && (
          <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>
        )}

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
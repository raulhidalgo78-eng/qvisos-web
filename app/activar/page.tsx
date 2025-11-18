// Archivo: app/activar/page.tsx

'use client'; 

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // <-- (1/3) NUEVA IMPORTACIÓN

export default function ActivarKitPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [activationCode, setActivationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const router = useRouter(); // <-- (2/3) INICIALIZAR EL ROUTER

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setIsSuccess(false);

        try {
            const response = await fetch('/api/activate-kit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, activationCode }),
            });

            const data = await response.json();
            
            if (response.ok) {
                setMessage('✅ Activación Exitosa! Redirigiendo a la creación de tu anuncio...');
                setIsSuccess(true);
                
                // --- (3/3) NUEVA LÓGICA DE REDIRECCIÓN ---
                // Espera 2 segundos para que el usuario lea el mensaje
                setTimeout(() => {
                    router.push('/anuncio'); // Redirige a la página de crear anuncio
                }, 2000); // 2000ms = 2 segundos
                
            } else {
                setMessage(`❌ Error: ${data.message || 'Intente nuevamente.'}`);
            }
        
        } catch (error) {
            console.error("Error en el fetch:", error);
            setMessage('❌ Error de conexión con el servidor. Revisa la terminal.');
        } finally {
            setLoading(false);
        }
    };

    // ... (el resto del código JSX del return es idéntico) ...
    
    return (
        <div style={{ padding: '40px', maxWidth: '500px', margin: '50px auto', fontFamily: 'sans-serif', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h1 style={{ textAlign: 'center', color: '#0070f3' }}>
                Activar Kit QR | Qvisos
            </h1>
            <p style={{ textAlign: 'center', marginBottom: '30px' }}>
                Ingresa tu código único y crea tu cuenta de vendedor.
            </p>

            <form onSubmit={handleSubmit}>
                
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
                
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Contraseña (mín. 6 caracteres):</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        minLength={6}
                        disabled={loading}
                        style={{ width: '100%', padding: '12px', border: '1px solid #ccc' }}
                    />
                </div>
                
                <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Código de Activación (Kit QR):</label>
                    <input 
                        type="text" 
                        value={activationCode} 
                        onChange={(e) => setActivationCode(e.target.value.toUpperCase())} 
                        required 
                        disabled={loading}
                        style={{ width: '100%', padding: '12px', border: '2px solid #0070f3' }}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading || isSuccess} // Deshabilitado si ya fue exitoso
                    style={{ width: '100%', padding: '12px', backgroundColor: isSuccess ? '#4CAF50' : '#0070f3', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                >
                    {loading ? 'Validando Kit...' : 'Activar Cuenta y Kit'}
                </button>
            </form>

            {message && (
                <p style={{ 
                    color: isSuccess ? 'green' : 'red', 
                    marginTop: '20px', 
                    fontWeight: 'bold',
                    textAlign: 'center'
                }}>
                    {message}
                </p>
            )}

            <p style={{ marginTop: '30px', fontSize: '12px', textAlign: 'center', color: '#666' }}>
                *Usa el código de prueba **TEST-QVISOS-123** para la primera activación.
            </p>
        </div>
    );
}
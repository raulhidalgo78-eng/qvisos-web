'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { checkQrCategory } from '@/app/actions/check-qr';

export default function ActivarPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const qrCode = formData.get('qr_code') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!qrCode || !email || !password) {
            setError('Por favor completa todos los campos.');
            setLoading(false);
            return;
        }

        const supabase = createClient();

        try {
            // 1. Verificar si el QR es válido ANTES de intentar registrar
            const category = await checkQrCategory(qrCode);
            if (!category) {
                throw new Error('El código QR ingresado no es válido o no existe.');
            }

            // 2. Intentar registrar al usuario (SignUp)
            // Si el usuario ya existe, Supabase NO loguea automáticamente en signUp, devuelve un error o user null dependiendo config.
            // Pero podemos intentar SignIn si falla SignUp por "User already registered".

            let { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) {
                // Si el error es que ya existe, intentamos loguear
                if (authError.message.includes('already registered') || authError.status === 422 || authError.status === 400) {
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                    if (signInError) {
                        throw new Error('El usuario ya existe pero la contraseña es incorrecta.');
                    }
                    authData = signInData;
                } else {
                    throw new Error(authError.message);
                }
            }

            // Verificar si tenemos sesión
            if (!authData.user) {
                // Caso raro: registro exitoso pero requiere confirmación de email (si está habilitado)
                // Asumimos que está deshabilitado o que permite login inmediato.
                throw new Error('Revisa tu email para confirmar tu cuenta o intenta iniciar sesión.');
            }

            // 3. Redirección Inteligente según Categoría
            let targetUrl = `/anuncio?code=${qrCode}`;
            if (category === 'venta_auto') targetUrl += '&tipo=auto';
            else if (category === 'venta_propiedad') targetUrl += '&tipo=propiedad-venta';
            else if (category === 'arriendo_propiedad') targetUrl += '&tipo=propiedad-arriendo';

            router.push(targetUrl);

        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado.');
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                maxWidth: '450px',
                width: '100%'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '10px' }}>
                        ¡Activa tu Letrero!
                    </h1>
                    <p style={{ color: '#6b7280' }}>
                        Crea tu cuenta (o ingresa) y vincula tu código QR en un solo paso.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Campo Código QR */}
                    <div>
                        <label htmlFor="qr_code" style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151' }}>
                            Código del Kit QR
                        </label>
                        <input
                            id="qr_code"
                            name="qr_code"
                            type="text"
                            placeholder="Ej: QV-001"
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #2563eb',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                backgroundColor: '#eff6ff'
                            }}
                        />
                    </div>

                    {/* Campo Email */}
                    <div>
                        <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151' }}>
                            Correo Electrónico
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="tu@email.com"
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                        />
                    </div>

                    {/* Campo Password */}
                    <div>
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151' }}>
                            Contraseña
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="********"
                            required
                            minLength={6}
                            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                        />
                    </div>

                    {error && (
                        <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Procesando...' : 'Activar y Comenzar 🚀'}
                    </button>

                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#9ca3af' }}>
                    Al continuar, aceptas nuestros términos y condiciones.
                </div>
            </div>
        </div>
    );
}
'use client';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation'; // <--- Import actualizado
import React, { useState, useEffect } from 'react';
import { checkQrCategory } from '@/app/actions/check-qr';
import { User } from '@supabase/supabase-js';

export default function ActivarPage() {
    const router = useRouter();
    const searchParams = useSearchParams(); // <--- Hook para leer URL

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [checkingSession, setCheckingSession] = useState(true);

    // State for 2-Step Flow
    const [step, setStep] = useState<1 | 2>(1);
    const [verifiedCode, setVerifiedCode] = useState<string | null>(null);
    const [verifiedCategory, setVerifiedCategory] = useState<string | null>(null);
    const [authTab, setAuthTab] = useState<'login' | 'register'>('register');

    const supabase = createClient();

    // 1. Check Session
    useEffect(() => {
        const checkSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setCheckingSession(false);
        };
        checkSession();
    }, []);

    // 2. NUEVO: Detectar ?tab=login en la URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'login') {
            setAuthTab('login');
            // Opcional: Si quisieras saltar el paso del QR para solo loguear, 
            // necesitarías lógica extra, pero por ahora pre-seleccionamos la pestaña.
            // Si el usuario ya verificado llega aquí, verá el login directo.
            if (step === 1) {
                // Si es solo login administrativo, podríamos forzar paso 2 con datos dummy 
                // o simplemente dejarlo listo para cuando verifique.
                // Por ahora, solo cambiamos el tab visualmente.
            }
        }
    }, [searchParams, step]);

    // Step 1: Verify QR Code
    const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const qrCode = formData.get('qr_code') as string;

        if (!qrCode) {
            setError('Por favor ingresa el código QR.');
            setLoading(false);
            return;
        }

        try {
            const category = await checkQrCategory(qrCode);
            if (!category) {
                throw new Error('El código QR no es válido o no está listo para activarse.');
            }

            setVerifiedCode(qrCode);
            setVerifiedCategory(category);
            setStep(2);
            setLoading(false);
        } catch (err: any) {
            setError(err.message || 'Error al verificar el código.');
            setLoading(false);
        }
    };

    // Step 2: Authenticate & Link
    const handleAuthAndLink = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!verifiedCode || !verifiedCategory) {
            setError('Error de estado. Por favor recarga la página.');
            setLoading(false);
            return;
        }

        if (user) {
            proceedToLink(verifiedCode, verifiedCategory);
            return;
        }

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!email || !password) {
            setError('Por favor completa todos los campos.');
            setLoading(false);
            return;
        }

        try {
            let authUser = null;

            if (authTab === 'register') {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                authUser = data.user;
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                authUser = data.user;
            }

            if (!authUser) throw new Error('No se pudo autenticar. Revisa tu correo.');

            // Success! Proceed to link
            proceedToLink(verifiedCode, verifiedCategory);

        } catch (err: any) {
            setError(err.message || 'Error de autenticación.');
            setLoading(false);
        }
    };

    const proceedToLink = (code: string, category: string) => {
        let targetUrl = `/anuncio?code=${code}`;
        if (category === 'venta_auto') targetUrl += '&tipo=auto';
        else if (category === 'venta_propiedad') targetUrl += '&tipo=propiedad-venta';
        else if (category === 'arriendo_propiedad') targetUrl += '&tipo=propiedad-arriendo';

        router.push(targetUrl);
    };

    // Auto-trigger link if user is logged in when entering Step 2
    useEffect(() => {
        if (step === 2 && user && verifiedCode && verifiedCategory) {
            const timer = setTimeout(() => {
                proceedToLink(verifiedCode, verifiedCategory);
            }, 1500); // Small delay to show "Verified" message
            return () => clearTimeout(timer);
        }
    }, [step, user, verifiedCode, verifiedCategory]);


    if (checkingSession) {
        return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    }

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
                        {authTab === 'login' && step === 2 ? 'Ingresar a tu Cuenta' : '¡Activa tu Letrero!'}
                    </h1>
                    <p style={{ color: '#6b7280' }}>
                        {step === 1 ? 'Paso 1: Verifica tu código' : 'Paso 2: Vincula tu cuenta'}
                    </p>
                </div>

                {/* STEP 1: VERIFY */}
                {step === 1 && (
                    <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                            {loading ? 'Verificando...' : 'Verificar Código'}
                        </button>
                    </form>
                )}

                {/* STEP 2: AUTH & LINK */}
                {step === 2 && (
                    <div>
                        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #10b981', color: '#065f46', textAlign: 'center' }}>
                            <strong>✅ Código Verificado:</strong> {verifiedCode}
                        </div>

                        {user ? (
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '10px' }}>Hola <strong>{user.email}</strong></p>
                                <p>Asignando código a tu cuenta...</p>
                                <div style={{ marginTop: '15px' }} className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : (
                            <div>
                                {/* TABS */}
                                <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setAuthTab('register')}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderBottom: authTab === 'register' ? '2px solid #2563eb' : 'none',
                                            color: authTab === 'register' ? '#2563eb' : '#6b7280',
                                            fontWeight: 'bold',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Soy Nuevo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAuthTab('login')}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderBottom: authTab === 'login' ? '2px solid #2563eb' : 'none',
                                            color: authTab === 'login' ? '#2563eb' : '#6b7280',
                                            fontWeight: 'bold',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Ya tengo cuenta
                                    </button>
                                </div>

                                <form onSubmit={handleAuthAndLink} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                                        {loading ? 'Procesando...' : (authTab === 'register' ? 'Registrar y Activar' : 'Ingresar y Activar')}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#9ca3af' }}>
                    Al continuar, aceptas nuestros términos y condiciones.
                </div>
            </div>
        </div>
    );
}
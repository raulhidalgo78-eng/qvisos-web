'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, Suspense } from 'react';
import { checkQrCategory } from '@/app/actions/check-qr';
import { User } from '@supabase/supabase-js';

function ActivarContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [checkingSession, setCheckingSession] = useState(true);

    // Estados de flujo
    const [step, setStep] = useState<1 | 2>(1);
    const [verifiedCode, setVerifiedCode] = useState<string | null>(null);
    const [verifiedCategory, setVerifiedCategory] = useState<string | null>(null);
    const [authTab, setAuthTab] = useState<'login' | 'register'>('register');
    const [isLoginMode, setIsLoginMode] = useState(false);

    // 1. Verificar Sesión
    useEffect(() => {
        const checkSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setCheckingSession(false);
        };
        checkSession();
    }, []);

    // 2. Detectar URL (?tab=login o ?prefill=QV-001)
    useEffect(() => {
        const tab = searchParams.get('tab');
        const prefillCode = searchParams.get('prefill');

        const autoVerify = async (code: string) => {
            setLoading(true);
            try {
                const category = await checkQrCategory(code);
                if (category) {
                    setVerifiedCode(code);
                    setVerifiedCategory(category);
                    setStep(2);
                } else {
                    setError("El código escaneado no es válido.");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        if (prefillCode) {
            autoVerify(prefillCode);
        } else if (tab === 'login') {
            setIsLoginMode(true);
            setStep(2);
            setAuthTab('login');
        } else {
            setIsLoginMode(false);
            setStep(1);
        }
    }, [searchParams]);

    // Logout
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setAuthTab('login');
    };

    // Verificar QR Manual
    const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const qrCode = formData.get('qr_code') as string;

        if (!qrCode) { setError('Falta código QR'); setLoading(false); return; }

        try {
            const category = await checkQrCategory(qrCode);
            if (!category) throw new Error('Código no válido');
            setVerifiedCode(qrCode);
            setVerifiedCategory(category);
            setStep(2);
        } catch (err: any) {
            setError(err.message);
        } finally { setLoading(false); }
    };

    // Autenticación
    const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);

        try {
            let authUser = user;
            if (!authUser) {
                const email = formData.get('email') as string;
                const password = formData.get('password') as string;

                if (authTab === 'register') {
                    const { data, error } = await supabase.auth.signUp({ email, password });
                    if (error) throw error;
                    authUser = data.user;
                } else {
                    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    authUser = data.user;
                }
            }

            if (!authUser) throw new Error('Error de autenticación');

            if (isLoginMode) {
                // Redirección Login
                if (authUser.email === 'rhidalgo@radisson.cl') router.push('/admin');
                else router.push('/mis-anuncios');
            } else {
                // Redirección Vinculación
                let targetUrl = `/anuncio?code=${verifiedCode}`;
                if (verifiedCategory === 'venta_auto') targetUrl += '&tipo=auto';
                else if (verifiedCategory === 'venta_propiedad') targetUrl += '&tipo=propiedad-venta';
                else if (verifiedCategory === 'arriendo_propiedad') targetUrl += '&tipo=propiedad-arriendo';
                router.push(targetUrl);
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (checkingSession) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isLoginMode ? 'Bienvenido' : '¡Activa tu Letrero!'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {isLoginMode ? 'Ingresa para gestionar tus avisos' : (step === 1 ? 'Paso 1: Verifica código' : 'Paso 2: Cuenta')}
                    </p>
                </div>

                {/* Paso 1: QR */}
                {step === 1 && !isLoginMode && (
                    <form onSubmit={handleVerify} className="space-y-4">
                        <input name="qr_code" placeholder="Ej: QV-001" required className="w-full p-3 border-2 border-blue-500 rounded bg-blue-50" />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button disabled={loading} className="w-full py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50">
                            {loading ? '...' : 'Verificar Código'}
                        </button>
                    </form>
                )}

                {/* Paso 2: Auth */}
                {step === 2 && (
                    <div className="space-y-4">
                        {!isLoginMode && verifiedCode && (
                            <div className="p-3 bg-green-50 border border-green-400 text-green-800 rounded text-center">
                                ✅ Código: <strong>{verifiedCode}</strong>
                            </div>
                        )}

                        {!isLoginMode && !user && (
                            <div className="flex border-b mb-4">
                                <button type="button" onClick={() => setAuthTab('register')} className={`flex-1 py-2 ${authTab === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Soy Nuevo</button>
                                <button type="button" onClick={() => setAuthTab('login')} className={`flex-1 py-2 ${authTab === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Ya tengo cuenta</button>
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-3">
                            {!user && (
                                <>
                                    <input name="email" type="email" placeholder="Email" required className="w-full p-3 border rounded" />
                                    <input name="password" type="password" placeholder="Contraseña" required className="w-full p-3 border rounded" />
                                </>
                            )}

                            {user && (
                                <div className="text-center mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-gray-700 mb-2">Continuar como <strong>{user.email}</strong></p>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="text-xs text-red-500 hover:text-red-700 underline font-medium"
                                    >
                                        ¿No eres tú? Cerrar sesión
                                    </button>
                                </div>
                            )}

                            {error && <p className="text-red-500 text-sm">{error}</p>}

                            <button disabled={loading} className="w-full py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50">
                                {loading ? '...' : (isLoginMode ? 'Ingresar' : 'Vincular y Activar')}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ActivarPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ActivarContent />
        </Suspense>
    );
}
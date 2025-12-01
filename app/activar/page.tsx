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

    // Nuevo estado para saber si es "Solo Login"
    const [isLoginMode, setIsLoginMode] = useState(false);

    // 1. Verificar Sesión al cargar
    useEffect(() => {
        const checkSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setCheckingSession(false);
        };
        checkSession();
    }, []);

    // 2. Detectar cambios en URL (?tab=login)
    useEffect(() => {
        const tab = searchParams.get('tab');

        if (tab === 'login') {
            // MODO LOGIN
            setIsLoginMode(true);
            setStep(2);
            setAuthTab('login');
        } else {
            // MODO ACTIVAR (Reset si se quita el parametro)
            setIsLoginMode(false);
            setStep(1);
            setAuthTab('register');
            // Limpiamos errores previos al cambiar de modo
            setError(null);
        }
    }, [searchParams]);

    // Paso 1: Verificar QR (Solo si NO es login mode)
    const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const qrCode = formData.get('qr_code') as string;

        if (!qrCode) {
            setError('Falta el código QR.');
            setLoading(false);
            return;
        }

        try {
            const category = await checkQrCategory(qrCode);
            if (!category) throw new Error('Código QR no válido.');

            setVerifiedCode(qrCode);
            setVerifiedCategory(category);
            setStep(2);
        } catch (err: any) {
            setError(err.message || 'Error al verificar.');
        } finally {
            setLoading(false);
        }
    };

    // Paso 2: Autenticación (Login o Registro)
    const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Si estamos en modo activación (no login mode), necesitamos el código
        if (!isLoginMode && (!verifiedCode || !verifiedCategory)) {
            setError('Error de flujo. Recarga la página.');
            setLoading(false);
            return;
        }

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            let authUser = user; // Si ya estaba logueado

            // Si no está logueado, intentamos auth
            if (!authUser) {
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

            if (!authUser) throw new Error('Error de autenticación.');

            // --- DECISIÓN DE RUTAS ---

            if (isLoginMode) {
                // A) MODO LOGIN PURO: Redirigir según rol
                // Aquí puedes poner tu email de admin real
                if (authUser.email === 'rhidalgo@radisson.cl') {
                    router.push('/admin');
                } else {
                    router.push('/mis-anuncios');
                }
            } else {
                // B) MODO ACTIVACIÓN: Vincular QR y redirigir al formulario
                proceedToLink(verifiedCode!, verifiedCategory!);
            }

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

    if (checkingSession) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">

                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        {isLoginMode ? 'Bienvenido a QVisos' : '¡Activa tu Letrero!'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {isLoginMode
                            ? 'Ingresa para gestionar tus anuncios'
                            : (step === 1 ? 'Paso 1: Verifica tu código' : 'Paso 2: Vincula tu cuenta')
                        }
                    </p>
                </div>

                {/* STEP 1: QR (Solo si NO es login mode) */}
                {step === 1 && !isLoginMode && (
                    <form onSubmit={handleVerify} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Código del Kit QR</label>
                            <input name="qr_code" placeholder="Ej: QV-001" required
                                className="w-full p-3 border-2 border-blue-500 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                        </div>
                        {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
                        <button type="submit" disabled={loading}
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                            {loading ? 'Verificando...' : 'Verificar Código'}
                        </button>
                    </form>
                )}

                {/* STEP 2: AUTH FORM */}
                {step === 2 && (
                    <div>
                        {/* Solo mostrar badge verde si estamos activando un QR */}
                        {!isLoginMode && verifiedCode && (
                            <div className="mb-6 p-3 bg-green-50 border border-green-400 text-green-800 rounded text-center">
                                ✅ Código Verificado: <strong>{verifiedCode}</strong>
                            </div>
                        )}

                        {/* Tabs (Solo mostrar si NO es login mode, o login mode fuerza solo 'login') */}
                        {!isLoginMode && !user && (
                            <div className="flex border-b border-gray-200 mb-6">
                                <button type="button" onClick={() => setAuthTab('register')}
                                    className={`flex-1 py-2 font-bold ${authTab === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
                                    Soy Nuevo
                                </button>
                                <button type="button" onClick={() => setAuthTab('login')}
                                    className={`flex-1 py-2 font-bold ${authTab === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
                                    Ya tengo cuenta
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-4">
                            {!user && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Correo Electrónico</label>
                                        <input name="email" type="email" placeholder="tu@email.com" required
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
                                        <input name="password" type="password" placeholder="********" required minLength={6}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
                                    </div>
                                </>
                            )}

                            {/* Mensaje si ya está logueado */}
                            {user && (
                                <div className="text-center mb-4 text-gray-600">
                                    Continuar como <strong>{user.email}</strong>
                                </div>
                            )}

                            {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

                            <button type="submit" disabled={loading}
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                                {loading ? 'Procesando...' : (isLoginMode ? 'Ingresar' : 'Vincular y Activar')}
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
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
            <ActivarContent />
        </Suspense>
    );
}
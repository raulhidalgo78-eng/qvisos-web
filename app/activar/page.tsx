'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, Suspense } from 'react';
import { checkQrCategory } from '@/app/actions/check-qr';
import { User } from '@supabase/supabase-js';

// Componente interno con la lógica
function ActivarContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [checkingSession, setCheckingSession] = useState(true);

    // Estados
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

    // 2. DETECTOR DE URL (ESTO ES LO QUE TE FALTA)
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'login') {
            console.log("Modo Login detectado!"); // Debug
            setIsLoginMode(true);
            setStep(2);
            setAuthTab('login');
        } else {
            setIsLoginMode(false);
            setStep(1);
        }
    }, [searchParams]);

    // Lógica del Paso 1 (QR)
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

    // Lógica del Paso 2 (Auth)
    const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            let authUser = user;
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

            if (!authUser) throw new Error('Error de autenticación');

            // Redirección
            if (isLoginMode) {
                if (authUser.email === 'rhidalgo@radisson.cl') router.push('/admin');
                else router.push('/mis-anuncios');
            } else {
                // Vincular QR
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

                {/* FORMULARIO QR (Solo si NO es login) */}
                {step === 1 && !isLoginMode && (
                    <form onSubmit={handleVerify} className="space-y-4">
                        <input name="qr_code" placeholder="Ej: QV-001" required className="w-full p-3 border-2 border-blue-500 rounded bg-blue-50" />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button disabled={loading} className="w-full py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50">
                            {loading ? '...' : 'Verificar Código'}
                        </button>
                    </form>
                )}

                {/* FORMULARIO AUTH */}
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
                            {user && <p className="text-center text-gray-600">Continuar como <strong>{user.email}</strong></p>}

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

// Wrapper necesario para usar useSearchParams en Next.js
export default function ActivarPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ActivarContent />
        </Suspense>
    );
}
'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/">
                            <img
                                src="/media/logo-qvisos.jpg"
                                alt="Logo Qvisos"
                                className="h-14 md:h-16 w-auto object-contain hover:opacity-95 transition-opacity"
                                style={{ maxHeight: '80px' }}
                            />
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/buscar"
                            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors hidden sm:block"
                        >
                            Buscar
                        </Link>
                        {user ? (
                            <>
                                <Link
                                    href="/mis-anuncios"
                                    className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors hidden sm:block"
                                >
                                    Mis Anuncios
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors hidden sm:block"
                                >
                                    Salir
                                </button>
                                <Link
                                    href="/mis-anuncios"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-5 rounded-full shadow-md transition-all hover:shadow-lg flex items-center gap-2"
                                >
                                    <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-black uppercase">
                                        {user.email?.[0] || '?'}
                                    </span>
                                    <span className="hidden sm:block">{user.email?.split('@')[0]}</span>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/activar"
                                    className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors hidden sm:block"
                                >
                                    Activa tu QR
                                </Link>
                                <Link
                                    href="/activar?tab=login"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-6 rounded-full shadow-md transition-all hover:shadow-lg transform active:scale-95"
                                >
                                    Ingresar
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

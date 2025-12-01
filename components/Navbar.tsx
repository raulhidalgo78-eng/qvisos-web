'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* --- LOGO --- */}
                    <div className="flex-shrink-0 flex items-center cursor-pointer">
                        <Link href="/">
                            <img
                                src="https://wcczvedassfquzdrmwko.supabase.co/storage/v1/object/public/media/logo-qvisos.jpg"
                                alt="Logo Qvisos"
                                className="w-auto object-contain"
                                style={{ height: '40px' }} // Altura fija para evitar desbordes
                            />
                        </Link>
                    </div>
                    {/* --- BOTONES DE ACCIÓN --- */}
                    <div className="flex items-center gap-4">
                        {/* Botón 1: Nuevos Usuarios */}
                        <Link
                            href="/activar"
                            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors hidden sm:block"
                        >
                            Activa tu QR
                        </Link>
                        {/* Botón 2: Usuarios Registrados (Login) */}
                        {/* Apunta a ?tab=login para abrir la pestaña correcta automáticamente */}
                        <Link
                            href="/activar?tab=login"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-6 rounded-full shadow-md transition-all hover:shadow-lg transform active:scale-95"
                        >
                            Ingresar
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}

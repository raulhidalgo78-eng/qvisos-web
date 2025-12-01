'use client';
import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* ZONA LOGO: Ajuste responsivo h-8 (móvil) a h-11 (desktop) */}
                    <div className="flex-shrink-0 flex items-center cursor-pointer">
                        <Link href="/">
                            <img
                                src="https://wcczvedassfquzdrmwko.supabase.co/storage/v1/object/public/media/logo-qvisos.jpg"
                                alt="Logo Qvisos"
                                className="h-8 md:h-11 w-auto object-contain transition-all hover:opacity-90"
                            />
                        </Link>
                    </div>
                    {/* ZONA BOTONES: Textos más pequeños en móvil para evitar saltos de línea */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <Link
                            href="/activar"
                            className="text-xs md:text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            Activa tu QR
                        </Link>
                        {/* Separador visual solo móvil */}
                        <span className="h-4 w-px bg-gray-300 md:hidden"></span>
                        <Link
                            href="/ingresar"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-bold py-2 px-4 rounded-full transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            Ingresar
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}

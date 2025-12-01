'use client';
import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* --- LOGO --- */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/">
                            <img
                                src="https://wcczvedassfquzdrmwko.supabase.co/storage/v1/object/public/media/logo-qvisos.jpg"
                                alt="Logo Qvisos"
                                className="w-auto object-contain"
                                style={{ height: '40px' }} // Altura fija forzada
                            />
                        </Link>
                    </div>
                    {/* --- BOTONES (Flex Container) --- */}
                    <div className="flex items-center gap-4">
                        {/* Enlace 1 */}
                        <Link
                            href="/activar"
                            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            Activa tu QR
                        </Link>
                        {/* Enlace 2 (Botón) - Apunta a /activar que es donde está el Login */}
                        <Link
                            href="/activar"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-5 rounded-full shadow-md transition-transform transform active:scale-95"
                        >
                            Ingresar
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}

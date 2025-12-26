import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar'; // <--- IMPORTANTE: Importamos el componente
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = { title: 'QVisos.cl - Avisos Verificados', description: 'La forma más segura de vender tu auto o propiedad.', };

export default function RootLayout({ children, }: { children: React.ReactNode; }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&loading=async&v=weekly`}
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
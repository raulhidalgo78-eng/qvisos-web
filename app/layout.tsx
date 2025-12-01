// Archivo: app/layout.tsx

import './globals.css'; // Importamos estilos globales
import { Inter } from 'next/font/google'; // Usaremos Inter como fuente base
import Navbar from '@/components/Navbar';

// 1. Definimos la fuente principal
const inter = Inter({ subsets: ['latin'] });

// 2. Definimos los metadatos del sitio (SEO y Título de Pestaña)
export const metadata = {
  title: 'Qvisos.cl | El Marketplace de Anuncios Verificados',
  description: 'Vende tu auto o propiedad con seguridad y ahorra la comisión.',
};

// 3. El componente Layout que envuelve toda la aplicación
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      {/* Aplicamos la fuente base a todo el cuerpo del documento */}
      <body className={inter.className}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
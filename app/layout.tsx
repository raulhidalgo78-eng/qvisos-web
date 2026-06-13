import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://qvisos.cl'),
  title: {
    default: 'QVisos.cl — Avisos Verificados con QR | Vende tu auto o propiedad',
    template: '%s | QVisos.cl',
  },
  description:
    'La forma más segura de vender tu auto o propiedad en Chile. Letrero físico con código QR verificado, trato directo y asistente IA que filtra a los interesados.',
  keywords: [
    'venta de autos Chile', 'venta de propiedades', 'arriendo', 'avisos verificados',
    'letrero QR', 'vender auto', 'vender casa', 'QVisos', 'qvisos.cl',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: 'https://qvisos.cl',
    siteName: 'QVisos.cl',
    title: 'QVisos.cl — Avisos Verificados con QR',
    description:
      'No son avisos, son QVisos. Vende tu auto o propiedad de forma segura con un letrero QR verificado.',
    images: [{ url: '/media/logo-qvisos.jpg', width: 800, height: 600, alt: 'QVisos.cl' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QVisos.cl — Avisos Verificados con QR',
    description: 'La forma más segura de vender tu auto o propiedad en Chile.',
    images: ['/media/logo-qvisos.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <Navbar />
        <main className="flex-1 bg-gray-50">
          {children}
        </main>
        <Footer />
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&loading=async&v=weekly`}
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}

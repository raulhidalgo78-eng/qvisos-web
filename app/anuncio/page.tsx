import React, { Suspense } from 'react';
import AnuncioForm from '@/components/AnuncioForm';

export const dynamic = 'force-dynamic'; // ⚠️ CRÍTICO: Evita optimización estática que rompe useSearchParams en Vercel

export default function AnuncioPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Cargando formulario...</div>}>
      <AnuncioForm />
    </Suspense>
  );
}
// Archivo: app/anuncio/page.tsx
'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

const AnuncioForm = dynamic(() => import('@/components/AnuncioForm'), {
  ssr: false,
  loading: () => <div className="flex h-screen items-center justify-center text-blue-600">Cargando formulario...</div>
});

export default function CreateAdPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-blue-600">Cargando...</div>}>
      <AnuncioForm />
    </Suspense>
  );
}// Forzando redeploy para arreglar error 310
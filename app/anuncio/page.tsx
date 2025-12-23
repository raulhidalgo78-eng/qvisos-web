// Archivo: app/anuncio/page.tsx
'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

const AnuncioForm = dynamic(() => import('@/components/AnuncioForm'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-screen text-blue-600">Cargando aplicación segura...</div>
});

export default function CreateAdPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen text-blue-600">Esperando...</div>}>
      <AnuncioForm />
    </Suspense>
  );
}
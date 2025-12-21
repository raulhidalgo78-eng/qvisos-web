// Archivo: app/anuncio/page.tsx
'use client';

import React, { Suspense } from 'react';
import AnuncioForm from '@/components/AnuncioForm';

export default function CreateAdPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-blue-600">Cargando...</div>}>
      <AnuncioForm />
    </Suspense>
  );
}
'use client';

import React, { Suspense } from 'react';
import AnuncioForm from '@/components/AnuncioForm';

export default function AnuncioPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Cargando formulario...</div>}>
      <AnuncioForm />
    </Suspense>
  );
}
'use client';

import React, { Suspense } from 'react';
import AnuncioForm from '@/components/AnuncioForm';

export default function AnuncioPage() {
  return (
    <Suspense fallback={<div>Cargando formulario...</div>}>
      <AnuncioForm />
    </Suspense>
  );
}

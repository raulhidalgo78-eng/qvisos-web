import React, { Suspense } from 'react';
import ActivarForm from '@/components/ActivarForm';

export const dynamic = 'force-dynamic'; // ⚠️ CRÍTICO: Evita prerenderizado estático que falla sin env vars

export default function AnuncioPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Cargando formulario...</div>}>
      <ActivarForm />
    </Suspense>
  );
}
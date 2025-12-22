'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with ssr: false to prevent Server Side Rendering of the Form
const AnuncioForm = dynamic(() => import('@/components/AnuncioForm'), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col h-screen items-center justify-center text-blue-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mb-2"></div>
            <p>Cargando editor seguro...</p>
        </div>
    )
});

export default function AnuncioClientWrapper() {
    return (
        <Suspense fallback={
            <div className="flex flex-col h-screen items-center justify-center text-blue-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mb-2"></div>
                <p>Inicializando...</p>
            </div>
        }>
            <AnuncioForm />
        </Suspense>
    );
}

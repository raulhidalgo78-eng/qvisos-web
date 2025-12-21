'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// DEFINICIÓN SEGURA: Función normal, NO async
function AnuncioFormContent({ initialData }: { initialData?: any }) {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');
    const tipo = searchParams.get('tipo');

    // Estado simple para probar que no crashea
    const [status, setStatus] = useState('Esperando validación...');

    useEffect(() => {
        if (initialData) {
            setStatus(`Modo Edición: Datos recibidos (${initialData.title || 'Sin título'})`);
            return;
        }

        if (!code) {
            setStatus('No se detectó ningún código.');
            return;
        }
        // Simulamos la carga para verificar que el componente monta bien
        setStatus(`Validando código: ${code} (Tipo: ${tipo || 'No definido'})...`);

        // AQUÍ iría tu fetch real. Por ahora, solo probamos que NO explote.
        const timer = setTimeout(() => {
            setStatus('✅ Componente cargado correctamente. El error #310 se ha ido.');
        }, 1000);

        return () => clearTimeout(timer);
    }, [code, tipo, initialData]);

    return (
        <div className="p-8 max-w-lg mx-auto bg-white shadow-lg rounded-xl border border-gray-200 mt-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Prueba de Diagnóstico</h2>
            <div className="p-4 bg-blue-50 text-blue-800 rounded mb-4">
                {status}
            </div>
            <div className="text-sm text-gray-500">
                Si puedes leer esto, el "Loop de la Muerte" se ha roto.
                <br />
                <strong>Código recibido:</strong> {code || 'Ninguno'}
                <br />
                <strong>Datos iniciales:</strong> {initialData ? 'Sí' : 'No'}
            </div>
        </div>
    );
}

// Exportación por defecto
export default function AnuncioForm({ initialData }: { initialData?: any }) {
    // Doble seguridad: Suspense aquí también por si acaso
    return (
        <Suspense fallback={<div className="p-10 text-center">Cargando formulario...</div>}>
            <AnuncioFormContent initialData={initialData} />
        </Suspense>
    );
}

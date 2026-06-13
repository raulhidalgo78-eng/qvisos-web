import type { Metadata } from 'next';
import { Suspense } from 'react';
import ActivarClient from './ActivarClient';

export const metadata: Metadata = {
    title: 'Activa tu Letrero QR | Qvisos.cl',
    description: 'Escanea tu código QR y publica tu propiedad o vehículo en Qvisos.cl en minutos. Sin comisiones, sin intermediarios.',
};

export default async function ActivarPage(props: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const prefillCode = searchParams.prefill;
    const isLoginTab = searchParams.tab === 'login';

    const heading = isLoginTab ? 'Bienvenido' : '¡Activa tu Letrero!';
    const subheading = isLoginTab
        ? 'Ingresa para gestionar tus avisos'
        : prefillCode
            ? 'Verificando tu código QR...'
            : 'Paso 1: Verifica tu código';

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">{heading}</h1>
                    <p className="text-gray-500 text-sm mt-1">{subheading}</p>
                </div>
                <Suspense fallback={<div className="py-8 text-center text-gray-400">Cargando...</div>}>
                    <ActivarClient
                        prefillCode={prefillCode}
                        initialLoginMode={isLoginTab}
                    />
                </Suspense>
            </div>
        </main>
    );
}

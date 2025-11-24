'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ActivarPage() {
    const [code, setCode] = useState('');
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        // Redirige a la ruta dinámica del QR
        router.push(`/q/${code.trim().toUpperCase()}`);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    Activar Letrero
                </h1>
                <p className="text-center text-gray-600 mb-6">
                    Ingresa el código que aparece en tu letrero (ej: QV-001)
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="QV-..."
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-center text-lg uppercase font-mono"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!code}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continuar
                    </button>
                </form>
            </div>
        </div>
    );
}
'use client';

import { useChat } from 'ai/react';
import { useRef, useEffect } from 'react';

interface AdChatProps {
    adData: any;
}

export default function AdChat({ adData }: AdChatProps) {
    // 1. Contexto para la IA
    const contextString = `
    Título: ${adData.title}
    Precio: $${adData.price}
    Categoría: ${adData.category}
    Descripción: ${adData.description}
    Características: ${JSON.stringify(adData.features || {})}
    Contacto: ${adData.contact_phone}
  `;

    // 2. Hook del Chat
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
        body: { adContext: contextString },
        onError: (err) => console.error("Error en el chat:", err) // Para ver si falla la conexión
    });

    // 3. Scroll automático
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 4. Manejo manual del Enter (por si el form falla)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Evita saltos de línea
            if (input.trim()) {
                const fakeEvent = { preventDefault: () => { } } as any;
                handleSubmit(fakeEvent);
            }
        }
    };

    return (
        <div className="flex flex-col h-[400px] border border-gray-300 rounded-lg bg-white shadow-sm overflow-hidden mt-6">
            {/* Header */}
            <div className="bg-blue-600 p-3 text-white flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <span className="font-bold text-sm">Asistente Qvisos</span>
            </div>

            {/* Área de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 text-xs mt-4">
                        <p>👋 ¡Hola! Pregúntame sobre el precio o detalles del auto.</p>
                    </div>
                )}

                {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-2 px-3 text-sm rounded-lg ${m.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-800'
                            }`}>
                            {m.content}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="text-xs text-gray-400 italic ml-2">Escribiendo...</div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input y Botón (Diseño Robusto) */}
            <form onSubmit={handleSubmit} className="p-2 bg-white border-t flex gap-2 items-center">
                <input
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm text-black focus:outline-none focus:border-blue-500"
                    value={input}
                    placeholder="Escribe aquí..."
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown} // Enter forzado
                />
                <button
                    type="submit"
                    disabled={isLoading || !input}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                    Enviar
                </button>
            </form>
        </div>
    );
}
'use client';

import { useChat } from 'ai/react';
import { useRef, useEffect } from 'react';

interface AdChatProps {
    adData: any; // Recibe el objeto completo del anuncio desde Supabase
}

export default function AdChat({ adData }: AdChatProps) {
    // 1. Aplanamos los datos relevantes en un string para la IA
    const contextString = `
    Título: ${adData.title}
    Precio: $${adData.price}
    Categoría: ${adData.category}
    Descripción: ${adData.description}
    Características: ${JSON.stringify(adData.features || {})}
    Contacto: ${adData.contact_phone}
  `;

    // 2. Hook de Vercel AI SDK
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
        body: { adContext: contextString }, // <--- Enviamos el contexto aquí
    });

    // 3. Auto-scroll al final
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="flex flex-col h-[400px] border rounded-xl overflow-hidden shadow-sm bg-white">
            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm mt-8 px-6">
                        <p>👋 ¡Hola! Estoy analizando este anuncio.</p>
                        <p className="mt-2">Pregúntame sobre el kilometraje, el estado del motor o el precio.</p>
                    </div>
                )}

                {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 text-sm rounded-2xl ${m.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                            }`}>
                            {m.content}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-500 text-xs py-2 px-4 rounded-full animate-pulse">
                            Escribiendo...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-3 bg-white border-t flex gap-2">
                <input
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={input}
                    placeholder="Escribe tu pregunta aquí..."
                    onChange={handleInputChange}
                />
                <button
                    type="submit"
                    disabled={isLoading || !input}
                    className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                </button>
            </form>
        </div>
    );
}

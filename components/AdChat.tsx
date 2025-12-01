'use client';

import { useChat } from 'ai/react';
import { useRef, useEffect } from 'react';

interface AdChatProps {
    adData: any;
}

export default function AdChat({ adData }: AdChatProps) {
    // 1. Preparamos el contexto (la "memoria" del auto para la IA)
    const contextString = `
    Título: ${adData.title}
    Precio: $${adData.price}
    Categoría: ${adData.category}
    Descripción: ${adData.description}
    Características: ${JSON.stringify(adData.features || {})}
    Contacto: ${adData.contact_phone}
  `;

    // 2. Hook del Chat (Vercel AI SDK)
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
        body: { adContext: contextString },
        onError: (err) => console.error("Error en el chat:", err)
    });

    // 3. Scroll automático al fondo
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 4. Manejo manual del Enter (Mejora de UX)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Evita el salto de línea
            if (input.trim()) {
                // Simulamos el evento de envío
                const fakeEvent = { preventDefault: () => { } } as any;
                handleSubmit(fakeEvent);
            }
        }
    };

    return (
        <div className="flex flex-col h-[450px] border border-gray-300 rounded-xl bg-white shadow-sm overflow-hidden mt-6">
            {/* Header del Chat */}
            <div className="bg-blue-600 p-4 text-white flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                    <span className="text-xl">🤖</span>
                </div>
                <div>
                    <h3 className="font-bold text-sm">Asistente Virtual Qvisos</h3>
                    <p className="text-xs text-blue-100">Respondo dudas sobre este aviso</p>
                </div>
            </div>

            {/* Área de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm mt-10 px-6">
                        <p>👋 ¡Hola! Estoy analizando este anuncio.</p>
                        <p className="mt-2 text-xs">Pregúntame sobre el kilometraje, detalles mecánicos o el precio.</p>
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
                        <div className="bg-gray-200 text-gray-500 text-xs py-1 px-3 rounded-full animate-pulse ml-2">
                            Escribiendo...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input y Botón */}
            <form onSubmit={handleSubmit} className="p-3 bg-white border-t flex gap-2 items-center">
                <input
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    value={input}
                    placeholder="Escribe tu pregunta..."
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                />
                <button
                    type="submit"
                    disabled={
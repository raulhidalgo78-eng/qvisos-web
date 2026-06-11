'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

// Interfaz que refleja la tabla lead_messages
export interface LeadMessage {
    id: string;
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export default function BuyerChat() {
    const [messages, setMessages] = useState<LeadMessage[]>([
        {
            id: 'init-1',
            role: 'assistant',
            content: '¡Hola! Soy el asistente virtual del vendedor. ¿En qué te puedo ayudar sobre este anuncio?'
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll al final del contenedor cuando hay nuevos mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const textToSubmit = inputText.trim();
        if (!textToSubmit) return;

        // 1. Agregar el mensaje del usuario al estado local optimistamente
        const newUserMsg: LeadMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: textToSubmit,
        };

        setMessages((prev) => [...prev, newUserMsg]);
        setInputText('');
        setIsTyping(true);

        // 2. Enviar mensaje a la API (Simulación con Supabase)
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lead_id: 'temp-ad-id',
                    message: textToSubmit,
                    history: messages
                }),
            });

            const data = await response.json();

            if (data.success && data.message) {
                // Agregar respuesta real del servidor al estado
                setMessages((prev) => [...prev, data.message]);
            } else {
                console.error('Error en API:', data.error);
                // Fallback en caso de error
                setMessages((prev) => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: 'Ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo.'
                }]);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            setMessages((prev) => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Error de conexión. Verifica tu internet.'
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        // 'h-[100dvh]' asegura que ocupe todo el alto dinámico de la pantalla en móviles, ignorando la barra de navegación del navegador Safari/Chrome.
        <div className="flex flex-col h-[100dvh] w-full max-w-2xl mx-auto bg-gray-50 bg-[url('/bg-chat.png')] bg-cover relative">

            {/* Header del chat */}
            <div className="bg-blue-600 text-white p-4 flex items-center shadow-md sticky top-0 z-10 shrink-0">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xl">🤖</span>
                </div>
                <div>
                    <h2 className="font-bold text-lg leading-tight">Asistente QVisos</h2>
                    <p className="text-blue-100 text-xs">En línea - Responde al instante</p>
                </div>
            </div>

            {/* Área de mensajes con scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    if (msg.role === 'system') return null; // Ocultar mensajes que son instrucciones del sistema

                    const isUser = msg.role === 'user';

                    return (
                        <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm relative ${isUser
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed break-words">
                                    {msg.content}
                                </p>
                            </div>
                        </div>
                    );
                })}

                {/* Indicador "¿Está escribiendo...?" */}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white text-gray-500 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                {/* Ancla invisible para el auto-scroll */}
                <div ref={messagesEndRef} />
            </div>

            {/* Área de Input - Anclado abajo */}
            <div className="bg-gray-100 p-3 md:p-4 border-t border-gray-200 sticky bottom-0 shrink-0">
                <form
                    onSubmit={handleSendMessage}
                    className="flex items-end gap-2 bg-white p-1.5 rounded-3xl shadow-sm border border-gray-200"
                >
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Escribe tu mensaje aquí..."
                        className="flex-1 max-h-32 min-h-[44px] bg-transparent border-0 rounded-2xl px-4 py-3 focus:ring-0 resize-none outline-none text-sm md:text-base"
                        rows={1}
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white p-3 rounded-full flex-shrink-0 transition-colors shadow-sm mb-0.5"
                    >
                        <Send size={20} className={inputText.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                    </button>
                </form>
            </div>

        </div>
    );
}

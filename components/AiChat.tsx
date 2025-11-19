// En: components/AiChat.tsx
'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';

export default function AiChat({ adTitle }: { adTitle: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Hook mágico de Vercel AI SDK
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    initialMessages: [
      { id: 'welcome', role: 'assistant', content: `¡Hola! Soy el asistente virtual de Qvisos. ¿Te interesa el "${adTitle}"? ¿Qué te gustaría saber?` }
    ]
  });

  // Si está cerrado, mostramos el botón de abrir
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          width: '100%',
          padding: '15px',
          backgroundColor: '#2563eb', // Azul Qvisos
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
        }}
      >
        <span>💬</span> Preguntar al Asistente IA
      </button>
    );
  }

  // Si está abierto, mostramos la ventana de chat
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
      
      {/* Encabezado del Chat */}
      <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', color: '#111827' }}>Asistente Qvisos</span>
        <button onClick={() => setIsOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}>✖</button>
      </div>

      {/* Área de Mensajes */}
      <div style={{ height: '300px', overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map(m => (
          <div key={m.id} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            <div style={{ 
              padding: '10px 14px', 
              borderRadius: '12px', 
              backgroundColor: m.role === 'user' ? '#2563eb' : '#f3f4f6',
              color: m.role === 'user' ? 'white' : '#1f2937',
              fontSize: '0.95rem',
              lineHeight: '1.4'
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && <div style={{ alignSelf: 'flex-start', color: '#9ca3af', fontSize: '0.8rem', paddingLeft: '10px' }}>Escribiendo...</div>}
      </div>

      {/* Formulario de Entrada */}
      <form onSubmit={handleSubmit} style={{ padding: '10px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '10px' }}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Escribe tu pregunta..."
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
        />
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          Enviar
        </button>
      </form>
    </div>
  );
}
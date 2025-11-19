// En: app/api/chat/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Permitir respuestas largas (streaming)
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `Eres el asistente virtual experto de Qvisos.cl. 
    Tu trabajo es ayudar a los interesados a comprar autos o propiedades.
    
    Reglas:
    1. Sé amable, profesional y conciso.
    2. Tu objetivo es pre-cualificar al cliente. Pregunta sutilmente sobre su presupuesto o método de pago.
    3. NO inventes datos del vehículo o propiedad. Si no sabes algo, di que le preguntarás al vendedor.
    4. Intenta conseguir que el usuario quiera contactar al vendedor real.
    
    Responde siempre en español de Chile, cercano pero respetuoso.`,
    messages,
  });

  return result.toDataStreamResponse();
}

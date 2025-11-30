import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Permitir respuestas largas si es necesario (max 30s en Vercel Hobby)
export const maxDuration = 30;

export async function POST(req: Request) {
    // Extraemos los mensajes y el contexto del anuncio del cuerpo de la petición
    const { messages, adContext } = await req.json();

    const result = await streamText({
        model: openai('gpt-4o-mini'), // Modelo rápido y económico
        system: `Eres un asistente de ventas experto y amable para el portal Qvisos.cl.

Tu objetivo es responder dudas sobre el siguiente anuncio y motivar al usuario a contactar al vendedor.

--- DATOS DEL ANUNCIO ---
${adContext}

REGLAS:
1. Responde SOLO basándote en los datos de arriba.
2. Si te preguntan algo que no aparece en los datos (ej: "¿Tiene mantenciones al día?" y no sale en la descripción), di honestamente que no tienes esa información y sugiere contactar al dueño vía WhatsApp.
3. Sé conciso, profesional y usa emojis ocasionalmente.
4. NO inventes características.`,
        messages,
    });

    return result.toDataStreamResponse();
}

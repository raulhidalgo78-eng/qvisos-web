import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Permitir respuestas largas si es necesario (max 30s en Vercel Hobby)
export const maxDuration = 30;

export async function POST(req: Request) {
    // Extraemos los mensajes y el contexto del anuncio del cuerpo de la petición
    const { messages, adContext, contactPreference, sellerName } = await req.json();

    // Definimos el System Prompt base
    let systemPrompt = `Eres un asistente de ventas experto y amable para el portal Qvisos.cl.

Tu objetivo es responder dudas sobre el siguiente anuncio y motivar al usuario a contactar al vendedor.

--- DATOS DEL ANUNCIO ---
${adContext}

REGLAS GENERALES:
1. Responde SOLO basándote en los datos de arriba.
2. Si te preguntan algo que no aparece en los datos (ej: "¿Tiene mantenciones al día?" y no sale en la descripción), di honestamente que no tienes esa información.
3. Sé conciso, profesional y usa emojis ocasionalmente.
4. NO inventes características.`;

    // Lógica Condicional: Agente IA vs WhatsApp Directo
    if (contactPreference === 'agente_ia') {
        systemPrompt += `

--- MODO FILTRO ACTIVO (AGENTE IA) ---
El vendedor (${sellerName}) ha activado el "Filtro de Agente IA".
Tu misión es CALIFICAR al interesado antes de entregar el contacto directo.

INSTRUCCIONES ESPECÍFICAS:
1. NO entregues el número de WhatsApp ni el contacto en la primera respuesta.
2. Responde amablemente la duda del usuario, pero INMEDIATAMENTE después haz una pregunta de calificación.
   Ejemplos de preguntas de calificación (usa una a la vez):
   - "¿Buscas comprar con crédito o al contado?"
   - "¿Para cuándo tienes planeada la compra/arriendo?"
   - "¿Te gustaría agendar una visita esta semana?"
3. Solo cuando el usuario haya respondido al menos 2 preguntas de calificación y muestre interés real, ofrécele el contacto: "¡Genial! Veo que estás realmente interesado. Aquí tienes el contacto directo de ${sellerName}: [Número de WhatsApp del anuncio]".
4. Si el usuario insiste mucho, puedes dar el contacto, pero trata de filtrar primero.`;
    } else {
        systemPrompt += `

--- MODO DIRECTO ---
El vendedor prefiere contacto directo.
Si el usuario muestra interés, anímalo de inmediato a escribirle al WhatsApp del dueño que aparece en los datos.`;
    }

    const result = await streamText({
        model: openai('gpt-4o-mini'), // Modelo rápido y económico
        system: systemPrompt,
        messages,
    });

    return result.toTextStreamResponse();
}

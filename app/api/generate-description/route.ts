import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { category, features, extraNotes } = await req.json();

        // Prompt específico para el mercado chileno
        const systemPrompt = `Eres un experto vendedor y copywriter ${category === 'Autos' ? 'automotriz' : 'inmobiliario'} en Chile.
Tu misión es redactar una descripción de venta atractiva, profesional y que genere confianza.
Reglas:
- Usa un tono cercano pero profesional.
- Destaca atributos clave como 'Único dueño', 'Papeles al día', 'Recepción final', 'Sin multas'.
- Menciona las características técnicas proporcionadas.
- Incorpora las "Notas adicionales" del usuario de forma natural.
- NO inventes datos que no estén en la información.
- Formato limpio con párrafos cortos.
- Finaliza con un "Call to Action" invitando a contactar.`;

        const userPrompt = `
Datos del ${category}:
${JSON.stringify(features, null, 2)}
Notas extra del dueño: "${extraNotes || 'Ninguna'}"

Genera la descripción:`;

        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.7, // Creativo pero coherente
        });

        return NextResponse.json({ description: text });
    } catch (error) {
        console.error('Error generating description:', error);
        return NextResponse.json({ error: 'Error generando descripción' }, { status: 500 });
    }
}

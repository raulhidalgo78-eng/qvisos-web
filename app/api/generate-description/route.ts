import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    // Debug: Ver si la llave existe (sin mostrarla completa por seguridad)
    console.log("🔑 API Key Configurada:", process.env.OPENAI_API_KEY ? "SÍ" : "NO");

    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: 'Server: Falta OPENAI_API_KEY' }, { status: 500 });
    }

    try {
        const { category, features, extraNotes } = await req.json();

        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            system: "Eres un redactor experto en ventas inmobiliarias y automotrices en Chile.",
            prompt: `Escribe un aviso persuasivo para: ${category}. Detalles: ${JSON.stringify(features)}. Extras: ${extraNotes}`,
            temperature: 0.7,
        });

        return NextResponse.json({ description: text });

    } catch (error: any) {
        console.error("❌ Error OpenAI:", error);
        return NextResponse.json({ error: error.message || 'Error generando texto' }, { status: 500 });
    }
}
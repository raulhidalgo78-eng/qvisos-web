import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    // 1. Diagnóstico de seguridad (Solo logueamos si existe o no, NUNCA la llave)
    console.log("🔍 API Check - OpenAI Key exists:", !!process.env.OPENAI_API_KEY);

    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
            { error: 'CONFIG_ERROR: Falta la OPENAI_API_KEY en Vercel (Environment Variables).' },
            { status: 500 } // Cambiado a 500 para alertar configuración
        );
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
        // Devolver el mensaje exacto del error para poder depurar en el frontend
        return NextResponse.json({ error: error.message || 'Error generando texto' }, { status: 500 });
    }
}
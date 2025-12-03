import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        // 1. Verificar si hay API Key configurada
        if (!process.env.OPENAI_API_KEY) {
            console.error("❌ ERROR: No se encontró OPENAI_API_KEY en las variables de entorno.");
            return NextResponse.json({ error: 'Falta configuración de API Key' }, { status: 500 });
        }

        const { category, features, extraNotes } = await req.json();

        console.log("🔹 Generando descripción para:", category); // Log para depurar

        // 2. Construir el Prompt según la categoría
        const systemPrompt = `Eres un experto redactor publicitario (copywriter) para el mercado inmobiliario y automotriz en Chile.
    Tu objetivo es crear descripciones de venta altamente persuasivas, profesionales y confiables.
    
    Reglas de Estilo:
    - Tono: Profesional, cercano y seguro.
    - Mercado: Usa terminología chilena (ej: "Gastos comunes", "Papeles al día", "Locomoción a la puerta").
    - Estructura: Párrafos cortos, uso de negritas para destacar atributos (ej: **Único dueño**).
    - Cierre: Llamado a la acción claro.
    `;

        const userPrompt = `
    Por favor redacta un aviso de venta/arriendo para:
    - Categoría: ${category}
    - Detalles Técnicos: ${JSON.stringify(features, null, 2)}
    - Notas del dueño: "${extraNotes || 'Ninguna'}"
    
    Destaca las fortalezas (como 'Recepción Final', 'Sin Multas', 'Vista', etc.) y omite campos vacíos.
    `;

        // 3. Llamar a OpenAI
        const { text } = await generateText({
            model: openai('gpt-4o-mini'), // Modelo rápido y económico
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.7,
        });

        console.log("✅ Descripción generada con éxito.");
        return NextResponse.json({ description: text });

    } catch (error: any) {
        // ESTO ES LO IMPORTANTE: Imprimimos el error real en la terminal
        console.error("❌ ERROR OPENAI:", error);

        // Devolvemos el error al frontend
        const errorMessage = error.message || 'Error interno del servidor';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
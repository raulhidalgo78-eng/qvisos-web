import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    // Debugging: Check if key is loaded
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("🔍 Debug - OpenAI Key Loaded:", apiKey ? "YES (Length: " + apiKey.length + ")" : "NO");

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Server Error: OPENAI_API_KEY is missing in environment variables.' },
            { status: 500 }
        );
    }

    try {
        const { category, features, extraNotes } = await req.json();

        // Extract specific fields for better prompting
        const { moneda, precio, latitude, longitude, ...otherFeatures } = features || {};

        const priceText = precio ? `${moneda || 'CLP'} $${precio}` : 'No especificado';
        const locationText = (latitude && longitude)
            ? `Ubicación seleccionada en mapa (Lat: ${latitude}, Lng: ${longitude})`
            : 'No especificada';

        // Construct a safe prompt even if features are empty
        const prompt = `
      Eres un redactor experto en avisos clasificados.
      Tu objetivo es escribir una descripción atractiva y breve (máximo 4 párrafos cortos) basada en lo siguiente:
      - Categoría: ${category || 'General'}
      - Precio: ${priceText}
      - Ubicación: ${locationText}
      - Detalles: ${JSON.stringify(otherFeatures || {})}
      - Notas del Usuario: ${extraNotes || 'Ninguna'}

      REGLAS ESTRICTAS DE FORMATO:
      - NO uses símbolos de Markdown como '##', '###' o '**'. Escribe texto plano limpio.
      - NO incluyas el número de teléfono ni contacto en el texto. El sitio web ya tiene un botón para eso.
      - Sé directo y vendedor. Evita introducciones largas como "¡Tu nueva casa te espera!". Ve al grano con los beneficios.
      - Usa terminología chilena adecuada (ej: "Gastos comunes", "Contribuciones", "Piezas", "Living comedor").
      - Si es arriendo, destaca los requisitos si los hay.
    `;

        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            prompt: prompt,
            temperature: 0.7,
        });

        return NextResponse.json({ description: text });

    } catch (error: any) {
        console.error("❌ OpenAI API Error:", error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate description.' },
            { status: 500 }
        );
    }
}
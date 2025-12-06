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
        const { category, features, extraNotes, aiTone } = await req.json();

        // Extract specific fields for better prompting
        const { moneda, precio, latitude, longitude, ...otherFeatures } = features || {};

        const priceText = precio ? `${moneda || 'CLP'} $${precio}` : 'No especificado';
        const locationText = (latitude && longitude)
            ? `Ubicación seleccionada en mapa (Lat: ${latitude}, Lng: ${longitude})`
            : 'No especificada';

        // Lógica de Estilos
        const estilos: Record<string, string> = {
            ejecutivo: "Usa un tono sobrio, directo y elegante. Enfócate en la eficiencia y calidad.",
            entusiasta: "Usa un tono enérgico y positivo. Enfócate en la emoción y la experiencia.",
            cercano: "Usa un tono de tú a tú, como un amigo recomendando algo. Transmite confianza.",
            oportunista: "Enfócate en la exclusividad y que es una oportunidad única/urgente."
        };

        let instruccionEstilo = "";

        if (aiTone && aiTone !== 'random' && estilos[aiTone]) {
            instruccionEstilo = estilos[aiTone];
        } else {
            // Si es random, elegimos uno al azar
            const keys = Object.keys(estilos);
            const randomKey = keys[Math.floor(Math.random() * keys.length)];
            instruccionEstilo = estilos[randomKey];
        }

        const systemPrompt = `Eres un redactor experto en marketing para Clasificados (Autos y Propiedades) en Chile.
ESTILO DE REDACCIÓN APLICAR: ${instruccionEstilo}

CONTEXTO: El usuario ya está viendo una tabla visual con los datos técnicos (Año, KM, Dormitorios, Baños, M2).

TU MISIÓN: Escribir una descripción breve (2-3 párrafos) que complemente esa información técnica, NO que la repita como lista.

REGLAS DE ORO:

🚫 NO repitas datos técnicos obvios (ej: No empieces diciendo "Tiene 3 dormitorios", eso ya se ve. Di "Amplios dormitorios con luz natural").

⭐ ENFÓCATE EN LO ÚNICO: Dale prioridad absoluta a las "Notas del Dueño" (extraNotes). Si dice "único dueño" o "vista al mar", ese es tu titular.

🇨🇱 TONO CHILENO: Usa un lenguaje cercano y vendedor. (Ej: "Impecable", "Llegar y habitar", "Joya", "Oportunidad").

🎯 OBJETIVO: Vender el estado del producto y la oportunidad, no la ficha técnica.

📵 PRIVACIDAD: JAMÁS inventes ni incluyas números de teléfono o correos.

FORMATO: Texto plano, párrafos cortos. Sin Markdown (##, **).

Ejemplo Bueno: "Espectacular oportunidad en sector exclusivo. La propiedad destaca por su luminosidad y una vista inigualable. Ha sido remodelada recientemente con terminaciones de lujo. Ideal para familias que buscan tranquilidad y seguridad."

Ejemplo Malo: "Se vende casa. Tiene 3 dormitorios, 2 baños, 100m2. Tiene estacionamiento." (Esto es aburrido y redundante). `;

        const prompt = `
      ${systemPrompt}

      DATOS DEL AVISO:
      - Categoría: ${category || 'General'}
      - Precio: ${priceText}
      - Ubicación: ${locationText}
      - Detalles Técnicos (YA VISIBLES): ${JSON.stringify(otherFeatures || {})}
      - NOTAS DEL DUEÑO (LO MÁS IMPORTANTE): ${extraNotes || 'Ninguna'}
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
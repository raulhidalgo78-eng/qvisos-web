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
        // Lógica de Estilos (NUEVA)
        const estilos: Record<string, string> = {
            formal: "Usa un lenguaje técnico, preciso y profesional. Ideal para clientes exigentes que buscan datos concretos y seriedad.",
            venta_rapida: "Usa frases cortas, gatillos mentales de urgencia y oportunidad. Enfócate en el precio/calidad y que se irá rápido.",
            inspirador: "Usa storytelling. Enfócate en la experiencia de vida, la comodidad y los sentimientos que provoca el producto. Enamora al lector."
        };

        let instruccionEstilo = "";

        if (aiTone && aiTone !== 'random' && estilos[aiTone]) {
            instruccionEstilo = estilos[aiTone];
        } else {
            // Default a Inspirador si falla
            instruccionEstilo = estilos['inspirador'];
        }

        const systemPrompt = `Eres un experto redactor publicitario chileno (copywriter). Tu objetivo es vender, no describir robóticamente.
ESTILO DE REDACCIÓN APLICAR: ${instruccionEstilo}

CONTEXTO: El usuario ya ve los datos técnicos en una tabla. NO hagas una lista de especificaciones.

TU MISIÓN: Escribir un texto de venta persuasivo (2-3 párrafos) que integre los datos técnicos de forma fluida en una narrativa.

REGLAS DE ORO:
1. 🚫 NO uses frases cliché de IA como "Descubre la excelencia", "Sumérgete en", "En el mundo digital".
2. 🇨🇱 Usa lenguaje natural chileno pero educado (Ej: "Impecable", "Apura", "Joyita", "Oportunidad").
3. ⭐ PRIORIDAD TOTAL a "Lo mejor del aviso" (Notes): Si el usuario dice "aire congela", úsalo ("el aire acondicionado funciona increíble, ideal para este verano").
4. 🏗️ ESTRUCTURA:
   - Gancho inicial (Atención).
   - Cuerpo persuasivo (Deseo - integrando datos).
   - Cierre con llamado a la acción (Acción).

Ejemplo Bueno (Estilo Inspirador):
"¡Oportunidad única en el sector! Vendo mi joya por renovación. Este auto no es cualquiera: lo he cuidado como hueso santo y se nota. Viene con neumáticos Michelin recién instalados (te ahorras ese gasto) y el aire acondicionado funciona perfecto. Mecánicamente impecable, llegar y andar. ¡Hablemos antes de que se lo lleven!"

Ejemplo Malo:
"Se vende vehículo Toyota. Características: Motor 1.6, Aire acondicionado. Es una gran oportunidad de inversión para su vida transporte." (Robótico y aburrido).`;

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

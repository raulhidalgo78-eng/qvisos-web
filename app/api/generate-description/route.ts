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

        // Construct a safe prompt even if features are empty
        const prompt = `
      Act as an expert copywriter for real estate and automotive sales in Chile.
      Write a professional, persuasive ad description based on the following:
      - Category: ${category || 'General'}
      - Details: ${JSON.stringify(features || {})}
      - User Notes: ${extraNotes || 'None'}
      
      Requirements:
      - Use Chilean terminology (e.g., 'Gastos comunes', 'Permiso de circulación').
      - Highlight key selling points.
      - Keep it under 200 words.
      - End with a call to action.
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
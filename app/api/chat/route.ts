// Archivo: app/api/chat/route.ts

import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { supabase } from '../../../lib/supabase';

export const maxDuration = 30;

export async function POST(req: Request) {
    // 1. Recibir mensajes y el ID del anuncio
    const { messages, adId } = await req.json();

    // 2. Buscar la "Verdad" en Supabase
    const { data: ad, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', adId)
        .single();

    if (error || !ad) {
        return new Response('Error: Anuncio no encontrado', { status: 404 });
    }

    // 3. Preparar Variables para el Prompt
    const d = ad.details || {}; // Atajo para los detalles
    const currency = d.currency || 'CLP';
    const priceFormatted = `${currency} ${ad.price.toLocaleString('es-CL')}`;

    // Construcción del contexto específico según categoría
    let technicalDetails = '';

    if (ad.category === 'propiedad') {
        technicalDetails = `
    - Tipo: ${d.type || 'No especificado'}
    - Superficie: ${d.m2Total ? d.m2Total + ' m²' : 'No especificada'}
    - Dormitorios: ${d.rooms || '?'} | Baños: ${d.bathrooms || '?'}
    - Estacionamiento: ${d.parking ? 'SÍ TIENE' : 'NO tiene'}
    - Bodega: ${d.bodega ? 'SÍ TIENE' : 'NO tiene'}
    - Gastos Comunes: ${d.ggcc ? '$' + d.ggcc : 'No especificado'}
    - Orientación: ${d.orientation || 'No especificada'}
    `;
    } else {
        // Vehículo
        technicalDetails = `
    - Año: ${d.year || 'No especificado'}
    - Kilometraje: ${d.km ? d.km + ' km' : 'No especificado'}
    - Transmisión: ${d.transmission || 'No especificada'}
    - Combustible: ${d.fuel || 'No especificado'}
    - Dueños: ${d.owners || '?'}
    - Situación Legal: ${d.legalStatus === 'al_dia' ? 'Papeles al día ✅' : d.legalStatus === 'multas' ? 'Con Multas/Prenda ⚠️' : 'Atrasado ⚠️'}
    `;
    }

    // 4. EL PROMPT MAESTRO (Gatekeeper Chileno)
    const systemPrompt = `
    ### ROL
    Eres el "Asistente de Ventas y Seguridad" de Qvisos.cl.
    Tu trabajo es responder dudas sobre este aviso y filtrar interesados reales.
    
    ### INFORMACIÓN DEL AVISO (La Verdad Absoluta)
    - Título: "${ad.title}"
    - Precio: ${priceFormatted}
    - Descripción del Dueño: "${ad.description || ''}"
    
    ### DETALLES TÉCNICOS (Úsalos para responder preguntas específicas)
    ${technicalDetails}

    ### TUS REGLAS DE NEGOCIO (CHILE)
    1. **MANEJO DE MONEDA:**
       - El precio oficial es **${priceFormatted}**.
       - Si el precio está en **UF**, y te piden el valor en pesos, haz una conversión aproximada (Usa 1 UF = $38.000 CLP como referencia) pero aclara que es "aprox".
       - Si está en **USD**, usa referencia 1 USD = $950 CLP.

    2. **SEGURIDAD (NO DOXING):**
       - JAMÁS entregues la dirección exacta, rut o teléfono del vendedor en el chat.
       - Si piden visitar, di: "¿Te gustaría agendar una visita para verlo en persona?".

    3. **FILTRO DE SERIEDAD:**
       - Si preguntan "¿Acepta ofertas?", responde: "El precio publicado es ${priceFormatted}. Las ofertas se conversan presencialmente con el dueño tras la visita".
       - Si el auto tiene multas o papeles atrasados (ver Detalles Técnicos), sé honesto pero amable: "La ficha indica que tiene detalles de papeles, por eso el precio es conveniente".

    ### PERSONALIDAD
    Habla como un asesor chileno profesional, amable y directo. No uses frases robóticas.
  `;

    // 5. Invocar a la IA
    const result = await streamText({
        model: openai('gpt-4o'), // O gpt-3.5-turbo
        system: systemPrompt,
        messages,
    });

    return result.toDataStreamResponse();
}

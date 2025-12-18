import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { supabase } from '../../../lib/supabase';

// Configuración para Vercel (Edge/Serverless)
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages, adId } = await req.json();

    // 1. Obtener la "Verdad" del anuncio desde Supabase
    const { data: ad, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', adId)
        .single();

    if (error || !ad) {
        return new Response('Anuncio no encontrado', { status: 404 });
    }

    // 2. Preparar los datos técnicos para la IA
    const d = ad.details || {};
    const currency = d.currency || 'CLP';
    const priceFmt = `${currency} ${ad.price.toLocaleString('es-CL')}`;

    // Contexto dinámico según categoría
    let fichaTecnica = '';
    if (ad.category === 'propiedad') {
        fichaTecnica = `
    - Tipo: ${d.type || 'Propiedad'}
    - Superficie: ${d.m2Total || '?'} m²
    - Dorms: ${d.rooms || '?'} | Baños: ${d.bathrooms || '?'}
    - Gastos Comunes: $${d.ggcc || 'No especificado'}
    - Estacionamiento: ${d.parking ? 'SÍ' : 'NO'} | Bodega: ${d.bodega ? 'SÍ' : 'NO'}
    `;
    } else {
        // Vehículo
        fichaTecnica = `
    - Año: ${d.year || '?'}
    - Kilometraje: ${d.km || '?'} km
    - Combustible: ${d.fuel || 'No especificado'}
    - Transmisión: ${d.transmission || 'No especificada'}
    - Dueños: ${d.owners || '?'}
    - Situación Legal: ${d.legalStatus === 'al_dia' ? 'Papeles al día' : 'Con detalles/multas'}
    `;
    }

    // 3. EL PROMPT MAESTRO (GATEKEEPER)
    const systemPrompt = `
    ### TU ROL
    Eres el "Asistente de Seguridad" de Qvisos.cl. Estás a cargo de mostrar el aviso: "${ad.title}".
    Tu trabajo NO es solo responder dudas, sino FILTRAR a los interesados para proteger el tiempo y privacidad del vendedor.

    ### DATOS DEL AVISO (LA VERDAD)
    - Precio: ${priceFmt}
    - Descripción: "${ad.description || ''}"
    ${fichaTecnica}

    ### PROTOCOLO DE SEGURIDAD (IMPORTANTE)
    1. **PRIVACIDAD BLINDADA:** JAMÁS entregues el número de teléfono, nombre completo o dirección exacta del vendedor. Si te presionan, di: "Por seguridad, el contacto directo se habilita tras coordinar la visita".
    2. **MODO FILTRO:** Antes de agendar cualquier visita, debes validar la intención de compra.
       - Pregunta sutilmente: "¿Buscas comprar con crédito, al contado o estás solo cotizando?"
    3. **CIERRE (CAPTURA DE LEAD):**
       - Si el usuario muestra interés real y solvencia, cierra así: "Perfecto. Para coordinar la visita, por favor déjame tu número de WhatsApp y el dueño te contactará a la brevedad".

    ### TONO Y ESTILO
    - Chileno profesional, amable pero firme con la seguridad.
    - Si el precio es en UF y preguntan en pesos, convierte aprox (1 UF = $38.000).
    - Sé breve. Respuestas cortas venden más.
  `;

    // 4. Generar Respuesta
    const result = await streamText({
        model: openai('gpt-4o'), // Asegúrate de tener saldo o usar gpt-3.5-turbo si prefieres
        system: systemPrompt,
        messages,
    });

    // Usamos el método compatible con tu versión instalada
    return result.toTextStreamResponse();
}

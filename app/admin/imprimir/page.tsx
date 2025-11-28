// En: app/admin/imprimir/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';

export default function ProductionStation() {
  const [startNum, setStartNum] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState('venta_propiedad');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Estado para la plantilla actual
  const [currentTemplate, setCurrentTemplate] = useState({
    url: 'https://wcczvedassfquzdrmwko.supabase.co/storage/v1/object/public/media/venta_prop_qvisos.png',
    orientation: 'portrait' as 'portrait' | 'landscape'
  });

  // MAPA DE PLANTILLAS
  const TEMPLATES: Record<string, { url: string, orientation: 'portrait' | 'landscape' }> = {
    venta_propiedad: {
      url: 'https://wcczvedassfquzdrmwko.supabase.co/storage/v1/object/public/media/Se%20Vende.png',
      orientation: 'portrait'
    },
    arriendo_propiedad: {
      url: 'https://wcczvedassfquzdrmwko.supabase.co/storage/v1/object/public/media/arriendo.png',
      orientation: 'portrait'
    },
    venta_auto: {
      url: 'https://wcczvedassfquzdrmwko.supabase.co/storage/v1/object/public/media/vende%20auto.png', // <--- PEGA AQUÍ TU NUEVA URL
      orientation: 'landscape'
    },
    generico: {
      url: 'https://wcczvedassfquzdrmwko.supabase.co/storage/v1/object/public/media/venta_prop_qvisos.png', // Fallback
      orientation: 'portrait'
    }
  };

  // Efecto para cambiar la plantilla cuando cambia la categoría
  useEffect(() => {
    const template = TEMPLATES[category] || TEMPLATES['generico'];
    setCurrentTemplate(template);
  }, [category]);

  // Generador de códigos
  const generateCodes = () => {
    if (startNum === null) return [];
    return Array.from({ length: quantity }, (_, i) => `QV-${String(startNum + i).padStart(3, '0')}`);
  };
  const codesList = generateCodes();

  // Inicializar secuencia desde BD
  useEffect(() => {
    const init = async () => {
      // Importamos dinámicamente la server action
      const { getLastQrCode } = await import('@/app/actions/get-last-qr');
      const lastCode = await getLastQrCode();

      let next = 1;
      if (lastCode) {
        // Asumimos formato QV-XXX
        const parts = lastCode.split('-');
        if (parts.length > 1) {
          const num = parseInt(parts[1]);
          if (!isNaN(num)) next = num + 1;
        }
      }
      setStartNum(next);
      setLoading(false);
    };
    init();
  }, []);

  // Función auxiliar para cargar imágenes como base64
  const getBase64FromUrl = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result as string);
    });
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    setIsGenerating(true);
    // const supabase = createClient(); // Moved to component level

    // CONFIGURACIÓN DE POSICIONES (Ajustable)
    // CONFIGURACIÓN DE POSICIONES (Ajustable)
    const LAYOUTS = {
      portrait: {
        // Venta/Arriendo Propiedad (Vertical)
        qr: { size: 170, y: 85 },
        text: { size: 22, x: 180, y: 285, color: [0, 0, 0] }
      },
      landscape: {
        // Venta Auto (Horizontal - Diseño SCAN)
        qr: {
          size: 110,     // Tamaño ajustado para no chocar con la flecha
          y: 60         // Centrado vertical
        },
        text: {
          size: 24,
          x: 265,       // Alineado a la derecha (cajita blanca)
          y: 198,       // Abajo en el footer
          color: [0, 0, 0] // NEGRO (¡Muy importante!)
        }
      }
    };

    // Configuración dinámica según orientación
    const isPortrait = currentTemplate.orientation === 'portrait';
    const pageWidth = isPortrait ? 210 : 297; // mm (A4)
    const pageHeight = isPortrait ? 297 : 210; // mm (A4)

    // Seleccionar layout actual
    const layout = LAYOUTS[currentTemplate.orientation];

    const pdf = new jsPDF({
      orientation: currentTemplate.orientation,
      unit: 'mm',
      format: 'a4'
    });

    // Cargar Fondo
    let bgData = '';
    try {
      bgData = await getBase64FromUrl(currentTemplate.url);
    } catch (e) {
      alert("Error cargando la imagen de fondo. Revisa la URL.");
      setIsGenerating(false);
      return;
    }

    // Registrar códigos en BD
    const records = codesList.map(code => ({
      code,
      status: 'new',
      category: category
    }));
    await supabase.from('qr_codes').upsert(records, { onConflict: 'code', ignoreDuplicates: true });

    // Generar Páginas
    for (let i = 0; i < codesList.length; i++) {
      if (i > 0) pdf.addPage([pageWidth, pageHeight], currentTemplate.orientation);

      // A. DIBUJAR FONDO
      pdf.addImage(bgData, 'PNG', 0, 0, pageWidth, pageHeight);

      // B. DIBUJAR QR
      const canvas = document.getElementById(`qr-canvas-${codesList[i]}`) as HTMLCanvasElement;
      if (canvas) {
        const qrData = canvas.toDataURL('image/png');
        // Centrar QR horizontalmente siempre
        const qrX = (pageWidth - layout.qr.size) / 2;
        pdf.addImage(qrData, 'PNG', qrX, layout.qr.y, layout.qr.size, layout.qr.size);
      }

      // C. DIBUJAR CÓDIGO DE TEXTO
      // DIBUJAR CÓDIGO ID
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(layout.text.size);
      // @ts-ignore
      pdf.setTextColor(layout.text.color[0], layout.text.color[1], layout.text.color[2]);

      const text = codesList[i]; // Solo el código, sin prefijo
      pdf.text(text, layout.text.x, layout.text.y, { align: 'center' });
    }

    if (startNum !== null) setStartNum(startNum + quantity);
    pdf.save(`qvisos-${category}-${codesList[0]}.pdf`);
    setIsGenerating(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;

  const LOGO_URL = "/logo.png";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-10 font-sans">
      <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow-xl">
        <div className="mb-6">
          <Link
            href="/mis-anuncios"
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
          >
            <span>&larr; Volver a Mis Anuncios</span>
          </Link>
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-6">🖨️ Impresión con Plantilla</h1>

        <div className="flex gap-4 mb-8 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-bold text-gray-500 mb-2">CANTIDAD</label>
            <input
              type="number" min="1" max="50"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full p-4 border-2 border-gray-300 rounded-lg text-2xl font-bold text-center"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-bold text-gray-500 mb-2">CATEGORÍA / TIPO</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg font-medium bg-white"
            >
              <option value="venta_propiedad">🏠 Venta Propiedad</option>
              <option value="arriendo_propiedad">🔑 Arriendo Propiedad</option>
              <option value="venta_auto">🚗 Venta Auto</option>
              <option value="generico">🌐 Genérico (Usuario Elige)</option>
            </select>
          </div>

          <div className="flex-1 pb-4 min-w-[200px]">
            <p className="text-lg text-gray-600">
              Generando del <strong>{codesList[0]}</strong> al <strong>{codesList[codesList.length - 1]}</strong>
            </p>
          </div>
          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-xl shadow-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? 'GENERANDO...' : 'DESCARGAR PDF'}
          </button>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm">
          <strong>Nota:</strong> Este sistema usa tu diseño de Canva como fondo y superpone los códigos QR automáticamente.
        </div>

        {/* VISTA PREVIA DE LA IMAGEN DE FONDO */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Plantilla Activa ({currentTemplate.orientation})</p>
          <img
            src={currentTemplate.url}
            alt="Plantilla"
            className={`w-full h-auto mx-auto shadow-2xl border-4 border-gray-800 rounded-lg ${currentTemplate.orientation === 'landscape' ? 'max-w-[500px]' : 'max-w-[350px]'
              }`}
          />
        </div>
      </div>

      {/* GENERADOR OCULTO (Canvas para los QRs) */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        {codesList.map(code => (
          <QRCodeCanvas
            key={code}
            id={`qr-canvas-${code}`}
            value={`https://qvisos.cl/q/${code}`}
            size={1000} // Alta calidad para impresión
            level="H"
            fgColor="#000000" // QR Negro sobre tu fondo blanco
            bgColor="#ffffff"
            includeMargin={false}
            imageSettings={{
              src: LOGO_URL,
              height: 240, width: 240,
              excavate: true,
            }}
          />
        ))}
      </div>
    </div>
  );
}
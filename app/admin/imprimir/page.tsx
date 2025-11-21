// En: app/admin/imprimir/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';

export default function ProductionStation() {
  const [startNum, setStartNum] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  // Solo usamos formato Propiedad para este diseño de Canva (50x70)
  const [format, setFormat] = useState<'propiedad'>('propiedad');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. TUS IMÁGENES (Fondo y Logo)
  const BG_IMAGE_URL = "https://wcczvedassfquzdrmwko.supabase.co/storage/v1/object/public/media/Se%20Vende1.png";
  const LOGO_URL = "https://sojkaasvfrzcdkseimqw.supabase.co/storage/v1/object/public/media/logo-qvisos.jpg";

  // Configuración Fija para tu diseño de 50x70
  const config = {
    width: 500, // mm
    height: 700, // mm
    qrSize: 300, // mm (Tamaño del QR en el PDF)
    qrY: 200,   // mm (Posición vertical del QR desde arriba)
    textY: 600  // mm (Posición vertical del texto del código)
  };

  // Generador de códigos
  const generateCodes = () => {
    if (startNum === null) return [];
    return Array.from({ length: quantity }, (_, i) => `QV-${String(startNum + i).padStart(3, '0')}`);
  };
  const codesList = generateCodes();

  // Inicializar secuencia desde BD
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('qr_codes').select('code').order('code', { ascending: false }).limit(1).single();
      let next = 1;
      if (data?.code) next = parseInt(data.code.split('-')[1]) + 1;
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
    const supabase = createClient();

    // 1. Preparar PDF
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: [config.width, config.height]
    });

    // 2. Cargar Fondo (Plantilla Canva)
    let bgData = '';
    try {
      bgData = await getBase64FromUrl(BG_IMAGE_URL);
    } catch (e) {
      alert("Error cargando la imagen de fondo. Revisa la URL.");
      setIsGenerating(false);
      return;
    }

    // 3. Registrar códigos en BD
    const records = codesList.map(code => ({ code, status: 'new' }));
    await supabase.from('qr_codes').upsert(records, { onConflict: 'code', ignoreDuplicates: true });

    // 4. Generar Páginas
    for (let i = 0; i < codesList.length; i++) {
      if (i > 0) pdf.addPage([config.width, config.height], 'p');

      // A. DIBUJAR FONDO (Imagen Completa)
      pdf.addImage(bgData, 'PNG', 0, 0, config.width, config.height);

      // B. DIBUJAR QR
      const canvas = document.getElementById(`qr-canvas-${codesList[i]}`) as HTMLCanvasElement;
      if (canvas) {
        const qrData = canvas.toDataURL('image/png');
        // Centrar QR horizontalmente
        const x = (config.width - config.qrSize) / 2;
        pdf.addImage(qrData, 'PNG', x, config.qrY, config.qrSize, config.qrSize);
      }

      // C. DIBUJAR CÓDIGO DE TEXTO
      pdf.setTextColor(255, 0, 0); // Rojo (Ajusta si quieres otro color)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(120); // Tamaño de letra gigante

      const text = `CÓDIGO: ${codesList[i]}`;
      const textWidth = pdf.getTextWidth(text);
      const textX = (config.width - textWidth) / 2; // Centrado

      // Ajustamos la posición Y para que quede abajo del QR (o donde tu diseño lo pida)
      pdf.text(text, textX, config.textY);
    }

    // 5. Finalizar
    if (startNum !== null) setStartNum(startNum + quantity);
    pdf.save(`qvisos-lote-${codesList[0]}.pdf`);
    setIsGenerating(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-10 font-sans">
      <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow-xl">
        <h1 className="text-3xl font-black text-gray-800 mb-6">🖨️ Impresión con Plantilla</h1>

        <div className="flex gap-4 mb-8 items-end">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-500 mb-2">CANTIDAD</label>
            <input
              type="number" min="1" max="50"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full p-4 border-2 border-gray-300 rounded-lg text-2xl font-bold text-center"
            />
          </div>
          <div className="flex-1 pb-4">
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
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Plantilla Activa</p>
          <img src={BG_IMAGE_URL} alt="Plantilla" className="w-64 h-auto mx-auto border shadow-sm" />
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
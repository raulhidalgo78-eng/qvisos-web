'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Oswald } from 'next/font/google';
import { registerCodes } from './actions';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';

// Configurar fuente Oswald
const oswald = Oswald({
  subsets: ['latin'],
  weight: ['700'], // Bold
  variable: '--font-oswald',
});

export default function ProductionStation() {
  const [startNum, setStartNum] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- 1. CONFIGURACIÓN DEL FLUJO (3 Pasos) ---
  const [category, setCategory] = useState('propiedad'); // 'auto' | 'propiedad'
  const [action, setAction] = useState('venta');         // 'venta' | 'arriendo'
  const [size, setSize] = useState('30x45');             // '20x30' | '30x45' | '50x75' | '100x150'

  // --- 2. LÓGICA DE DISEÑO ---
  const getTitle = () => {
    return action === 'arriendo' ? 'ARRIENDO' : 'VENDO';
  };
  const title = getTitle();

  // Mapa de Tamaños (cm -> mm para PDF)
  const SIZES = {
    '20x30': { width: 200, height: 300, label: 'Pequeño (Moto/Lobby) - 20x30cm' },
    '30x45': { width: 300, height: 450, label: 'Estándar (Autos/Ventanas) - 30x45cm' },
    '50x75': { width: 500, height: 750, label: 'Grande (Casas/Locales) - 50x75cm' },
    '100x150': { width: 1000, height: 1500, label: 'Gigante (Terrenos/Industrial) - 100x150cm' },
  };

  // Inicializar secuencia
  useEffect(() => {
    const init = async () => {
      const { getLastQrCode } = await import('@/app/actions/get-last-qr');
      const lastCode = await getLastQrCode();
      let next = 1;
      if (lastCode) {
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

  const generateCodes = () => {
    if (startNum === null) return [];
    return Array.from({ length: quantity }, (_, i) => `QV-${String(startNum + i).padStart(3, '0')}`);
  };
  const codesList = generateCodes();

  const handleGeneratePDF = async () => {
    setIsGenerating(true);

    // Tamaños en CM (según snippet del usuario)
    const sizesCM: Record<string, [number, number]> = {
      '20x30': [20, 30],
      '30x45': [30, 45],
      '50x75': [50, 75],
      '100x150': [100, 150]
    };
    // @ts-ignore
    const [width, height] = sizesCM[size] || sizesCM['30x45'];

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'cm',
      format: [width, height]
    });

    // --- INYECCIÓN DE FUENTE OSWALD (Base64) ---
    try {
      const { oswaldBoldBase64 } = await import('./oswaldFont');
      pdf.addFileToVFS("Oswald-Bold.ttf", oswaldBoldBase64);
      pdf.addFont("Oswald-Bold.ttf", "Oswald", "bold");
      pdf.setFont("Oswald", "bold");
    } catch (e) {
      console.error("Error cargando fuente Oswald:", e);
      pdf.setFont("helvetica", "bold"); // Fallback
    }

    // Registrar en BD
    const records = codesList.map(code => ({
      code,
      status: 'printed',
      category: `${action}_${category}`
    }));
    await registerCodes(records);

    // Generar Páginas
    for (let i = 0; i < codesList.length; i++) {
      if (i > 0) pdf.addPage([width, height], 'portrait');
      const currentCode = codesList[i];

      // 1. HEADER (Azul, 22% alto)
      const headerH = height * 0.22;
      pdf.setFillColor(0, 0, 204); // Azul profundo
      pdf.rect(0, 0, width, headerH, "F");

      // Título GIGANTE dinámico (VENDO/ARRIENDO)
      pdf.setTextColor(255, 255, 255);
      // Escala matemática del usuario: (width * 0.28) * 2.83
      // Nota: 2.83 es aprox la conversión de mm a puntos o similar, ajustamos para CM
      pdf.setFontSize((width * 0.28) * 2.83 * 10); // Multiplicamos por 10 porque unit es CM pero fontSize suele ser PT
      // Ajuste: En jsPDF 'cm', setFontSize usa points. 1cm = 28.35pt.
      // El snippet original: (width * 0.28) * 2.83. Si width=30, size=23.7. Muy chico.
      // Probablemente el snippet asumía unit='mm' o 'pt'.
      // Vamos a usar la lógica visual: Font size debe ser ~20% del width en puntos?
      // Re-calculando basado en "VENDO" llenando el ancho.
      // En el código anterior: fontSize = (pageWidth_mm / 300) * 280.
      // Si width_cm=30 -> width_mm=300 -> size=280.
      // 280pt es gigante.
      // Vamos a mantener la lógica anterior que funcionaba pero adaptada a CM.
      // 30cm = 300mm.

      const fontSize = (width / 30) * 280; // Base 280pt para 30cm ancho
      pdf.setFontSize(fontSize);

      const titleText = action === 'venta' ? 'VENDO' : 'ARRIENDO';
      pdf.text(titleText, width / 2, headerH / 2 + (height * 0.01), { align: "center", baseline: "middle" });

      // 2. FOOTER (Negro, 12% alto)
      const footerH = height * 0.12;
      const footerY = height - footerH;
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, footerY, width, footerH, "F");

      // Logo QVisos (Grande y legible)
      // Escala usuario: (width * 0.13) * 2.83
      const logoSize = (width * 0.13) * 28.35; // Convertir a pt
      pdf.setFontSize(logoSize);
      pdf.setTextColor(255, 255, 255);
      pdf.text("QVisos", width * 0.05, footerY + (footerH / 2), { baseline: "middle" });

      pdf.setTextColor(0, 150, 255); // Cyan
      const txtW = pdf.getTextWidth("QVisos");
      pdf.text(".cl", (width * 0.05) + txtW + (width * 0.01), footerY + (footerH / 2), { baseline: "middle" });

      // ID Box (Derecha)
      const idW = footerH * 2.5;
      const idH = footerH * 0.6;
      const idX = width - (width * 0.05) - idW;
      const idY = footerY + (footerH - idH) / 2;

      pdf.setFillColor(255, 255, 255);
      pdf.rect(idX, idY, idW, idH, "F");

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(logoSize * 0.7);
      pdf.text(currentCode, idX + idW / 2, idY + idH / 2, { align: "center", baseline: "middle" });

      // 3. QR (Cuerpo Central) - Máximo tamaño posible sin tocar bordes
      const bodyY = headerH;
      const bodyH = footerY - headerH;

      // Obtener imagen del canvas oculto
      const canvas = document.getElementById(`qr-canvas-${currentCode}`) as HTMLCanvasElement;
      if (canvas) {
        const qrData = canvas.toDataURL('image/png');

        const qrSize = Math.min(width, bodyH) * 0.85; // 85% del menor lado disponible
        const qrX = (width - qrSize) / 2;
        // Centrado vertical en el cuerpo
        const qrY = bodyY + (bodyH - qrSize) / 2;

        pdf.addImage(qrData, "PNG", qrX, qrY, qrSize, qrSize);

        // Texto "Escanea para ver precio" debajo del QR
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(width * 1.5); // Aprox 5% del ancho en pt
        pdf.text("Escanea para ver precio", width / 2, qrY + qrSize + (height * 0.02), { align: 'center' });
      }
    }

    if (startNum !== null) setStartNum(startNum + quantity);
    pdf.save(`qvisos-${action}-${size}-${codesList[0]}.pdf`);
    setIsGenerating(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;
  const LOGO_URL = "https://wcczvedassfquzdrmwko.supabase.co/storage/v1/object/public/media/logo-qvisos.jpg";

  return (
    <div className={`min-h-screen bg-gray-100 flex flex-col items-center p-6 md:p-10 font-sans ${oswald.variable}`}>
      <div className="w-full max-w-7xl bg-white p-6 md:p-8 rounded-xl shadow-xl flex flex-col lg:flex-row gap-8 lg:gap-12">

        {/* --- PANEL DE CONFIGURACIÓN --- */}
        <div className="flex-1 space-y-8">
          <div>
            <Link href="/mis-anuncios" className="text-gray-500 hover:text-gray-800 font-bold inline-flex items-center mb-4">
              <span>&larr; Volver a Mis Anuncios</span>
            </Link>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">🖨️ Generador de Letreros</h1>
            <p className="text-gray-500 text-lg">Configura tu letrero en 3 pasos.</p>
          </div>

          {/* PASO 1: CATEGORÍA */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">1. Categoría (Contexto)</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setCategory('auto')}
                className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${category === 'auto' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
              >
                🚗 Autos
              </button>
              <button
                onClick={() => setCategory('propiedad')}
                className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${category === 'propiedad' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
              >
                🏡 Propiedades
              </button>
            </div>
          </div>

          {/* PASO 2: ACCIÓN */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">2. Acción (Título)</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setAction('venta')}
                className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${action === 'venta' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
              >
                VENDO
              </button>
              <button
                onClick={() => setAction('arriendo')}
                className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${action === 'arriendo' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
              >
                ARRIENDO
              </button>
            </div>
          </div>

          {/* PASO 3: TAMAÑO */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">3. Tamaño de Impresión</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg font-medium bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {Object.entries(SIZES).map(([key, val]) => (
                // @ts-ignore
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          {/* CANTIDAD Y BOTÓN */}
          <div className="pt-4 border-t border-gray-100 flex gap-4 items-end">
            <div className="w-24">
              <label className="block text-xs font-bold text-gray-400 mb-1">CANTIDAD</label>
              <input
                type="number" min="1" max="50"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg text-xl font-bold text-center"
              />
            </div>
            <button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="flex-1 bg-gray-900 text-white px-6 py-4 rounded-xl font-bold text-xl shadow-xl hover:bg-black disabled:opacity-50 transition-all transform hover:-translate-y-1"
            >
              {isGenerating ? '🖨️ Generando PDF...' : '📥 Descargar PDF Vectorial'}
            </button>
          </div>
        </div>

        {/* --- VISTA PREVIA (CSS REFLEJA PDF) --- */}
        <div className="flex-1 bg-gray-100 rounded-2xl p-8 flex items-center justify-center min-h-[600px]">
          <div
            className="relative bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-500"
            style={{
              width: '360px', // Ancho fijo para preview
              aspectRatio: '2/3',
            }}
          >
            {/* ZONA A: CABECERA */}
            <div className="h-[22%] bg-blue-700 flex items-center justify-center px-2">
              <h2
                className="text-white font-bold leading-none tracking-tighter text-center w-full"
                style={{
                  fontFamily: 'var(--font-oswald)',
                  fontSize: action === 'venta' ? '100px' : '75px' // Ajuste visual aproximado para preview
                }}
              >
                {title}
              </h2>
            </div>

            {/* ZONA B: CUERPO */}
            <div className="flex-grow bg-white flex flex-col items-center justify-center relative">
              {/* QR A SANGRE (85% width) */}
              <div style={{ width: '85%' }}>
                <QRCodeCanvas
                  value={`https://qvisos.cl/q/${codesList[0]}`}
                  size={400} // Renderizado grande
                  style={{ width: '100%', height: 'auto' }}
                  level="H"
                  fgColor="#000000"
                  bgColor="#ffffff"
                  includeMargin={false}
                  imageSettings={{
                    src: LOGO_URL,
                    height: 60, width: 60,
                    excavate: true,
                    crossOrigin: 'anonymous',
                  }}
                />
              </div>
              <p className="mt-2 text-black font-bold text-xl text-center uppercase tracking-tight" style={{ fontFamily: 'var(--font-oswald)' }}>
                Escanea para ver precio
              </p>
            </div>

            {/* ZONA C: PIE */}
            <div className="h-[12%] bg-black flex items-center justify-between px-6">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-3xl tracking-tighter" style={{ fontFamily: 'var(--font-oswald)' }}>QVisos</span>
                <span className="text-cyan-400 font-bold text-3xl tracking-tighter" style={{ fontFamily: 'var(--font-oswald)' }}>.cl</span>
              </div>
              <div className="bg-white px-3 py-1 rounded-md min-w-[80px] text-center">
                <span className="text-black font-bold text-xl leading-none" style={{ fontFamily: 'var(--font-oswald)' }}>
                  {codesList[0]}
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* GENERADOR OCULTO (Canvas para los QRs del PDF) */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        {codesList.map(code => (
          <QRCodeCanvas
            key={code}
            id={`qr-canvas-${code}`}
            value={`https://qvisos.cl/q/${code}`}
            size={2000} // Ultra Alta calidad para impresión gigante
            level="H"
            fgColor="#000000"
            bgColor="#ffffff"
            includeMargin={false}
            imageSettings={{
              src: LOGO_URL,
              height: 500, width: 500,
              excavate: true,
              crossOrigin: 'anonymous',
            }}
          />
        ))}
      </div>
    </div>
  );
}
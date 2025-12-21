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

// Helper de Colores
const getColorScheme = (category: string, action: string) => {
  if (category === 'auto') {
    return {
      headerBg: '#FF5722', // Naranja (Alta Visibilidad)
      headerBgHex: [255, 87, 34], // RGB para PDF
      headerText: '#FFFFFF',
      title: 'VENDO'
    };
  }
  // Propiedad
  if (action === 'arriendo') {
    return {
      headerBg: '#1976D2', // Azul
      headerBgHex: [25, 118, 210],
      headerText: '#FFFFFF',
      title: 'ARRIENDO'
    };
  }
  // Propiedad Venta (Default Red)
  return {
    headerBg: '#D32F2F', // Rojo
    headerBgHex: [211, 47, 47],
    headerText: '#FFFFFF',
    title: 'VENDO'
  };
};

export default function ProductionStation() {
  const [startNum, setStartNum] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- 1. CONFIGURACIÓN DEL FLUJO ---
  const [category, setCategory] = useState('propiedad');
  const [action, setAction] = useState('venta');
  const [size, setSize] = useState('30x45');

  // Esquema visual actual
  const colorScheme = getColorScheme(category, action);

  // Mapa de Tamaños (cm -> mm para PDF)
  const SIZES = {
    '20x30': { width: 200, height: 300, label: 'Pequeño (Moto/Lobby) - 20x30cm' },
    '30x45': { width: 300, height: 450, label: 'Estándar (Autos/Ventanas) - 30x45cm' },
    '50x75': { width: 500, height: 750, label: 'Grande (Casas/Locales) - 50x75cm' },
    '100x150': { width: 1000, height: 1500, label: 'Gigante (Terrenos/Industrial) - 100x150cm' },
  };

  // Tamaños en CM para cálculo
  const sizesCM: Record<string, [number, number]> = {
    '20x30': [20, 30],
    '30x45': [30, 45],
    '50x75': [50, 75],
    '100x150': [100, 150]
  };

  // --- RESTRICCIONES DE LÓGICA ---
  useEffect(() => {
    if (category === 'auto') {
      setAction('venta'); // Autos solo se venden (en este contexto simple)
      // Autos no usan formatos gigantes ni grandes usualmente
      if (['50x75', '100x150'].includes(size)) {
        setSize('30x45');
      }
    } else {
      // Propiedad: No usa formato "Pequeño"
      if (size === '20x30') {
        setSize('30x45');
      }
    }
  }, [category]);

  // Filtrar tamaños disponibles según categoría
  const availableSizes = Object.entries(SIZES).filter(([key]) => {
    if (category === 'auto') return ['20x30', '30x45'].includes(key);
    if (category === 'propiedad') return ['30x45', '50x75', '100x150'].includes(key);
    return true;
  });

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

    // Obtener dimensiones
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

      // Convertir unidades para fórmulas
      const widthPt = width * 28.35; // CM a PT para cálculos precisos de fuente

      // DISTRIBUCIÓN VERTICAL: 20% / 65% / 15%
      const headerH = height * 0.20;
      const footerH = height * 0.15;
      const bodyH = height * 0.65; // Espacio central para QR

      const headerY = 0;
      const bodyY = headerH;
      const footerY = height - footerH;

      // 1. HEADER (20%)
      const [r, g, b] = colorScheme.headerBgHex;
      pdf.setFillColor(r, g, b);
      pdf.rect(0, 0, width, headerH, "F");

      // --- TÍTULO ELÁSTICO (Elastic Text) ---
      pdf.setTextColor(255, 255, 255);

      // A. Definir ancho objetivo (85% del ancho de página)
      const targetWidth = width * 0.85; // en CM, ya que doc está en CM

      // B. Medir con un tamaño base arbitrario (ej: 100pt)
      const baseFontSize = 100;
      pdf.setFontSize(baseFontSize);
      const textWidth = pdf.getTextWidth(colorScheme.title); // Retorna ancho en unit (CM)

      // C. Calcular factor de escala y nuevo tamaño
      const scaleFactor = targetWidth / textWidth;
      const finalFontSize = baseFontSize * scaleFactor;

      pdf.setFontSize(finalFontSize);
      // Centrado vertical óptimo: +10% del alto del header para compensar baseline
      pdf.text(colorScheme.title, width / 2, headerH / 2 + (headerH * 0.12), { align: "center", baseline: "middle" });


      // 2. BODY (65%) - QR MAXIMIZADO
      // QR Size = 80% del ancho (Regla 2)
      const qrSize = width * 0.8;
      const qrX = (width - qrSize) / 2;

      // Centrado Vertical en el Body
      const qrY = bodyY + (bodyH - qrSize) / 2;

      // Obtener imagen del canvas
      const canvas = document.getElementById(`qr-canvas-${currentCode}`) as HTMLCanvasElement;
      if (canvas) {
        const qrData = canvas.toDataURL('image/png');
        pdf.addImage(qrData, "PNG", qrX, qrY, qrSize, qrSize);

        // Texto "Escanea" debajo del QR, pero dentro del área segura si sobra espacio
        // O justo debajo del QR si el QR es muy grande
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(widthPt * 0.05); // Texto pequeño relativo
        const ctaY = qrY + qrSize + (height * 0.02);
        if (ctaY < footerY) {
          pdf.text("Escanea para ver precio", width / 2, ctaY, { align: 'center', baseline: 'top' });
        }
      }

      // 3. FOOTER (15%)
      pdf.setFillColor(0, 0, 0); // Fondo Negro (Regla 3)
      pdf.rect(0, footerY, width, footerH, "F");

      // Texto Footer Proporcionado: 8% del ancho
      const footerFontSizePt = widthPt * 0.08;
      pdf.setFontSize(footerFontSizePt);
      pdf.setTextColor(255, 255, 255);

      const footerCenterY = footerY + (footerH / 2);
      pdf.text(`QVisos.cl  |  ${currentCode}`, width / 2, footerCenterY, { align: 'center', baseline: 'middle' });

      // 4. GUÍAS DE CORTE (Crop Marks)
      // Dibujar líneas finas en las 4 esquinas
      pdf.setDrawColor(200, 200, 200); // Gris claro
      pdf.setLineWidth(0.01);
      const mLen = 0.5; // 5mm de longitud

      // Top-Left
      pdf.line(0, 0, mLen, 0);
      pdf.line(0, 0, 0, mLen);

      // Top-Right
      pdf.line(width, 0, width - mLen, 0);
      pdf.line(width, 0, width, mLen);

      // Bottom-Left
      pdf.line(0, height, 0, height - mLen);
      pdf.line(0, height, mLen, height);

      // Bottom-Right
      pdf.line(width, height, width - mLen, height);
      pdf.line(width, height, width, height - mLen);
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
                className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${category === 'auto' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
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
                className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${action === 'venta'
                    ? (category === 'auto' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-red-600 bg-red-50 text-red-700')
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
              >
                VENDO
              </button>
              <button
                onClick={() => category !== 'auto' && setAction('arriendo')}
                disabled={category === 'auto'}
                className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${category === 'auto'
                    ? 'opacity-50 cursor-not-allowed border-gray-100 text-gray-300'
                    : action === 'arriendo'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
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
              {availableSizes.map(([key, val]) => (
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

        {/* --- VISTA PREVIA (CSS REFLEJA PDF 20/65/15) --- */}
        <div className="flex-1 bg-gray-100 rounded-2xl p-8 flex items-center justify-center min-h-[600px]">
          <div
            className="relative bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-500"
            style={{
              width: '360px', // Ancho fijo para preview
              aspectRatio: '2/3',
            }}
          >
            {/* ZONA A: HEADER 20% */}
            <div
              className="h-[20%] flex items-center justify-center px-2 transition-colors duration-500"
              style={{ backgroundColor: colorScheme.headerBg }}
            >
              <h2
                className="text-white font-bold leading-none tracking-tighter text-center w-full"
                style={{
                  fontFamily: 'var(--font-oswald)',
                  // Ajuste visual aproximado para preview (Simulado)
                  fontSize: colorScheme.title.length > 6 ? '65px' : '90px'
                }}
              >
                {colorScheme.title}
              </h2>
            </div>

            {/* ZONA B: BODY 65% */}
            <div className="h-[65%] bg-white flex flex-col items-center justify-center relative">
              {/* QR A SANGRE (80% width) */}
              <div style={{ width: '80%' }}>
                <QRCodeCanvas
                  value={`https://qvisos.cl/q/${codesList[0]}`}
                  size={400}
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
              <p className="mt-2 text-black font-bold text-sm text-center uppercase tracking-tight" style={{ fontFamily: 'var(--font-oswald)' }}>
                Escanea para ver precio
              </p>
            </div>

            {/* ZONA C: FOOTER 15% */}
            <div className="h-[15%] bg-black flex items-center justify-center px-4">
              <span className="text-white font-bold text-2xl tracking-tighter text-center" style={{ fontFamily: 'var(--font-oswald)' }}>
                QVisos.cl | {codesList[0]}
              </span>
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
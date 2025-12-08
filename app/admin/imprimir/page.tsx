'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Oswald } from 'next/font/google'; // Importar fuente
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
  const [category, setCategory] = useState('venta_propiedad'); // Usamos esto para determinar VENDO/ARRIENDO
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Determinar Título según categoría
  const getTitle = (cat: string) => {
    if (cat.includes('arriendo')) return 'ARRIENDO';
    return 'VENDO';
  };

  const title = getTitle(category);

  // Generador de códigos
  const generateCodes = () => {
    if (startNum === null) return [];
    return Array.from({ length: quantity }, (_, i) => `QV-${String(startNum + i).padStart(3, '0')}`);
  };
  const codesList = generateCodes();

  // Inicializar secuencia desde BD
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

  const handleGeneratePDF = async () => {
    setIsGenerating(true);

    // Configuración A4 Portrait
    const pageWidth = 210;
    const pageHeight = 297;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Registrar códigos en BD
    const records = codesList.map(code => ({
      code,
      status: 'printed',
      category: category
    }));

    await registerCodes(records);

    // Generar Páginas
    for (let i = 0; i < codesList.length; i++) {
      if (i > 0) pdf.addPage([pageWidth, pageHeight], 'portrait');

      const currentCode = codesList[i];

      // --- ZONA A: CABECERA (Azul) ---
      // Altura ~20% = 60mm
      pdf.setFillColor(29, 78, 216); // Blue-700 (Tailwind approx)
      pdf.rect(0, 0, pageWidth, 60, 'F');

      // Texto "VENDO" / "ARRIENDO"
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold"); // Fallback a Helvetica Bold (Oswald es difícil sin embed)
      // Ajustar tamaño según longitud para "fit-to-width"
      const fontSize = title === 'ARRIENDO' ? 90 : 110;
      pdf.setFontSize(fontSize);
      pdf.text(title, pageWidth / 2, 42, { align: 'center' });

      // --- ZONA B: CUERPO (Blanco) ---
      // Fondo blanco implícito (o explícito si se quiere)
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 60, pageWidth, 200, 'F');

      // QR Code
      const canvas = document.getElementById(`qr-canvas-${currentCode}`) as HTMLCanvasElement;
      if (canvas) {
        const qrData = canvas.toDataURL('image/png');
        const qrSize = 140; // Gigante
        const qrX = (pageWidth - qrSize) / 2;
        const qrY = 85; // Centrado verticalmente en el espacio disponible
        pdf.addImage(qrData, 'PNG', qrX, qrY, qrSize, qrSize);
      }

      // Texto "Escanea para ver precio"
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text("Escanea para ver precio", pageWidth / 2, 240, { align: 'center' });

      // --- ZONA C: PIE (Negro) ---
      // Altura ~12% = 37mm (Start at 260)
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 260, pageWidth, 37, 'F');

      // Logo "QVisos.cl" (Izquierda)
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(40);
      pdf.setFont("helvetica", "bold");
      pdf.text("QVisos", 20, 285);
      pdf.setTextColor(59, 130, 246); // Blue-500 for .cl
      pdf.text(".cl", 82, 285); // Ajuste manual simple

      // Caja ID (Derecha)
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(140, 270, 50, 20, 2, 2, 'F'); // Caja blanca redondeada

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(20);
      pdf.text(currentCode, 165, 282, { align: 'center' });
    }

    if (startNum !== null) setStartNum(startNum + quantity);
    pdf.save(`qvisos-vertical-${category}-${codesList[0]}.pdf`);
    setIsGenerating(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;

  const LOGO_URL = "https://wcczvedassfquzdrmwko.supabase.co/storage/v1/object/public/media/logo-qvisos.jpg";

  return (
    <div className={`min-h-screen bg-gray-100 flex flex-col items-center p-10 font-sans ${oswald.variable}`}>
      <div className="w-full max-w-6xl bg-white p-8 rounded-xl shadow-xl flex flex-col lg:flex-row gap-10">

        {/* PANEL DE CONTROL */}
        <div className="flex-1">
          <div className="mb-6">
            <Link
              href="/mis-anuncios"
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
            >
              <span>&larr; Volver a Mis Anuncios</span>
            </Link>
          </div>
          <h1 className="text-3xl font-black text-gray-800 mb-6">🖨️ Estación de Impresión</h1>
          <p className="mb-6 text-gray-600">Nuevo Estándar Vertical (30x45cm / 50x75cm)</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">CANTIDAD</label>
              <input
                type="number" min="1" max="50"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full p-4 border-2 border-gray-300 rounded-lg text-2xl font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">TIPO DE LETRERO</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg font-medium bg-white"
              >
                <option value="venta_propiedad">VENDO (Propiedad/Auto/Genérico)</option>
                <option value="arriendo_propiedad">ARRIENDO (Propiedad/Genérico)</option>
              </select>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm">
              <strong>Generando:</strong> {codesList[0]} al {codesList[codesList.length - 1]}
            </div>

            <button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="w-full bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-xl shadow-lg hover:bg-blue-800 disabled:opacity-50 transition-all"
            >
              {isGenerating ? 'GENERANDO PDF...' : 'DESCARGAR PDF VERTICAL'}
            </button>
          </div>
        </div>

        {/* VISTA PREVIA (CSS PURO - WYSIWYG) */}
        <div className="flex-1 flex justify-center bg-gray-200 p-8 rounded-xl items-center">
          <div
            className="relative bg-white shadow-2xl flex flex-col overflow-hidden"
            style={{ width: '300px', height: '450px' }} // Aspect Ratio 2:3 (Simula 30x45cm)
          >
            {/* ZONA A: CABECERA */}
            <div className="h-[20%] bg-blue-700 flex items-center justify-center">
              <h2 className={`text-white font-bold leading-none tracking-tighter ${title === 'ARRIENDO' ? 'text-5xl' : 'text-7xl'}`} style={{ fontFamily: 'var(--font-oswald)' }}>
                {title}
              </h2>
            </div>

            {/* ZONA B: CUERPO */}
            <div className="flex-grow bg-white flex flex-col items-center justify-center p-4 relative">
              {/* Margen de aire simulado */}
              <div className="bg-white p-2">
                <QRCodeCanvas
                  value={`https://qvisos.cl/q/${codesList[0]}`}
                  size={180}
                  level="H"
                  fgColor="#000000"
                  bgColor="#ffffff"
                  includeMargin={false}
                  imageSettings={{
                    src: LOGO_URL,
                    height: 40, width: 40,
                    excavate: true,
                    crossOrigin: 'anonymous',
                  }}
                />
              </div>
              <p className="mt-4 text-black font-bold text-lg text-center uppercase tracking-tight" style={{ fontFamily: 'var(--font-oswald)' }}>
                Escanea para ver precio
              </p>
            </div>

            {/* ZONA C: PIE */}
            <div className="h-[12%] bg-black flex items-center justify-between px-4">
              <div className="flex items-center">
                <span className="text-white font-bold text-2xl tracking-tighter" style={{ fontFamily: 'var(--font-oswald)' }}>QVisos</span>
                <span className="text-blue-500 font-bold text-2xl tracking-tighter" style={{ fontFamily: 'var(--font-oswald)' }}>.cl</span>
              </div>
              <div className="bg-white px-2 py-1 rounded">
                <span className="text-black font-bold text-lg leading-none" style={{ fontFamily: 'var(--font-oswald)' }}>
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
            size={1000} // Alta calidad para impresión
            level="H"
            fgColor="#000000"
            bgColor="#ffffff"
            includeMargin={false}
            imageSettings={{
              src: LOGO_URL,
              height: 300, width: 300,
              excavate: true,
              crossOrigin: 'anonymous',
            }}
          />
        ))}
      </div>
    </div>
  );
}
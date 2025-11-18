// En: app/admin/imprimir/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { QRCodeCanvas } from 'qrcode.react'; // CAMBIO: Usamos Canvas para mejor compatibilidad
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ProductionStation() {
  const [startNum, setStartNum] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [format, setFormat] = useState<'propiedad' | 'auto'>('propiedad');
  const [intent, setIntent] = useState<'venta' | 'arriendo'>('venta');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Referencia para capturar
  const posterRef = useRef<HTMLDivElement>(null);
  
  // Estado para el loop de generación
  const [currentCodeToRender, setCurrentCodeToRender] = useState<string>('');

  const LOGO_URL = "https://wcczvedassfquzdrmwko.supabase.co/storage/v1/object/public/media/logo-qvisos.jpg";

  // CONFIGURACIÓN EN PÍXELES FIJOS (Alta Resolución)
  // Definimos un ancho base de 1000px. La altura depende del formato.
  const config = {
    propiedad: { 
      label: 'Propiedad', 
      width: 1000, 
      height: 1400, // Proporción 50x70
      pdfFormat: [500, 700] as [number, number], // mm
      headerSize: '140px',
      footerTitle: '60px',
      footerCode: '80px',
      qrSize: 600
    },
    auto: { 
      label: 'Auto', 
      width: 1000, 
      height: 600, // Proporción 50x30
      pdfFormat: [500, 300] as [number, number], // mm
      headerSize: '100px',
      footerTitle: '40px',
      footerCode: '60px',
      qrSize: 350
    }
  };

  const colors = {
    venta: { label: 'SE VENDE', bg: '#dc2626', hex: '#dc2626' },
    arriendo: { label: 'SE ARRIENDA', bg: '#2563eb', hex: '#2563eb' }
  };

  const activeFormat = config[format];
  const activeColor = colors[intent];

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

  const generateCodes = () => {
    if (startNum === null) return [];
    return Array.from({ length: quantity }, (_, i) => `QV-${String(startNum + i).padStart(3, '0')}`);
  };
  
  const codesList = generateCodes();

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    const supabase = createClient();
    const orientation = activeFormat.height > activeFormat.width ? 'p' : 'l';
    
    // Crear PDF
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: activeFormat.pdfFormat
    });

    // Registrar en BD
    const records = codesList.map(code => ({ code, status: 'new' }));
    await supabase.from('qr_codes').upsert(records, { onConflict: 'code', ignoreDuplicates: true });

    // Generar páginas
    for (let i = 0; i < codesList.length; i++) {
      const code = codesList[i];
      setCurrentCodeToRender(code);
      
      // Esperar renderizado (crítico para que el QR se dibuje)
      await new Promise(resolve => setTimeout(resolve, 300));

      if (posterRef.current) {
        try {
          const canvas = await html2canvas(posterRef.current, {
            scale: 2, // Alta calidad
            useCORS: true, // Permitir imágenes externas
            backgroundColor: '#ffffff',
            logging: false
          });
          
          const imgData = canvas.toDataURL('image/jpeg', 0.9);
          
          if (i > 0) pdf.addPage(activeFormat.pdfFormat, orientation);
          pdf.addImage(imgData, 'JPEG', 0, 0, activeFormat.pdfFormat[0], activeFormat.pdfFormat[1]);
        } catch (err) {
          console.error("Error capturando página:", err);
        }
      }
    }

    pdf.save(`qvisos-${format}-${codesList[0]}.pdf`);
    setIsGenerating(false);
  };

  // --- DISEÑO MAESTRO DEL CARTEL (Rígido en Píxeles) ---
  const PosterTemplate = ({ code }: { code: string }) => (
    <div 
      style={{ 
        width: `${activeFormat.width}px`,
        height: `${activeFormat.height}px`,
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        border: '20px solid black', // Borde Negro Grueso (Marco de corte)
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Cabecera */}
      <div style={{ 
        height: '20%', 
        backgroundColor: activeColor.hex, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderBottom: '10px solid black'
      }}>
        <h1 style={{ 
          color: 'white', 
          fontFamily: 'Arial, sans-serif', 
          fontWeight: 900, 
          fontSize: activeFormat.headerSize, 
          textTransform: 'uppercase',
          margin: 0,
          lineHeight: 1,
          letterSpacing: '-4px'
        }}>
          {activeColor.label}
        </h1>
      </div>

      {/* Cuerpo QR */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px', // Aumentamos un poco el padding si es necesario
        backgroundColor: 'white'
      }}>
         {/* Usamos QRCodeCanvas para mejor compatibilidad con PDF */}
         <QRCodeCanvas
           value={`https://qvisos.cl/q/${code}`}
           size={activeFormat.qrSize}
           level="H"
           fgColor={activeColor.hex}
           bgColor="#ffffff"
           includeMargin={false} // No incluir margen extra en el QR
           imageSettings={{
             src: LOGO_URL, // Aseguramos que toma la URL corregida
             x: undefined, // Dejamos que el componente centre automáticamente en 'x' si no especificamos
             y: undefined, // Dejamos que el componente centre automáticamente en 'y' si no especificamos
             height: activeFormat.qrSize * 0.25, // Logo al 25% del tamaño del QR
             width: activeFormat.qrSize * 0.25,
             excavate: true, // Esto es CRÍTICO: Recorta el QR para hacer espacio al logo
           }}
         />
      </div>

      {/* Pie */}
      <div style={{ 
        height: '15%', 
        backgroundColor: 'black', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 60px'
      }}>
         <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#9ca3af', fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>Escanea:</span>
            <span style={{ color: 'white', fontSize: activeFormat.footerTitle, fontWeight: 'bold', lineHeight: 1 }}>Qvisos.cl</span>
         </div>
         <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <span style={{ color: '#9ca3af', fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>Código:</span>
            <span style={{ color: '#facc15', fontSize: activeFormat.footerCode, fontFamily: 'monospace', fontWeight: 'bold', lineHeight: 1 }}>{code}</span>
         </div>
      </div>
    </div>
  );

  if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      
      {/* PANEL DE CONTROL */}
      <div className="w-96 bg-white border-r border-gray-300 p-8 shadow-xl z-10 flex flex-col h-screen overflow-y-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-2">🖨️ Producción</h1>
        <p className="text-sm text-gray-500 mb-8">Generador PDF de Alta Resolución</p>
        
        <div className="space-y-6 flex-1">
           <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Cantidad</label>
              <input type="number" min="1" max="50" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full p-3 border-2 rounded-lg text-xl font-bold text-center" />
              <p className="text-xs text-center mt-2 text-gray-400">Lote: <strong>{codesList[0]}</strong> ...</p>
           </div>
           <div className="grid gap-2">
              <button onClick={() => setFormat('propiedad')} className={`p-3 border-2 rounded ${format === 'propiedad' ? 'bg-black text-white' : ''}`}>🏠 Propiedad (50x70)</button>
              <button onClick={() => setFormat('auto')} className={`p-3 border-2 rounded ${format === 'auto' ? 'bg-black text-white' : ''}`}>🚗 Auto (50x30)</button>
           </div>
           <div className="grid gap-2 grid-cols-2">
              <button onClick={() => setIntent('venta')} className={`p-2 border-2 rounded font-bold ${intent === 'venta' ? 'bg-red-600 text-white' : 'text-red-600'}`}>VENTA</button>
              <button onClick={() => setIntent('arriendo')} className={`p-2 border-2 rounded font-bold ${intent === 'arriendo' ? 'bg-blue-600 text-white' : 'text-blue-600'}`}>ARRIENDO</button>
           </div>
        </div>
        
        <button onClick={handleGeneratePDF} disabled={isGenerating} className="w-full py-5 bg-blue-600 text-white rounded-xl font-black text-xl shadow-xl hover:bg-blue-700 transition disabled:opacity-50">
          {isGenerating ? '⏳ Generando PDF...' : 'DESCARGAR PDF'}
        </button>
        <a href="/admin/dashboard" className="block text-center mt-4 text-sm text-blue-600 underline">Volver al Dashboard</a>
      </div>

      {/* VISOR (Solo Muestra) */}
      <div className="flex-1 bg-gray-200 flex items-center justify-center p-10 overflow-hidden">
         {/* Vista Previa Escalada Visualmente */}
         <div style={{ 
             width: activeFormat.width, 
             height: activeFormat.height, 
             transform: 'scale(0.4)', // Escala fija para ver en pantalla
             transformOrigin: 'center', 
             boxShadow: '0 20px 50px rgba(0,0,0,0.3)' 
         }}>
            {/* Usamos el primer código como muestra */}
            {codesList.length > 0 && <PosterTemplate code={codesList[0]} />}
         </div>
      </div>

      {/* LIENZO OCULTO DE GENERACIÓN (Off-screen) */}
      {/* Aquí renderizamos lo que se va a "imprimir" */}
      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
         <div ref={posterRef}>
            {currentCodeToRender && <PosterTemplate code={currentCodeToRender} />}
         </div>
      </div>

    </div>
  );
}
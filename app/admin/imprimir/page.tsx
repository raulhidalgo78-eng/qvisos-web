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

  // 1. TUS IMÁGENES (Reemplaza con las URL reales de Supabase)
  const LOGO_URL = "https://sojkaasvfrzcdkseimqw.supabase.co/storage/v1/object/public/media/logo-qvisos.jpg"; // Tu logo Q
  
  // ¡IMPORTANTE! Pega aquí la URL de tu fondo limpio de Canva
  const BG_TEMPLATE_URL = "https://wcczvedassfquzdrmwko.supabase.co/storage/v1/object/public/media/Se%20Vende1.png"; 

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

  // --- DISEÑO HÍBRIDO (Fondo Canva + Datos React) ---
  const PosterTemplate = ({ code }: { code: string }) => (
    <div 
      style={{ 
        width: `${activeFormat.width}px`,
        height: `${activeFormat.height}px`,
        backgroundImage: `url(${BG_TEMPLATE_URL})`, // Usamos tu diseño
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        overflow: 'hidden',
        // Quitamos bordes CSS porque ya vienen en la imagen
        border: '1px solid #ddd' 
      }}
    >
      {/* Ajusta estos valores de TOP/LEFT/WIDTH para que el QR 
         caiga justo en el hueco blanco de tu diseño 
      */}
      <div style={{ 
        position: 'absolute',
        top: '35%',    // <--- AJUSTA ESTO (Posición vertical del QR)
        left: '50%',
        transform: 'translate(-50%, -50%)', // Centrado exacto
        width: '55%',  // <--- AJUSTA ESTO (Tamaño del QR)
        aspectRatio: '1/1'
      }}>
         <QRCodeCanvas
           value={`https://qvisos.cl/q/${code}`}
           size={activeFormat.qrSize} // Se ajustará al contenedor
           level="H"
           fgColor="black" // O el color que quieras
           bgColor="#ffffff"
           includeMargin={false}
           style={{ width: '100%', height: '100%' }}
           imageSettings={{
             src: LOGO_URL,
             x: undefined, y: undefined,
             height: activeFormat.qrSize * 0.24,
             width: activeFormat.qrSize * 0.24,
             excavate: true,
           }}
         />
      </div>

      {/* Texto del Código Dinámico (Abajo a la derecha según tu diseño) */}
      <div style={{ 
        position: 'absolute',
        bottom: '5%',   // <--- AJUSTA ESTO (Altura del texto)
        right: '8%',    // <--- AJUSTA ESTO (Margen derecho)
        textAlign: 'right'
      }}>
         <span style={{ 
           fontFamily: 'Arial, sans-serif', 
           fontSize: '30px', 
           color: '#dc2626', // Rojo (o el color de tu diseño)
           fontWeight: 'bold' 
         }}>
           Código: {code}
         </span>
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
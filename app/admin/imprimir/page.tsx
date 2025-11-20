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

  // --- FUNCIÓN AUXILIAR ---
  const getBase64FromUrl = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result as string);
    });
  };

  // --- GENERADOR PDF CON FONDO DE IMAGEN ---
  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    const supabase = createClient();
    
    // 1. CONFIGURACIÓN (URL del Fondo)
    // ¡IMPORTANTE! Reemplaza esto con tu URL real de la plantilla limpia
    const BG_IMAGE_URL = "https://sojkaasvfrzcdkseimqw.supabase.co/storage/v1/object/public/media/Se%20Vende2.jpg"; // Ejemplo
    
    const orientation = activeFormat.height > activeFormat.width ? 'p' : 'l';
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: activeFormat.pdfFormat
    });

    // 2. Cargar la imagen de fondo en memoria (Base64)
    let bgBase64 = '';
    try {
      bgBase64 = await getBase64FromUrl(BG_IMAGE_URL);
    } catch (e) {
      console.error("Error cargando fondo:", e);
      alert("Error cargando la imagen de fondo. Verifica la URL.");
      setIsGenerating(false);
      return;
    }

    // 3. Registrar en BD
    const records = codesList.map(code => ({ code, status: 'new' }));
    await supabase.from('qr_codes').upsert(records, { onConflict: 'code', ignoreDuplicates: true });

    // 4. Generar Páginas
    for (let i = 0; i < codesList.length; i++) {
      const code = codesList[i];
      if (i > 0) pdf.addPage(activeFormat.pdfFormat, orientation);

      const w = activeFormat.pdfFormat[0];
      const h = activeFormat.pdfFormat[1];

      // A. DIBUJAR FONDO (Imagen Canva)
      // Ocupa el 100% de la página
      pdf.addImage(bgBase64, 'JPEG', 0, 0, w, h);

      // B. DIBUJAR QR (Sobre la imagen)
      const qrCanvas = document.getElementById(`qr-canvas-${code}`) as HTMLCanvasElement;
      if (qrCanvas) {
          const qrData = qrCanvas.toDataURL('image/png');
          
          // CALIBRACIÓN: Ajusta estos valores según tu diseño
          // (Estos valores funcionan para el diseño centrado de "Se Vende")
          const qrSize = w * 0.55; // El QR ocupa el 55% del ancho
          const qrX = (w - qrSize) / 2; // Centrado horizontal
          const qrY = h * 0.38; // Posición vertical (aprox 38% desde arriba)
          
          pdf.addImage(qrData, 'PNG', qrX, qrY, qrSize, qrSize);
      }

      // C. DIBUJAR CÓDIGO (Texto)
      pdf.setTextColor(220, 38, 38); // Rojo (o el color que combine)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(w / 12); // Tamaño relativo
      
      // Posición: Abajo a la derecha (ajusta según tu diseño)
      const text = `Código: ${code}`;
      const textW = pdf.getTextWidth(text);
      pdf.text(text, w - textW - 20, h - 20); 
    }

    // 5. Avanzar contador y Descargar
    if (startNum !== null) setStartNum(startNum + quantity);
    
    pdf.save(`qvisos-lote-${codesList[0]}.pdf`);
    setIsGenerating(false);
  };

  // --- DISEÑO MAESTRO "THE MONOLITH" ---
  const PosterTemplate = ({ code }: { code: string }) => {
    // Colores dinámicos según intención
    const mainColor = intent === 'venta' ? '#ef4444' : '#3b82f6'; // Red-500 / Blue-500
    const darkColor = intent === 'venta' ? '#991b1b' : '#1e3a8a'; // Red-800 / Blue-900
    const actionText = intent === 'venta' ? 'VENDE' : 'ARRIENDA';
    const preText = 'SE';

    return (
      <div 
        style={{ 
          width: `${activeFormat.width}px`,
          height: `${activeFormat.height}px`,
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Arial, Helvetica, sans-serif' // Fuente segura para PDF
        }}
      >
        {/* 1. FONDO DE SEGURIDAD (Micro-trama) */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.08,
          backgroundImage: `radial-gradient(${darkColor} 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>

        {/* 2. BANDA LATERAL DE MARCA (Solo en formato Propiedad) */}
        {format === 'propiedad' && (
           <div style={{
             position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px',
             backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center'
           }}>
              <span style={{ 
                color: 'white', fontSize: '40px', fontWeight: 900, letterSpacing: '10px',
                transform: 'rotate(-90deg)', whiteSpace: 'nowrap'
              }}>
                QVISOS.CL CERTIFIED
              </span>
           </div>
        )}

        {/* 3. CABECERA DE IMPACTO */}
        <div style={{ 
          height: '35%', 
          backgroundColor: mainColor, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft: format === 'propiedad' ? '100px' : '50px',
          position: 'relative',
          clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0% 100%)' // Corte diagonal moderno
        }}>
          {/* Texto pequeño "SE" */}
          <span style={{ 
            color: 'rgba(255,255,255,0.8)', fontSize: '60px', fontWeight: 900, 
            textTransform: 'uppercase', lineHeight: 0.8, marginLeft: '5px' 
          }}>
            {preText}
          </span>
          {/* Texto gigante "VENDE" */}
          <span style={{ 
            color: 'white', fontSize: format === 'propiedad' ? '280px' : '180px', fontWeight: 900, 
            textTransform: 'uppercase', lineHeight: 0.85, letterSpacing: '-10px'
          }}>
            {actionText}
          </span>
          
          {/* Sello de Garantía Flotante */}
          <div style={{
            position: 'absolute', right: '50px', top: '50%', transform: 'translateY(-50%)',
            width: '180px', height: '180px', borderRadius: '50%',
            border: '8px solid white', backgroundColor: darkColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
             <span style={{ color: 'white', fontSize: '30px', fontWeight: 'bold', textAlign: 'center', lineHeight: 1.1 }}>
               100%<br/>REAL
             </span>
          </div>
        </div>

        {/* 4. NÚCLEO DEL QR */}
        <div style={{ 
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          paddingLeft: format === 'propiedad' ? '60px' : '0' 
        }}>
           
           <div style={{
             padding: '30px', backgroundColor: 'white', borderRadius: '30px',
             boxShadow: '0 20px 60px -10px rgba(0,0,0,0.15), 0 0 0 4px rgba(0,0,0,0.05)'
           }}>
             <QRCodeCanvas
               value={`https://qvisos.cl/q/${code}`}
               size={activeFormat.qrSize}
               level="H"
               fgColor="#111" // Negro puro para máximo contraste
               bgColor="#FFFFFF"
               includeMargin={false}
               imageSettings={{
                 src: LOGO_URL,
                 x: undefined, y: undefined,
                 height: activeFormat.qrSize * 0.24,
                 width: activeFormat.qrSize * 0.24,
                 excavate: true,
               }}
             />
           </div>
           
           <p style={{ 
             marginTop: '40px', fontSize: '50px', color: '#4b5563', fontWeight: 600, 
             textTransform: 'uppercase', letterSpacing: '2px' 
           }}>
             Escanea para ver detalles
           </p>
        </div>

        {/* 5. PIE DE DATOS */}
        <div style={{ 
          height: '12%', backgroundColor: '#111', 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 60px 0 120px'
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
              <span style={{ color: 'white', fontSize: '40px', fontWeight: 700, letterSpacing: '1px' }}>
                QVISOS.CL
              </span>
           </div>
           <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#6b7280', fontSize: '20px', fontWeight: 700, display: 'block', marginBottom: '5px' }}>
                ID UNICO
              </span>
              <span style={{ color: 'white', fontSize: '50px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '2px' }}>
                {code}
              </span>
           </div>
        </div>

      </div>
    );
  };

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
         {/* Contenedor para los QR que se usarán en el PDF */}
         <div>
            {codesList.map(code => (
                <QRCodeCanvas
                    key={code}
                    id={`qr-canvas-${code}`}
                    value={`https://qvisos.cl/q/${code}`}
                    size={512}
                    level="H"
                    includeMargin={false}
                    fgColor={activeColor.hex}
                    imageSettings={{
                        src: LOGO_URL,
                        height: 128,
                        width: 128,
                        excavate: true,
                    }}
                />
            ))}
         </div>
      </div>

    </div>
  );
}
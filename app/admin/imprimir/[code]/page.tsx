// En: app/admin/imprimir/[code]/page.tsx
'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Tipado para Next.js params en App Router
interface Props {
  params: { code: string };
}

export default function SinglePrintPage({ params }: Props) {
  const { code } = params;
  
  // Usamos hooks para leer query params en client component
  const searchParams = useSearchParams();
  const format = searchParams.get('format') || 'propiedad';
  const intent = searchParams.get('intent') || 'venta';

  const LOGO_URL = "https://sojkaasvfrzcdkseimqw.supabase.co/storage/v1/object/public/media/qvisos-logo-minimal.svg";

  // Configuraciones (Copiadas para mantener consistencia)
  const config: any = {
    propiedad: { printSize: '500mm 700mm', cssClass: 'aspect-[50/70]' },
    auto: { printSize: '500mm 300mm', cssClass: 'aspect-[50/30]' }
  };

  const colors: any = {
    venta: { label: 'SE VENDE', bg: '#dc2626', text: 'text-red-600' },
    arriendo: { label: 'SE ARRIENDA', bg: '#2563eb', text: 'text-blue-600' }
  };

  const activeConfig = config[format as string];
  const activeColor = colors[intent as string];

  // Fallback for invalid config/color
  if (!activeConfig || !activeColor) {
    return <div>Configuración inválida.</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        @page { size: ${activeConfig.printSize}; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      {/* Botones Flotantes (No salen en impresión) */}
      <div className="no-print fixed top-4 right-4 flex gap-4 z-50">
        <button onClick={() => window.print()} className="bg-black text-white px-6 py-3 rounded-full font-bold shadow-xl hover:bg-gray-800">
          🖨️ IMPRIMIR AHORA
        </button>
        <Link href="/admin/imprimir" className="bg-white text-gray-800 px-6 py-3 rounded-full font-bold shadow-xl border hover:bg-gray-50">
          Cerrar
        </Link>
      </div>

      {/* EL CARTEL (Ocupa toda la pantalla) */}
      <div className="w-screen h-screen flex flex-col relative overflow-hidden border-8 border-white">
        
        {/* CABECERA */}
        <div style={{ backgroundColor: activeColor.bg, height: '20%' }} className="w-full flex items-center justify-center">
          <h1 className="text-white font-black uppercase tracking-tighter leading-none text-center" style={{ fontSize: '18vw' }}>
            {activeColor.label}
          </h1>
        </div>

        {/* QR */}
        <div className="flex-1 bg-white w-full flex items-center justify-center p-10">
          <div className="relative h-full aspect-square">
            <QRCodeSVG
              value={`https://qvisos.cl/q/${code}`}
              width="100%"
              height="100%"
              level="H"
              fgColor={activeColor.bg}
              imageSettings={{
                src: LOGO_URL,
                x: undefined,
                y: undefined,
                height: 150, // Ajustado para gran formato
                width: 150,
                excavate: true,
              }}
            />
          </div>
        </div>

        {/* PIE */}
        <div className="bg-black text-white w-full flex justify-between items-center px-12" style={{ height: '15%' }}>
           <div className="flex flex-col justify-center">
              <span className="uppercase text-gray-400 font-bold text-2xl">Escanea en:</span>
              <span className="font-bold" style={{ fontSize: '5vw' }}>Qvisos.cl</span>
           </div>
           <div className="text-right">
              <span className="uppercase text-gray-400 font-bold text-2xl">Código:</span>
              <p className="font-mono font-bold text-yellow-400 leading-none" style={{ fontSize: '8vw' }}>{code}</p>
           </div>
        </div>

      </div>
    </div>
  );
}

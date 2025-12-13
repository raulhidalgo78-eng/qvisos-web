"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";

// --- COMPONENTE INTERNO: CONTENIDO DEL ANUNCIO ---
function AdContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code"); // Ej: QV-060
  const typeParam = searchParams.get("tipo");

  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAd = async () => {
      if (!code) {
        setError("No se especificó un código de anuncio.");
        setLoading(false);
        return;
      }

      try {
        let foundAd = null;

        // ESTRATEGIA A: Buscar por campo 'id' (Visual ID ej: QV-060)
        // Nota: Asegúrate de que en tu BD el campo se llame 'id' o ajusta a 'visualId'
        const q = query(collection(db, "anuncios"), where("id", "==", code));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          foundAd = { firebaseId: docSnap.id, ...docSnap.data() };
        } else {
          // ESTRATEGIA B: Fallback buscar por ID de documento directo
          const docRef = doc(db, "anuncios", code);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            foundAd = { firebaseId: docSnap.id, ...docSnap.data() };
          }
        }

        if (foundAd) {
          setAd(foundAd);
        } else {
          setError("El anuncio no existe o fue eliminado.");
        }
      } catch (err) {
        console.error("Error buscando anuncio:", err);
        setError("Error de conexión al cargar el anuncio.");
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [code]);

  if (loading) return <div className="p-10 text-center text-blue-600 font-bold animate-pulse">Cargando QViso...</div>;

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow-sm text-center max-w-md">
        <h2 className="text-2xl font-bold mb-2">😕 Ups!</h2>
        <p>{error}</p>
        <a href="/" className="mt-4 inline-block text-blue-600 underline">Volver al inicio</a>
      </div>
    </div>
  );

  if (!ad) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white min-h-screen">

      {/* HEADER: Título y Precio */}
      <div className="border-b pb-4 mb-6">
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
          {ad.type || "Venta"}
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-2 uppercase font-oswald">
          {ad.title || "Anuncio sin título"}
        </h1>
        <p className="text-3xl font-bold text-blue-600 mt-2">
          ${parseInt(ad.price || 0).toLocaleString("es-CL")}
        </p>
        <p className="text-gray-500 text-sm mt-1">
          <i className="mr-1">📍</i> {ad.address || "Ubicación no especificada"}
        </p>
      </div>

      {/* GALERÍA DE FOTOS */}
      <div className="mb-8 bg-gray-100 rounded-xl overflow-hidden shadow-sm aspect-video relative">
        {ad.imageUrls && ad.imageUrls.length > 0 ? (
          <img
            src={ad.imageUrls[0]}
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <span>Sin fotos disponibles</span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">

        {/* COLUMNA IZQUIERDA: Detalles */}
        <div className="md:col-span-2 space-y-6">

          <div className="prose max-w-none">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Descripción</h3>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {ad.description || "Sin descripción detallada."}
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Detalles Técnicos</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {ad.brand && <div><span className="text-gray-500 block">Marca</span> <span className="font-bold">{ad.brand}</span></div>}
              {ad.model && <div><span className="text-gray-500 block">Modelo</span> <span className="font-bold">{ad.model}</span></div>}
              {ad.year && <div><span className="text-gray-500 block">Año</span> <span className="font-bold">{ad.year}</span></div>}
              {ad.kms && <div><span className="text-gray-500 block">Kilometraje</span> <span className="font-bold">{parseInt(ad.kms).toLocaleString()} km</span></div>}
              {ad.m2 && <div><span className="text-gray-500 block">Superficie</span> <span className="font-bold">{ad.m2} m²</span></div>}
              {ad.rooms && <div><span className="text-gray-500 block">Habitaciones</span> <span className="font-bold">{ad.rooms}</span></div>}
            </div>
          </div>

          {/* MAPA DE SOLO LECTURA */}
          {ad.lat && ad.lng && (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Ubicación Aproximada</h3>
              <ReadOnlyMap lat={ad.lat} lng={ad.lng} />
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: Contacto */}
        <div className="md:col-span-1">
          <div className="bg-white border rounded-xl shadow-lg p-6 sticky top-4">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-1">Precio Total</p>
              <span className="text-3xl font-black text-gray-900">
                ${parseInt(ad.price || 0).toLocaleString("es-CL")}
              </span>
            </div>

            <a
              href={`https://wa.me/?text=Hola, vi tu anuncio en QVisos (${code}) y me interesa.`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold text-center py-4 rounded-lg shadow-md transition-transform transform hover:-translate-y-1 mb-3"
            >
              Contactar por WhatsApp
            </a>

            <p className="text-xs text-center text-gray-400 mt-4">
              ID del Anuncio: <span className="font-mono text-gray-600">{code}</span>
            </p>
            <div className="mt-4 pt-4 border-t text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">Verificado por QVisos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE MAPA SOLO LECTURA ---
function ReadOnlyMap({ lat, lng }: { lat: any, lng: any }) {
  useEffect(() => {
    // Si la API de Google ya cargó en Layout, dibujamos un mapa simple
    if (window.google && document.getElementById('public-map')) {
      const map = new window.google.maps.Map(document.getElementById('public-map') as HTMLElement, {
        center: { lat: parseFloat(lat), lng: parseFloat(lng) },
        zoom: 15,
        disableDefaultUI: true,
        gestureHandling: 'cooperative'
      });
      new window.google.maps.Marker({
        position: { lat: parseFloat(lat), lng: parseFloat(lng) },
        map: map
      });
    }
  }, [lat, lng]);

  return (
    <div id="public-map" className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden border">
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
        Cargando mapa...
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL CON SUSPENSE ---
export default function AnuncioPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
      <AdContent />
    </Suspense>
  );
}
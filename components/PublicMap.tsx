"use client";

import { useEffect, useRef } from "react";

interface PublicMapProps {
    lat: string | number;
    lng: string | number;
}

/**
 * Componente de Mapa Cliente
 * Solo se encarga de pintar el mapa y el pin.
 * Recibe lat/lng desde el servidor.
 */
export default function PublicMap({ lat, lng }: PublicMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initMap = async () => {
            // Verificar si el motor global ya cargó (gracias al Script en layout.js)
            if (window.google && mapRef.current) {

                const position = { lat: parseFloat(lat.toString()), lng: parseFloat(lng.toString()) };

                // 1. Crear Mapa
                const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
                const map = new Map(mapRef.current, {
                    center: position,
                    zoom: 15,
                    disableDefaultUI: true, // Diseño limpio para vista pública
                    gestureHandling: "cooperative", // Mejor manejo en móviles
                    mapId: "PUBLIC_VIEW_MAP" // ID opcional para estilos
                });

                // 2. Poner Pin
                const { Marker } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
                new Marker({
                    position: position,
                    map: map,
                    title: "Ubicación Referencial"
                });
            }
        };

        // Intentar iniciar
        initMap();

        // Reintento de seguridad por si el script demora un poco más
        const interval = setInterval(() => {
            if (window.google) {
                initMap();
                clearInterval(interval);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [lat, lng]);

    return (
        <div
            ref={mapRef}
            className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden border shadow-inner"
        >
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm animate-pulse">
                Cargando mapa de ubicación...
            </div>
        </div>
    );
}

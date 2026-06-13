'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AdMapProps {
    lat: number;
    lng: number;
}

export default function AdMap({ lat, lng }: AdMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        let map: google.maps.Map;
        let circle: google.maps.Circle;

        const initMap = async () => {
            try {
                // 1. Cargar librerías de forma robusta
                const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;

                // 2. Inicializar el mapa
                map = new Map(mapRef.current!, {
                    center: { lat, lng },
                    zoom: 14, // Zoom suficiente para ver el barrio, pero no la casa exacta
                    mapId: "DEMO_MAP_ID", // Reemplazar con ID real si se tiene, o usar DEMO
                    disableDefaultUI: true, // Limpio, sin controles satélite/streetview
                    gestureHandling: 'cooperative', // Mejor UX en móvil
                });

                // 3. Inicializar Advanced Marker (Pin Exacto)
                // @ts-ignore
                const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

                new AdvancedMarkerElement({
                    map: map,
                    position: { lat, lng },
                    title: "Ubicación",
                });

            } catch (err) {
                console.error("Error al cargar el mapa:", err);
                setError("No se pudo cargar el mapa.");
            }
        };

        // Lógica de reintento robusta (igual que en RobustMapPicker)
        const checkGoogle = setInterval(() => {
            if (window.google && window.google.maps) {
                clearInterval(checkGoogle);
                initMap();
            }
        }, 100);

        // Timeout de seguridad (5 segundos)
        const timeout = setTimeout(() => {
            clearInterval(checkGoogle);
            if (!window.google) {
                setError("El servicio de mapas no está disponible.");
            }
        }, 5000);

        return () => {
            clearInterval(checkGoogle);
            clearTimeout(timeout);
        };
    }, [lat, lng]);

    if (error) {
        return (
            <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 text-sm">
                ⚠️ {error}
            </div>
        );
    }

    return (
        <div className="w-full h-80 rounded-xl overflow-hidden shadow-sm border border-gray-200 relative">
            <div ref={mapRef} className="w-full h-full" />
            {/* Overlay informativo */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-blue-800 shadow-sm border border-blue-100">
                📍 Ubicación del Anuncio
            </div>
        </div>
    );
}

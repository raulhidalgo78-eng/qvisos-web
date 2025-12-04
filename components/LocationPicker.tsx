'use client';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';

interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number) => void;
}

// Librerías necesarias (incluyendo 'marker' para la nueva versión)
const libraries: ("places" | "marker")[] = ["places", "marker"];

export default function LocationPicker({ onLocationSelect }: LocationPickerProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries: libraries,
    });

    // Centro por defecto (Santiago)
    const defaultCenter = useMemo(() => ({ lat: -33.4489, lng: -70.6693 }), []);

    // Referencia al mapa y al marcador
    const mapRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

    const [markerPosition, setMarkerPosition] = useState(defaultCenter);

    // Al cargar el mapa
    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    // Efecto para manejar el AdvancedMarkerElement
    useEffect(() => {
        if (mapRef.current && isLoaded) {
            // Si ya existe un marcador, actualizamos su posición
            if (markerRef.current) {
                markerRef.current.position = markerPosition;
            } else {
                // Si no, creamos uno nuevo (La nueva forma de Google)
                markerRef.current = new google.maps.marker.AdvancedMarkerElement({
                    map: mapRef.current,
                    position: markerPosition,
                    title: "Ubicación Seleccionada",
                    gmpDraggable: true, // Permitir arrastrar si se desea
                });

                // Evento al terminar de arrastrar (opcional, para UX avanzada)
                markerRef.current.addListener('dragend', (event: any) => {
                    const newLat = event.latLng.lat;
                    const newLng = event.latLng.lng;
                    setMarkerPosition({ lat: newLat, lng: newLng });
                    onLocationSelect(newLat, newLng);
                });
            }
        }
    }, [mapRef.current, isLoaded, markerPosition, onLocationSelect]);

    // Manejar clic en el mapa
    const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setMarkerPosition({ lat, lng });
            onLocationSelect(lat, lng);
        }
    }, [onLocationSelect]);

    console.log("🗺️ Google Maps Key Check:", process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "Loaded" : "Missing");

    if (loadError) {
        return (
            <div className="w-full h-[400px] bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center text-center p-4">
                <p className="text-red-600 font-bold mb-2">❌ Error cargando el Mapa</p>
                <p className="text-sm text-red-500">
                    Verifica que la API Key de Google Maps sea válida y tenga permisos.
                </p>
            </div>
        );
    }

    if (!isLoaded) return <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">Cargando Mapa...</div>;

    return (
        <div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-300">
            <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={defaultCenter}
                zoom={13}
                onLoad={onMapLoad}
                onClick={onMapClick}
                options={{
                    mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement
                    streetViewControl: false,
                    mapTypeControl: false,
                }}
            >
                {/* No <Marker /> component here, it's handled via useEffect and AdvancedMarkerElement */}
            </GoogleMap>
        </div>
    );
}

'use client';
import { useState, useMemo, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number) => void;
}

export default function LocationPicker({ onLocationSelect }: LocationPickerProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    });

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

    // Centro por defecto (Santiago de Chile)
    const defaultCenter = useMemo(() => ({ lat: -33.4489, lng: -70.6693 }), []);
    const [markerPosition, setMarkerPosition] = useState(defaultCenter);

    // Manejar clic en el mapa
    const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setMarkerPosition({ lat, lng });
            onLocationSelect(lat, lng);
        }
    }, [onLocationSelect]);

    if (!isLoaded) return <div>Cargando Mapa...</div>;

    return (
        <div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-300">
            <GoogleMap
                zoom={12}
                center={defaultCenter}
                mapContainerClassName="w-full h-full"
                onClick={onMapClick}
            >
                <Marker position={markerPosition} />
            </GoogleMap>
        </div>
    );
}

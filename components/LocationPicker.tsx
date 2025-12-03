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
        return <div>Error cargando Google Maps. Verifique la API Key.</div>;
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

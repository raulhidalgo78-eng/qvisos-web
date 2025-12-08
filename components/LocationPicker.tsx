'use client';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';

interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number) => void;
}

const libraries: ("places" | "marker")[] = ["places", "marker"];

export default function LocationPicker({ onLocationSelect }: LocationPickerProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries: libraries,
    });

    const defaultCenter = useMemo(() => ({ lat: -33.4489, lng: -70.6693 }), []);

    // Use 'selected' to track the current position
    const [selected, setSelected] = useState(defaultCenter);

    const mapRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    // Initialize Google Maps Autocomplete Widget
    useEffect(() => {
        if (isLoaded && inputRef.current && !autocompleteRef.current) {
            // Create the Autocomplete widget
            const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
                componentRestrictions: { country: 'cl' },
                fields: ['geometry', 'name', 'formatted_address'], // Explicitly request fields to avoid errors/costs
            });

            autocompleteRef.current = autocomplete;

            // Add event listener
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();

                if (!place.geometry || !place.geometry.location) {
                    console.warn("No details available for input: '" + place.name + "'");
                    return;
                }

                // Defensive validation for coordinates
                const rawLat = place.geometry.location.lat();
                const rawLng = place.geometry.location.lng();

                const lat = typeof rawLat === 'function' ? Number((rawLat as any)()) : Number(rawLat);
                const lng = typeof rawLng === 'function' ? Number((rawLng as any)()) : Number(rawLng);

                const newPos = { lat, lng };

                setSelected(newPos);
                onLocationSelect(lat, lng);

                if (mapRef.current) {
                    mapRef.current.panTo(newPos);
                    mapRef.current.setZoom(15);
                }
            });
        }
    }, [isLoaded, onLocationSelect]);

    // Efecto para manejar el AdvancedMarkerElement
    useEffect(() => {
        if (mapRef.current && isLoaded) {
            if (markerRef.current) {
                markerRef.current.position = selected;
            } else {
                markerRef.current = new google.maps.marker.AdvancedMarkerElement({
                    map: mapRef.current,
                    position: selected,
                    title: "Ubicación Seleccionada",
                    gmpDraggable: true,
                });

                markerRef.current.addListener('dragend', (event: any) => {
                    const rawLat = event.latLng.lat;
                    const rawLng = event.latLng.lng;

                    // Defensive validation for drag events too
                    const newLat = typeof rawLat === 'function' ? Number(rawLat()) : Number(rawLat);
                    const newLng = typeof rawLng === 'function' ? Number(rawLng()) : Number(rawLng);

                    setSelected({ lat: newLat, lng: newLng });
                    onLocationSelect(newLat, newLng);
                });
            }
        }
    }, [mapRef.current, isLoaded, selected, onLocationSelect]);

    const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            // Defensive validation for click events
            const rawLat = e.latLng.lat;
            const rawLng = e.latLng.lng;

            const lat = typeof rawLat === 'function' ? Number(rawLat.call(e.latLng)) : Number(rawLat);
            const lng = typeof rawLng === 'function' ? Number(rawLng.call(e.latLng)) : Number(rawLng);

            setSelected({ lat, lng });
            onLocationSelect(lat, lng);
        }
    }, [onLocationSelect]);

    if (loadError) return <div>Error cargando mapa</div>;
    if (!isLoaded) return <div>Cargando Mapa...</div>;

    return (
        <div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-300 relative">
            {/* Input for Autocomplete */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-[90%] max-w-md">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="🔍 Buscar dirección..."
                    className="w-full p-3 rounded-lg shadow-lg border-0 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <GoogleMap
                zoom={13}
                center={selected}
                mapContainerClassName="w-full h-full"
                onClick={onMapClick}
                onLoad={onMapLoad}
                options={{
                    mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement
                    disableDefaultUI: false,
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false
                }}
            >
                {/* AdvancedMarkerElement is handled by useEffect */}
            </GoogleMap>
            <div className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded shadow text-xs text-gray-500">
                📍 Lat: {selected.lat.toFixed(5)}, Lng: {selected.lng.toFixed(5)}
            </div>
        </div>
    );
}

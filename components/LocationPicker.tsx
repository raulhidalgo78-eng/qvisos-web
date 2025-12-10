'use client';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';

interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLat?: number;
    initialLng?: number;
}

// We don't need to load 'places' in libraries array if we use importLibrary, 
// but keeping it for safety for other components.
const libraries: ("places" | "marker")[] = ["places", "marker"];

export default function LocationPicker({ onLocationSelect, initialLat, initialLng }: LocationPickerProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries: libraries,
        version: 'weekly', // Ensure we get the latest version with PlaceAutocompleteElement support
    });

    const defaultCenter = useMemo(() => ({
        lat: initialLat || -33.4489,
        lng: initialLng || -70.6693
    }), [initialLat, initialLng]);

    // Use 'selected' to track the current position
    const [selected, setSelected] = useState(defaultCenter);

    const mapRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
    const autocompleteContainerRef = useRef<HTMLDivElement>(null);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    // Initialize Autocomplete (Old API as requested for stability)
    useEffect(() => {
        if (isLoaded && autocompleteContainerRef.current) {
            // Create input element if it doesn't exist
            let input = autocompleteContainerRef.current.querySelector('input');
            if (!input) {
                input = document.createElement('input');
                input.type = 'text';
                input.placeholder = 'Buscar dirección...';
                input.className = 'w-full h-12 px-4 rounded-lg shadow-lg border-0 focus:ring-2 focus:ring-blue-500';
                autocompleteContainerRef.current.appendChild(input);
            }

            const options = {
                fields: ["address_components", "geometry", "icon", "name", "formatted_address"],
                types: ["address"],
                componentRestrictions: { country: "cl" },
            };

            const autocomplete = new google.maps.places.Autocomplete(input, options);

            autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                if (!place.geometry || !place.geometry.location) return;

                // Fix para evitar error "toFixed is not a function"
                const latVal = place.geometry.location.lat;
                const lngVal = place.geometry.location.lng;

                const lat = typeof latVal === 'function' ? latVal() : Number(latVal);
                const lng = typeof lngVal === 'function' ? lngVal() : Number(lngVal);

                // Guarda 'lat' y 'lng' en el estado del formulario ahora.
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
            const initMarker = async () => {
                try {
                    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

                    if (markerRef.current) {
                        markerRef.current.position = selected;
                    } else {
                        markerRef.current = new AdvancedMarkerElement({
                            map: mapRef.current,
                            position: selected,
                            title: "Ubicación Seleccionada",
                            gmpDraggable: true,
                        });

                        markerRef.current.addListener('dragend', (event: any) => {
                            const rawLat = event.latLng.lat;
                            const rawLng = event.latLng.lng;

                            // Defensive validation
                            const newLat = typeof rawLat === 'function' ? Number(rawLat()) : Number(rawLat);
                            const newLng = typeof rawLng === 'function' ? Number(rawLng()) : Number(rawLng);

                            setSelected({ lat: newLat, lng: newLng });
                            onLocationSelect(newLat, newLng);
                        });
                    }
                } catch (e) {
                    console.error("Error loading marker library:", e);
                }
            };
            initMarker();
        }
    }, [mapRef.current, isLoaded, selected, onLocationSelect]);

    const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
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
            {/* Container for PlaceAutocompleteElement */}
            <div
                ref={autocompleteContainerRef}
                className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-[90%] max-w-md bg-white rounded-lg shadow-xl"
            ></div>

            <GoogleMap
                zoom={13}
                center={selected}
                mapContainerClassName="w-full h-full"
                onClick={onMapClick}
                onLoad={onMapLoad}
                options={{
                    mapId: "DEMO_MAP_ID",
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

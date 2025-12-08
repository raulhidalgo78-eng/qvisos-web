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
    const autocompleteRef = useRef<HTMLDivElement>(null);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    // Initialize PlaceAutocompleteElement (New API)
    useEffect(() => {
        if (isLoaded && autocompleteRef.current) {
            // Check if element already exists to avoid duplicates
            if (autocompleteRef.current.firstChild) return;

            // @ts-ignore - PlaceAutocompleteElement might not be in types yet
            const autocomplete = new google.maps.places.PlaceAutocompleteElement();

            // Configure autocomplete
            // @ts-ignore
            autocomplete.componentRestrictions = { country: ['cl'] };
            autocomplete.classList.add('w-full', 'shadow-lg', 'rounded-lg', 'h-12', 'px-4'); // Added height and padding for better UI

            // Append to container
            autocompleteRef.current.appendChild(autocomplete);

            // Add event listener
            autocomplete.addEventListener('gmp-places-select', async (event: any) => {
                const place = event.place;
                if (!place) return;

                // Fetch location details using the NEW API field names
                // Note: The new Place class uses camelCase for fields
                await place.fetchFields({
                    fields: ['location', 'displayName', 'formattedAddress', 'addressComponents']
                });

                if (place.location) {
                    const lat = place.location.lat();
                    const lng = place.location.lng();
                    const newPos = { lat, lng };

                    setSelected(newPos);
                    onLocationSelect(lat, lng);

                    if (mapRef.current) {
                        mapRef.current.panTo(newPos);
                        mapRef.current.setZoom(15);
                    }
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
            {/* Container for PlaceAutocompleteElement */}
            <div
                ref={autocompleteRef}
                className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-[90%] max-w-md bg-white rounded-lg shadow-xl"
            ></div>

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

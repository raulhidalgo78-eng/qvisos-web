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

    // Initialize PlaceAutocompleteElement (New API)
    useEffect(() => {
        if (isLoaded && autocompleteContainerRef.current) {
            const initAutocomplete = async () => {
                try {
                    // Import Places Library
                    // @ts-ignore
                    const { PlaceAutocompleteElement } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

                    // Create element if not exists
                    if (!autocompleteContainerRef.current) return;
                    let autocompleteElement = autocompleteContainerRef.current.querySelector('gmp-place-autocomplete') as any;

                    if (!autocompleteElement) {
                        autocompleteElement = new PlaceAutocompleteElement();
                        autocompleteElement.id = 'place-autocomplete-input';
                        autocompleteElement.className = 'w-full h-12'; // Tailwind classes might not apply directly to shadow DOM, but useful for container

                        // Append to container
                        autocompleteContainerRef.current.appendChild(autocompleteElement);
                    }

                    // Configure element
                    // @ts-ignore - Types might be missing for new element
                    autocompleteElement.componentRestrictions = { country: ['cl'] };
                    // @ts-ignore
                    autocompleteElement.types = ['address'];
                    // @ts-ignore
                    autocompleteElement.fields = ['location', 'formattedAddress', 'addressComponents', 'displayName'];

                    // Add Event Listener
                    autocompleteElement.addEventListener('gmp-places-select', async ({ place }: any) => {
                        if (!place || !place.location) return;

                        // Robust Lat/Lng Extraction
                        const rawLat = place.location.lat;
                        const rawLng = place.location.lng;

                        const lat = typeof rawLat === 'function' ? Number(rawLat()) : Number(rawLat);
                        const lng = typeof rawLng === 'function' ? Number(rawLng()) : Number(rawLng);

                        const newPos = { lat, lng };
                        setSelected(newPos);
                        onLocationSelect(lat, lng);

                        if (mapRef.current) {
                            mapRef.current.panTo(newPos);
                            mapRef.current.setZoom(15);
                        }
                    });

                } catch (e) {
                    console.error("Error initializing PlaceAutocompleteElement:", e);
                }
            };

            initAutocomplete();
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

'use client';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

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

    // Use 'selected' to track the current position (replaces markerPosition)
    const [selected, setSelected] = useState(defaultCenter);

    const mapRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

    // --- COMPONENTE DE BÚSQUEDA INTERNO ---
    const SearchBox = () => {
        const {
            ready,
            value,
            setValue,
            suggestions: { status, data },
            clearSuggestions,
        } = usePlacesAutocomplete({
            requestOptions: {
                componentRestrictions: { country: 'cl' }, // Restringir a Chile
            },
        });

        const handleSelect = async (address: string) => {
            setValue(address, false);
            clearSuggestions();
            try {
                const results = await getGeocode({ address });
                const { lat: rawLat, lng: rawLng } = await getLatLng(results[0]);

                // Defensive validation: Ensure it's a number
                const lat = typeof rawLat === 'function' ? Number((rawLat as any)()) : Number(rawLat);
                const lng = typeof rawLng === 'function' ? Number((rawLng as any)()) : Number(rawLng);

                const newPos = { lat, lng };

                setSelected(newPos);
                onLocationSelect(lat, lng);
                mapRef.current?.panTo(newPos);
                mapRef.current?.setZoom(15);
            } catch (error) {
                console.error("Error buscando dirección:", error);
            }
        };

        return (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-[90%] max-w-md">
                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={!ready}
                    className="w-full p-3 rounded-lg shadow-lg border-0 text-gray-800 focus:ring-2 focus:ring-blue-500"
                    placeholder="🔍 Buscar dirección..."
                />
                {status === "OK" && (
                    <ul className="bg-white rounded-lg shadow-xl mt-1 overflow-hidden max-h-60 overflow-y-auto">
                        {data.map(({ place_id, description }) => (
                            <li
                                key={place_id}
                                onClick={() => handleSelect(description)}
                                className="p-3 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-b-0"
                            >
                                {description}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    };
    // -------------------------------------

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    // Efecto para manejar el AdvancedMarkerElement (Manteniendo la modernización)
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
            <SearchBox />
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

'use client';

import { useEffect, useRef, useState } from 'react';

interface RobustMapPickerProps {
    onLocationSelect: (data: { lat: number; lng: number; address?: string; city?: string; region?: string }) => void;
    initialLat?: number;
    initialLng?: number;
    initialAddress?: string;
}

export default function RobustMapPicker({ onLocationSelect, initialLat, initialLng, initialAddress }: RobustMapPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let googleMap: google.maps.Map | null = null;
        let marker: google.maps.marker.AdvancedMarkerElement | null = null;
        let autocomplete: google.maps.places.Autocomplete | null = null;

        const init = async () => {
            try {
                if (!window.google) return;

                // 1. Configurar Coordenadas Iniciales (Santiago Default)
                const startLat = initialLat ? Number(initialLat) : -33.4489;
                const startLng = initialLng ? Number(initialLng) : -70.6693;
                const position = { lat: startLat, lng: startLng };

                // 2. Importar Librerías (Maps JavaScript API v3.58+)
                // @ts-ignore
                const { Map } = await google.maps.importLibrary("maps");
                // @ts-ignore
                const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
                // @ts-ignore
                const { Autocomplete } = await google.maps.importLibrary("places");

                if (!mapRef.current || !inputRef.current) return;

                // 3. Inicializar Mapa
                googleMap = new Map(mapRef.current, {
                    center: position,
                    zoom: 15,
                    mapId: "QVISOS_MAP_ID", // Required for AdvancedMarker
                    mapTypeControl: false,
                    streetViewControl: false,
                });

                // 4. Inicializar Advanced Marker con Pin Arrastrable
                marker = new AdvancedMarkerElement({
                    map: googleMap,
                    position: position,
                    gmpDraggable: true, // Propiedad mágica para drag
                    title: "Arrastrame para ajustar"
                });

                // Listener para el Drag (Evento DOM estándar 'dragend')
                marker!.addListener('dragend', () => {
                    const newPos = marker!.position as google.maps.LatLngLiteral;
                    if (newPos) {
                        // Solo actualizamos lat/lng, mantenemos la dirección visual (o "Ubicación ajustada manualmente")
                        onLocationSelect({
                            lat: newPos.lat,
                            lng: newPos.lng
                            // No enviamos address/city/region aquí para no sobrescribir la dirección escrita si solo fue un ajuste fino
                        });
                    }
                });

                // 5. Inicializar Autocomplete para Chile
                autocomplete = new Autocomplete(inputRef.current, {
                    fields: ["geometry", "formatted_address", "address_components", "name"],
                    componentRestrictions: { country: "cl" },
                });
                autocomplete!.bindTo("bounds", googleMap!);

                // Listener para selección de dirección
                autocomplete!.addListener("place_changed", () => {
                    const place = autocomplete!.getPlace();

                    if (!place.geometry || !place.geometry.location) {
                        return; // No details available
                    }

                    // Centrar Mapa
                    if (place.geometry.viewport) {
                        googleMap!.fitBounds(place.geometry.viewport);
                    } else {
                        googleMap!.setCenter(place.geometry.location);
                        googleMap!.setZoom(17);
                    }

                    // Mover Marker
                    marker!.position = place.geometry.location;

                    // Extraer City y Region
                    let city = '';
                    let region = '';
                    if (place.address_components) {
                        for (const component of place.address_components) {
                            const types = component.types;
                            if (types.includes('locality')) {
                                city = component.long_name;
                            }
                            if (types.includes('administrative_area_level_1')) {
                                region = component.long_name;
                            }
                            // Fallback para Santiago si locality no está (pasa en algunas comunas)
                            if (!city && types.includes('administrative_area_level_2')) {
                                city = component.long_name; // Provincia como fallback
                            }
                        }
                    }

                    // Enviar datos completos
                    onLocationSelect({
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        address: place.formatted_address,
                        city,
                        region
                    });
                });

            } catch (err) {
                console.error("Error iniciando mapa avanzado:", err);
                setError("No se pudo cargar Google Maps. Intenta recargar.");
            }
        };

        const checker = setInterval(() => {
            if (window.google) {
                clearInterval(checker);
                init();
            }
        }, 200);

        return () => clearInterval(checker);
    }, []);

    return (
        <div className="space-y-3 w-full">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Buscar Dirección (Chile)</label>
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                    placeholder="Escribe tu dirección y selecciona de la lista..."
                    defaultValue={initialAddress}
                />
            </div>

            <div
                ref={mapRef}
                className="w-full h-[300px] rounded-lg border border-gray-300 bg-gray-100 shadow-inner relative z-0"
            ></div>
            <p className="text-xs text-gray-500 text-center">💡 Tip: Puedes arrastrar el pin rojo para ajustar la ubicación exacta.</p>

            {error && <p className="text-red-600 text-sm font-bold">{error}</p>}
        </div>
    );
}

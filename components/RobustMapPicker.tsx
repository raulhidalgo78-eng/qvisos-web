import { useEffect, useRef, useState } from 'react';

interface RobustMapPickerProps {
    onLocationSelect: (data: { lat: number; lng: number; address?: string }) => void;
    initialLat?: number;
    initialLng?: number;
    initialAddress?: string;
}

export default function RobustMapPicker({ onLocationSelect, initialLat, initialLng, initialAddress }: RobustMapPickerProps) {
    const mapDivRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [mapError, setMapError] = useState<string | null>(null);

    useEffect(() => {
        const initMap = async () => {
            try {
                if (!mapDivRef.current || !inputRef.current) return;

                // 1. Cargar librerías necesarias
                // @ts-ignore
                const { Map } = await google.maps.importLibrary("maps");
                // @ts-ignore
                const { Autocomplete } = await google.maps.importLibrary("places");
                // @ts-ignore
                const { Marker } = await google.maps.importLibrary("marker");

                // 2. Coordenadas iniciales (Santiago por defecto si no hay datos)
                const defaultPos = { lat: -33.4489, lng: -70.6693 };
                const startPos = (initialLat && initialLng)
                    ? { lat: Number(initialLat), lng: Number(initialLng) }
                    : defaultPos;

                // 3. Inicializar Mapa Visual
                const map = new Map(mapDivRef.current, {
                    center: startPos,
                    zoom: 15,
                    mapId: "DEMO_MAP_ID", // Necesario para marcadores avanzados
                    streetViewControl: false,
                    mapTypeControl: false,
                });

                // 4. Inicializar Marcador
                const marker = new Marker({
                    map: map,
                    position: startPos,
                    draggable: true, // ¡Permitir arrastrar el pin!
                    title: "Ubicación seleccionada"
                });

                // 5. Inicializar Autocomplete (Input estándar)
                const autocomplete = new Autocomplete(inputRef.current, {
                    fields: ["geometry", "formatted_address", "name"],
                    componentRestrictions: { country: "cl" },
                });

                // Vincular input al mapa
                autocomplete.bindTo("bounds", map);

                // --- EVENTOS ---

                // A) Cuando seleccionan una dirección en el buscador
                autocomplete.addListener("place_changed", () => {
                    const place = autocomplete.getPlace();
                    if (!place.geometry || !place.geometry.location) return;

                    // Mover mapa y pin
                    if (place.geometry.viewport) {
                        map.fitBounds(place.geometry.viewport);
                    } else {
                        map.setCenter(place.geometry.location);
                        map.setZoom(17);
                    }
                    marker.setPosition(place.geometry.location);

                    // Guardar datos
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    onLocationSelect({ lat, lng, address: place.formatted_address });
                });

                // B) Cuando arrastran el pin manualmente
                marker.addListener("dragend", async () => {
                    const pos = marker.getPosition();
                    const lat = pos.lat();
                    const lng = pos.lng();

                    console.log("Pin arrastrado a:", lat, lng);
                    // Actualiza coord, mantiene dirección previa (o se podría hacer reverse geocoding)
                    onLocationSelect({ lat, lng });
                });

            } catch (e) {
                console.error("Error iniciando mapa:", e);
                setMapError("No se pudo cargar el mapa. Verifica tu API Key.");
            }
        };

        // Esperar a que Google esté disponible
        const interval = setInterval(() => {
            if (window.google) {
                clearInterval(interval);
                initMap();
            }
        }, 100);

        return () => clearInterval(interval);
    }, []); // Ejecutar solo al montar

    return (
        <div className="w-full space-y-3">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Dirección</label>
                <input
                    ref={inputRef}
                    type="text"
                    defaultValue={initialAddress}
                    className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Escribe tu dirección aquí..."
                />
            </div>

            {/* Contenedor del Mapa Visual */}
            <div
                ref={mapDivRef}
                className="w-full h-[300px] rounded-lg border border-gray-300 shadow-inner bg-gray-100"
            ></div>

            {mapError && <p className="text-red-500 text-sm">{mapError}</p>}
        </div>
    );
}

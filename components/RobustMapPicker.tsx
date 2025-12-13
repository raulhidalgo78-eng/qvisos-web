import { useEffect, useRef, useState } from 'react';

interface RobustMapPickerProps {
    onLocationSelect: (data: { lat: number; lng: number; address?: string }) => void;
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
        let marker: google.maps.Marker | null = null;
        let autocomplete: google.maps.places.Autocomplete | null = null;

        const init = async () => {
            try {
                if (!window.google) return; // Esperar a que cargue el script global

                // 1. Configurar Coordenadas Iniciales
                // Si no hay coords, usar Santiago Centro por defecto
                const startLat = initialLat ? Number(initialLat) : -33.4489;
                const startLng = initialLng ? Number(initialLng) : -70.6693;
                const position = { lat: startLat, lng: startLng };

                // 2. Inicializar Mapa Visual (Standard API v3)
                // @ts-ignore
                const { Map } = await google.maps.importLibrary("maps");
                // @ts-ignore
                const { Marker } = await google.maps.importLibrary("marker");
                // @ts-ignore
                const { Autocomplete } = await google.maps.importLibrary("places");

                if (!mapRef.current || !inputRef.current) return;

                googleMap = new Map(mapRef.current, {
                    center: position,
                    zoom: 15,
                    mapId: "QVISOS_MAP_ID", // ID arbitrario para evitar warnings
                    mapTypeControl: false,
                    streetViewControl: false,
                });

                // 3. Inicializar Pin Arrastrable
                marker = new Marker({
                    position: position,
                    map: googleMap,
                    draggable: true,
                    title: "Ubicación del vehículo"
                });

                // 4. Inicializar Input de Texto (El clásico, robusto)
                // NOTA: Usamos el inputRef que apunta a un input HTML normal
                autocomplete = new Autocomplete(inputRef.current, {
                    fields: ["geometry", "formatted_address", "name"],
                    componentRestrictions: { country: "cl" },
                });
                autocomplete!.bindTo("bounds", googleMap!);

                // --- LISTENERS (La lógica de conexión) ---

                // A) Cuando el usuario selecciona una dirección del menú
                autocomplete.addListener("place_changed", () => {
                    const place = autocomplete!.getPlace();

                    if (!place.geometry || !place.geometry.location) {
                        // El usuario apretó enter sin seleccionar nada
                        return;
                    }

                    // Actualizar mapa y pin
                    if (place.geometry.viewport) {
                        googleMap!.fitBounds(place.geometry.viewport);
                    } else {
                        googleMap!.setCenter(place.geometry.location);
                        googleMap!.setZoom(17);
                    }
                    marker!.setPosition(place.geometry.location);

                    // Enviar datos al padre
                    onLocationSelect({
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        address: place.formatted_address
                    });
                });

                // B) Cuando el usuario arrastra el pin manualmente
                marker.addListener("dragend", () => {
                    const newPos = marker!.getPosition();
                    if (!newPos) return;
                    const lat = newPos.lat();
                    const lng = newPos.lng();

                    // Actualizamos coordenadas, mantenemos la dirección visual anterior (o podrías hacer geocoding inverso)
                    onLocationSelect({ lat, lng });
                });

            } catch (err) {
                console.error("Error iniciando mapa robusto:", err);
                setError("Error cargando el mapa. Verifica tu conexión.");
            }
        };

        // Sistema de reintento seguro para esperar a Google
        const checker = setInterval(() => {
            if (window.google) {
                clearInterval(checker);
                init();
            }
        }, 200);

        return () => clearInterval(checker);
    }, []); // Ejecutar solo una vez al montar

    return (
        <div className="space-y-3 w-full">
            {/* INPUT HTML ESTÁNDAR: Siempre funciona, siempre deja escribir */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Buscar Dirección</label>
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                    placeholder="Ej: Av. Apoquindo 4000..."
                    defaultValue={initialAddress}
                />
            </div>

            {/* DIV DEL MAPA VISUAL */}
            <div
                ref={mapRef}
                className="w-full h-[300px] rounded-lg border border-gray-300 bg-gray-100 shadow-inner"
            ></div>

            {error && <p className="text-red-600 text-sm font-bold">{error}</p>}
        </div>
    );
}

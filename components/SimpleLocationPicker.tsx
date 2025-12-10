import { useEffect, useRef, useState } from 'react';

interface SimpleLocationPickerProps {
    onLocationSelect: (data: { lat: number; lng: number; address: string }) => void;
    initialAddress?: string;
}

export default function SimpleLocationPicker({ onLocationSelect, initialAddress }: SimpleLocationPickerProps) {
    const inputContainerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 1. Cargar la librería moderna de forma segura
        const initPicker = async () => {
            try {
                if (!inputContainerRef.current) return;

                // Importar librería Places
                // @ts-ignore
                const { PlaceAutocompleteElement } = await google.maps.importLibrary("places");

                // Crear el elemento nativo
                const autocomplete = new PlaceAutocompleteElement();

                // Configuración Minimalista
                autocomplete.id = 'simple-location-picker';
                autocomplete.className = 'w-full h-12 border rounded-md px-3'; // Basic styling

                // Limpiar contenedor y agregar el nuevo input
                inputContainerRef.current.innerHTML = '';
                inputContainerRef.current.appendChild(autocomplete);

                // Listener del evento moderno 'gmp-places-select' (Corrected from user's 'gmp-placeselect')
                autocomplete.addEventListener('gmp-places-select', async ({ place }: any) => {
                    // Solicitar campos explícitamente (OBLIGATORIO)
                    await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });

                    const lat = place.location.lat();
                    const lng = place.location.lng();
                    const address = place.formattedAddress;

                    console.log("📍 Ubicación seleccionada:", address, lat, lng);

                    // Pasar datos al padre
                    onLocationSelect({ lat, lng, address });
                });

            } catch (err) {
                console.error("Error mapa:", err);
                setError("Error cargando mapa. Recarga la página.");
            }
        };

        initPicker();
    }, [onLocationSelect]);

    return (
        <div className="w-full">
            <label className="block text-sm font-medium mb-1">Buscar Dirección (Google Maps)</label>
            {/* Contenedor donde Google inyectará su input moderno */}
            <div ref={inputContainerRef} className="h-12 w-full border rounded-md overflow-hidden bg-white"></div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

            {initialAddress && (
                <p className="text-xs text-gray-500 mt-2">Ubicación actual: {initialAddress}</p>
            )}
        </div>
    );
}

import { useEffect, useRef, useState } from 'react';

interface SimpleLocationPickerProps {
    onLocationSelect: (data: { lat: number; lng: number; address: string }) => void;
    initialAddress?: string;
}

export default function SimpleLocationPicker({ onLocationSelect, initialAddress }: SimpleLocationPickerProps) {
    const inputContainerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Función segura que espera a que Google Maps esté listo
        const initPicker = async () => {
            try {
                if (!inputContainerRef.current) return;

                // 1. Esto carga la librería 'places' y espera a que 'google' exista.
                // @ts-ignore
                const { PlaceAutocompleteElement } = await google.maps.importLibrary("places");

                // 2. Crear el elemento nativo
                const autocomplete = new PlaceAutocompleteElement();

                // 3. Limpiar contenedor y agregar el nuevo input
                inputContainerRef.current.innerHTML = '';
                inputContainerRef.current.appendChild(autocomplete);

                // 4. Listener del evento moderno 'gmp-places-select'
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
                console.error("Error cargando mapa:", err);
                setError("Error cargando el buscador de mapas. Verifica tu conexión.");
            }
        };

        // Pequeño timeout para asegurar que el script base de index.html haya iniciado
        setTimeout(() => {
            if (window.google) {
                initPicker();
            } else {
                // Si google no está en window, asumimos que se cargará pronto o hay un error de API Key
                const interval = setInterval(() => {
                    if (window.google) {
                        clearInterval(interval);
                        initPicker();
                    }
                }, 500);
            }
        }, 100);

    }, [onLocationSelect]);

    return (
        <div className="w-full">
            <label className="block text-sm font-medium mb-1">Ubicación (Google Maps)</label>
            {/* Contenedor donde Google inyectará su input moderno */}
            <div ref={inputContainerRef} className="place-picker-container h-12 w-full mb-2 border rounded-md overflow-hidden bg-white"></div>

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

            {initialAddress && (
                <p className="text-xs text-gray-500">Ubicación guardada previamente: {initialAddress}</p>
            )}
        </div>
    );
}

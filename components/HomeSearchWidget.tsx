'use client';
import { useRouter } from 'next/navigation';

export default function HomeSearchWidget() {
    const router = useRouter();

    const goTo = (path: string) => router.push(path);

    return (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto -mt-8 relative z-10 border border-gray-100 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">

            {/* Opción 1: Autos */}
            <button
                onClick={() => goTo('/buscar?category=Autos')}
                className="group flex-1 flex flex-col items-center justify-center p-6 hover:bg-blue-50 transition-all"
            >
                <div className="bg-blue-100 text-blue-600 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">🚗</span>
                </div>
                <h3 className="font-bold text-gray-800 text-lg">Comprar Auto</h3>
                <p className="text-xs text-gray-500 mt-1">Ver todos los vehículos</p>
            </button>

            {/* Opción 2: Propiedades Venta */}
            <button
                onClick={() => goTo('/buscar?category=Propiedades&operacion=Venta')}
                className="group flex-1 flex flex-col items-center justify-center p-6 hover:bg-green-50 transition-all"
            >
                <div className="bg-green-100 text-green-600 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">🏡</span>
                </div>
                <h3 className="font-bold text-gray-800 text-lg">Comprar Propiedad</h3>
                <p className="text-xs text-gray-500 mt-1">Casas, Deptos, Parcelas</p>
            </button>

            {/* Opción 3: Arriendo */}
            <button
                onClick={() => goTo('/buscar?category=Propiedades&operacion=Arriendo')}
                className="group flex-1 flex flex-col items-center justify-center p-6 hover:bg-orange-50 transition-all"
            >
                <div className="bg-orange-100 text-orange-600 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">🔑</span>
                </div>
                <h3 className="font-bold text-gray-800 text-lg">Arrendar</h3>
                <p className="text-xs text-gray-500 mt-1">Ver alquileres disponibles</p>
            </button>
        </div>
    );
}

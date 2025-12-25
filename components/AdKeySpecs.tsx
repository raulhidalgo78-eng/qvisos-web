import { Bed, Bath, Ruler, Car, Calendar, Gauge, Fuel, Cog, Warehouse, Home } from 'lucide-react';

interface Props {
    category: string;
    features: any;
}

export default function AdKeySpecs({ category, features }: Props) {
    if (!features) return null;

    const SpecItem = ({ icon: Icon, label, value }: any) => (
        <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100 text-center transition-all hover:bg-white hover:shadow-sm">
            <div className="text-gray-700 mb-2">
                <Icon size={24} strokeWidth={1.5} />
            </div>
            <span className="text-gray-900 font-bold text-lg leading-none mb-1">{value || '-'}</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</span>
        </div>
    );

    const isAuto = category?.toLowerCase().includes('auto') || category?.toLowerCase() === 'vehiculos';
    const isProp = !isAuto;

    return (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-8 w-full">
            {/* --- AUTOS --- */}
            {isAuto && (
                <>
                    <SpecItem icon={Calendar} label="Año" value={features.anio} />
                    <SpecItem icon={Gauge} label="Kms" value={features.kilometraje ? `${Number(features.kilometraje).toLocaleString('es-CL')} km` : null} />
                    <SpecItem icon={Fuel} label="Combustible" value={features.combustible} />
                    <SpecItem icon={Cog} label="Transmisión" value={features.transmision} />
                    {/* Optional 5th item */}
                    {features.duenos && <SpecItem icon={Car} label="Dueños" value={features.duenos} />}
                </>
            )}

            {/* --- PROPIEDADES --- */}
            {isProp && (
                <>
                    <SpecItem icon={Bed} label="Dormitorios" value={features.dormitorios} />
                    <SpecItem icon={Bath} label="Baños" value={features.banos} />
                    <SpecItem icon={Ruler} label="M² Totales" value={features.m2_totales ? `${features.m2_totales}` : null} />
                    <SpecItem icon={Ruler} label="M² Útiles" value={features.m2_utiles ? `${features.m2_utiles}` : null} />
                    <SpecItem icon={Car} label="Estac." value={features.estacionamientos || '0'} />
                </>
            )}
        </div>
    );
}

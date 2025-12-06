import { FaBed, FaBath, FaRulerCombined, FaCar, FaCalendarAlt, FaTachometerAlt, FaGasPump, FaCogs, FaWarehouse, FaHome } from 'react-icons/fa';

export default function KeyFeaturesGrid({ category, features }: { category: string, features: any }) {
    if (!features) return null;

    const FeatureItem = ({ icon, label, value }: any) => (
        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
            <div className="text-blue-600 text-2xl mb-2">
                {icon}
            </div>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</span>
            <span className="text-gray-900 font-bold mt-1">{value || '-'}</span>
        </div>
    );

    return (
        <div className="grid grid-cols-3 gap-4 mb-8">
            {/* --- LÓGICA PARA AUTOS --- */}
            {(category === 'Autos' || category === 'autos') && (
                <>
                    <FeatureItem icon={<FaCalendarAlt />} label="Año" value={features.anio} />
                    <FeatureItem icon={<FaTachometerAlt />} label="Kms" value={features.kilometraje ? `${features.kilometraje} km` : null} />
                    <FeatureItem icon={<FaGasPump />} label="Combustible" value={features.combustible} />
                    <FeatureItem icon={<FaCogs />} label="Transmisión" value={features.transmision} />
                    <FeatureItem icon={<FaCar />} label="Marca" value={features.marca} />
                    <FeatureItem icon={<FaCar />} label="Modelo" value={features.modelo} />
                </>
            )}

            {/* --- LÓGICA PARA PROPIEDADES --- */}
            {(category === 'Propiedades' || category === 'inmuebles') && (
                <>
                    <FeatureItem icon={<FaRulerCombined />} label="M² Útiles" value={features.m2_utiles ? `${features.m2_utiles} m²` : null} />
                    <FeatureItem icon={<FaBed />} label="Dormitorios" value={features.dormitorios} />
                    <FeatureItem icon={<FaBath />} label="Baños" value={features.banos} />
                    {/* Mostramos Estacionamiento o M2 Totales según disponibilidad */}
                    {features.estacionamientos > 0 ? (
                        <FeatureItem icon={<FaCar />} label="Estac." value={features.estacionamientos} />
                    ) : (
                        <FeatureItem icon={<FaWarehouse />} label="Bodega" value={features.bodegas > 0 ? 'Sí' : 'No'} />
                    )}
                    <FeatureItem icon={<FaHome />} label="Tipo" value={features.tipo_propiedad || features.tipo} />
                    <FeatureItem icon={<FaRulerCombined />} label="M² Totales" value={features.m2_totales ? `${features.m2_totales} m²` : null} />
                </>
            )}
        </div>
    );
}



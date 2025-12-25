import { CheckCircle2, DollarSign, Compass, Info } from 'lucide-react';

interface Props {
    category: string;
    features: any;
}

export default function AdAdvancedDetails({ category, features }: Props) {
    if (!features) return null;

    const DetailRow = ({ label, value, icon: Icon }: any) => {
        if (!value) return null;
        return (
            <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2 text-gray-500">
                    {Icon && <Icon size={16} />}
                    <span className="text-sm font-medium">{label}</span>
                </div>
                <span className="text-gray-900 font-bold text-sm text-right">{value}</span>
            </div>
        );
    };

    const isAuto = category?.toLowerCase().includes('auto') || category?.toLowerCase() === 'vehiculos';
    // Common for Properties
    const gastosComunes = features.gastos_comunes ? `$${Number(features.gastos_comunes).toLocaleString('es-CL')}` : null;
    const contribuciones = features.contribuciones ? `$${Number(features.contribuciones).toLocaleString('es-CL')}` : null;
    const orientacion = features.orientacion;
    const tipoPropiedad = features.tipo_propiedad || features.tipo;

    // Equipamiento Mapping (Simple check for true/checked values if they exist as boolean in features, or array)
    // Assuming features might contain boolean flags or an array. Logic depends on how we saved it.
    // For now, let's assume specific keys or an 'equipamiento' array.
    // We'll iterate over keys that are strictly booleans true.
    const equipmentKeys = Object.entries(features)
        .filter(([key, val]) => val === true || val === 'true')
        .map(([key]) => key.replace(/_/g, ' '));

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info size={20} className="text-blue-600" />
                Características {isAuto ? 'del Vehículo' : 'de la Propiedad'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                {/* --- PROPIEDADES --- */}
                {!isAuto && (
                    <>
                        <DetailRow label="Tipo de Inmueble" value={tipoPropiedad} icon={HomeIcon} />
                        <DetailRow label="Gastos Comunes" value={gastosComunes} icon={DollarSign} />
                        <DetailRow label="Contribuciones" value={contribuciones} icon={DollarSign} />
                        <DetailRow label="Orientación" value={orientacion} icon={Compass} />
                        <DetailRow label="Condición" value={features.condición || 'Usada'} />
                    </>
                )}

                {/* --- AUTOS --- */}
                {isAuto && (
                    <>
                        <DetailRow label="Marca" value={features.marca} />
                        <DetailRow label="Modelo" value={features.modelo} />
                        <DetailRow label="Versión" value={features.version} />
                        <DetailRow label="Motor" value={features.cilindrada || features.motor} />
                        <DetailRow label="Color" value={features.color} />
                    </>
                )}
            </div>

            {/* EQUIPAMIENTO LIST (Si existe) */}
            {equipmentKeys.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Equipamiento</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {equipmentKeys.map((item) => (
                            <div key={item} className="flex items-center gap-2 text-gray-700 text-sm">
                                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                                <span className="capitalize">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function HomeIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
}

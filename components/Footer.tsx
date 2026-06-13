import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* Marca */}
                    <div>
                        <h3 className="text-white text-xl font-extrabold mb-3">QVisos.cl</h3>
                        <p className="text-sm leading-relaxed text-gray-400">
                            No son avisos, son QVisos. La forma más segura de vender tu auto o
                            propiedad en Chile: letrero físico con QR verificado y trato directo.
                        </p>
                    </div>

                    {/* Navegación */}
                    <div>
                        <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">Explorar</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/buscar?category=Autos" className="hover:text-white transition-colors">Autos en venta</Link></li>
                            <li><Link href="/buscar?category=Propiedades&operacion=Venta" className="hover:text-white transition-colors">Propiedades en venta</Link></li>
                            <li><Link href="/buscar?category=Propiedades&operacion=Arriendo" className="hover:text-white transition-colors">Arriendos</Link></li>
                            <li><Link href="/activar" className="hover:text-white transition-colors">Activar mi QR</Link></li>
                        </ul>
                    </div>

                    {/* Confianza */}
                    <div>
                        <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">Confianza</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>🛡️ Avisos verificados con QR físico</li>
                            <li>⚡ Trato directo, sin intermediarios</li>
                            <li>🤖 Asistente IA que filtra contactos</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
                    <span>© {new Date().getFullYear()} QVisos.cl — Todos los derechos reservados.</span>
                    <span>Hecho en Chile 🇨🇱</span>
                </div>
            </div>
        </footer>
    );
}

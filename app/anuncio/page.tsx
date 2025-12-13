"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

// --- INTERFACES PARA TYPESCRIPT ---
interface FormData {
  code: string;
  category: string;
  type: string;
  title: string;
  price: string | number;
  description: string;
  brand: string;
  model: string;
  year: string | number;
  kms: string | number;
  m2: string | number;
  rooms: string | number;
  address: string;
  lat: number | null;
  lng: number | null;
  imageUrls: string[];
}

interface LocationPickerProps {
  onLocationSelect: (data: { address: string; lat: number; lng: number }) => void;
}

// --- COMPONENTE DE MAPA SIMPLE Y ROBUSTO ---
function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string>("Cargando mapa...");

  useEffect(() => {
    // Verificación de seguridad para TypeScript
    const w = window as any;

    if (!w.google) {
      setStatus("Error: Google Maps no cargó. Refresca la página.");
      return;
    }

    setStatus("Listo. Escribe tu dirección:");

    if (inputRef.current) {
      // Inicializar Autocomplete Clásico
      const autocomplete = new w.google.maps.places.Autocomplete(inputRef.current, {
        fields: ["geometry", "formatted_address"],
        componentRestrictions: { country: "cl" },
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          onLocationSelect({
            address: place.formatted_address || "",
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
        }
      });
    }
  }, [onLocationSelect]);

  return (
    <div className="mb-4">
      <label className="block text-sm font-bold mb-1 text-gray-700">Ubicación Exacta</label>
      <input
        ref={inputRef}
        type="text"
        placeholder="Ej: Av. Providencia 1234..."
        className="w-full p-3 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <p className="text-xs text-gray-400 mt-1">{status}</p>
    </div>
  );
}

// --- PÁGINA PRINCIPAL DE ACTIVACIÓN ---
export default function ActivarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Estado del Usuario con tipo User de Firebase
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Estado del Flujo
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Datos del Formulario con Interface
  const [formData, setFormData] = useState<FormData>({
    code: "",
    category: "",
    type: "",
    title: "",
    price: "",
    description: "",
    brand: "", model: "", year: "", kms: "",
    m2: "", rooms: "",
    address: "", lat: null, lng: null,
    imageUrls: []
  });

  // 1. Verificar Autenticación y Código URL
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });

    const urlCode = searchParams.get("code");
    if (urlCode) {
      setFormData(prev => ({ ...prev, code: urlCode }));
    }

    return () => unsubscribe();
  }, [searchParams]);

  // Manejadores de cambios tipados
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (locData: { address: string; lat: number; lng: number }) => {
    setFormData(prev => ({ ...prev, ...locData }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Debes iniciar sesión para activar un aviso.");
      return;
    }
    setIsSubmitting(true);

    try {
      const newAd = {
        ...formData,
        id: formData.code,
        userId: user.uid,
        userEmail: user.email,
        status: "pending_verification",
        createdAt: serverTimestamp(),
        price: Number(formData.price) || 0,
        year: Number(formData.year) || 0,
        kms: Number(formData.kms) || 0,
        m2: Number(formData.m2) || 0,
        rooms: Number(formData.rooms) || 0,
      };

      // Guardar en colección PÚBLICA usando el código como ID del documento
      await setDoc(doc(db, "anuncios", formData.code), newAd);

      alert("¡Aviso activado con éxito! Ahora está pendiente de aprobación.");
      router.push("/mis-anuncios");

    } catch (error: any) {
      console.error("Error guardando:", error);
      alert("Error al activar: " + (error.message || "Error desconocido"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingAuth) return <div className="p-10 text-center">Cargando...</div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow-lg text-center bg-white">
        <h2 className="text-xl font-bold mb-4">Inicia sesión para activar</h2>
        <p className="mb-4">Necesitas una cuenta para gestionar tu código QViso.</p>
        <button
          onClick={() => router.push("/login?redirect=/activar")}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Ir a Login / Registro
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-black text-gray-800 mb-2 uppercase font-oswald">
        Activar Nuevo QViso
      </h1>
      <div className="w-full bg-gray-200 h-2 rounded-full mb-8">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
        ></div>
      </div>

      {/* --- PASO 1: CÓDIGO QV --- */}
      {step === 1 && (
        <div className="animate-fade-in">
          <label className="block text-lg font-bold mb-2">1. Ingresa el Código de tu Kit</label>
          <p className="text-gray-500 text-sm mb-4">Lo encuentras en la parte inferior de tu letrero (Ej: QV-075).</p>

          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="QV-..."
            className="w-full text-3xl font-black p-4 border-2 border-blue-600 rounded text-center uppercase tracking-widest mb-6"
          />

          <button
            disabled={!formData.code || formData.code.length < 3}
            onClick={() => setStep(2)}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Continuar &rarr;
          </button>
        </div>
      )}

      {/* --- PASO 2: CATEGORÍA --- */}
      {step === 2 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold mb-6">2. ¿Qué vas a publicar?</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setFormData({ ...formData, category: 'autos' })}
              className={`p-6 border-2 rounded-xl flex flex-col items-center gap-2 ${formData.category === 'autos' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
            >
              <span className="text-4xl">🚗</span>
              <span className="font-bold">Vehículo</span>
            </button>
            <button
              onClick={() => setFormData({ ...formData, category: 'propiedades' })}
              className={`p-6 border-2 rounded-xl flex flex-col items-center gap-2 ${formData.category === 'propiedades' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
            >
              <span className="text-4xl">🏡</span>
              <span className="font-bold">Propiedad</span>
            </button>
          </div>

          {formData.category && (
            <div className="mb-8">
              <label className="block text-sm font-bold mb-2">Tipo de Operación</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-3 border rounded"
              >
                <option value="">Selecciona...</option>
                <option value="venta">Venta</option>
                <option value="arriendo">Arriendo</option>
              </select>
            </div>
          )}

          <div className="flex gap-4">
            <button onClick={() => setStep(1)} className="px-6 py-3 text-gray-500 font-bold">Atrás</button>
            <button
              disabled={!formData.category || !formData.type}
              onClick={() => setStep(3)}
              className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Siguiente &rarr;
            </button>
          </div>
        </div>
      )}

      {/* --- PASO 3: DETALLES --- */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="animate-fade-in space-y-4">
          <h2 className="text-xl font-bold mb-4">3. Detalles del Aviso</h2>

          {/* Campos Comunes */}
          <div>
            <label className="block text-sm font-bold mb-1">Título del Anuncio</label>
            <input name="title" required value={formData.title} onChange={handleChange} className="w-full p-3 border rounded" placeholder={`Ej: ${formData.category === 'autos' ? 'Toyota Yaris 2019 Full' : 'Casa en Condominio'}`} />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Precio (CLP)</label>
            <input type="number" name="price" required value={formData.price} onChange={handleChange} className="w-full p-3 border rounded" placeholder="9500000" />
          </div>

          {/* UBICACIÓN (Componente Integrado) */}
          <LocationPicker onLocationSelect={handleLocationSelect} />

          {/* Campos Específicos: AUTOS */}
          {formData.category === 'autos' && (
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-xs font-bold mb-1">Marca</label>
                <input name="brand" value={formData.brand} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Modelo</label>
                <input name="model" value={formData.model} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Año</label>
                <input type="number" name="year" value={formData.year} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Kilometraje</label>
                <input type="number" name="kms" value={formData.kms} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>
            </div>
          )}

          {/* Campos Específicos: PROPIEDADES */}
          {formData.category === 'propiedades' && (
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-xs font-bold mb-1">M² Totales</label>
                <input type="number" name="m2" value={formData.m2} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Habitaciones</label>
                <input type="number" name="rooms" value={formData.rooms} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold mb-1">Descripción</label>
            <textarea name="description" rows={4} value={formData.description} onChange={handleChange} className="w-full p-3 border rounded" placeholder="Cuenta los detalles..." />
          </div>

          {/* BOTONES FINALES */}
          <div className="pt-6 flex gap-4">
            <button type="button" onClick={() => setStep(2)} className="px-6 py-3 text-gray-500 font-bold">Atrás</button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 text-white font-bold py-4 rounded-lg hover:bg-green-700 shadow-lg transition-transform transform hover:-translate-y-1"
            >
              {isSubmitting ? "Guardando..." : "✅ ACTIVAR AVISO AHORA"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
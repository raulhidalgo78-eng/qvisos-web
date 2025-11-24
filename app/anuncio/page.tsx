// En: app/anuncio/page.tsx

'use client'; // Este formulario debe ser un Client Component

import { createClient } from '@/utils/supabase/client'; // ¡Importante! Usamos el cliente del NAVEGADOR
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, Suspense } from 'react';
import type { User } from '@supabase/supabase-js'; // Para el tipado

function AnuncioForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Parámetros de URL
  const urlCode = searchParams.get('code') || '';
  const urlTipo = searchParams.get('tipo') || '';

  // Estados del formulario
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState(urlCode);

  // Estado para la categoría (se llena con el URL param si existe)
  const [category, setCategory] = useState('');

  // Estado para detectar la categoría real del QR (desde la BD)
  const [qrCategory, setQrCategory] = useState<string | null>(null);

  // --- ¡AQUÍ ESTÁ LA SEGURIDAD! ---
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        router.push('/login?message=Debes iniciar sesión para activar un QR');
      } else {
        setUser(data.user);
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  // Efecto para inicializar categoría desde URL
  useEffect(() => {
    if (urlTipo === 'auto') setCategory('autos');
    else if (urlTipo.includes('propiedad')) setCategory('inmuebles');
    else if (urlTipo) setCategory('otros');
  }, [urlTipo]);

  // Efecto para chequear la categoría del QR cuando cambia el input
  useEffect(() => {
    const checkQr = async () => {
      if (qrCodeInput.length > 3) { // Solo chequear si tiene longitud razonable
        // Importamos dinámicamente o usamos la server action
        const { checkQrCategory } = await import('@/app/actions/check-qr');
        const cat = await checkQrCategory(qrCodeInput);
        if (cat) {
          setQrCategory(cat);
          // Auto-seleccionar categoría en el dropdown si coincide
          if (cat === 'venta_auto') setCategory('autos');
          if (cat === 'venta_propiedad' || cat === 'arriendo_propiedad') setCategory('inmuebles');
        } else {
          setQrCategory(null);
        }
      }
    };

    // Debounce simple o check directo si viene de URL
    const timeoutId = setTimeout(() => {
      checkQr();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [qrCodeInput]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor, selecciona un archivo para subir.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('file', file);

    // Aseguramos que la categoría se envíe correctamente
    if (!formData.get('categoria')) {
      formData.append('categoria', category);
    }

    // Recolectar features extras
    const features: any = {};
    if (category === 'autos') {
      features.marca = formData.get('marca');
      features.modelo = formData.get('modelo');
      features.anio = formData.get('anio');
      features.kilometraje = formData.get('kilometraje');
      features.transmision = formData.get('transmision');
    } else if (category === 'inmuebles') {
      features.m2 = formData.get('m2');
      features.habitaciones = formData.get('habitaciones');
      features.banos = formData.get('banos');
    }

    // Agregar features al FormData como JSON string
    formData.append('features', JSON.stringify(features));

    try {
      const response = await fetch('/api/upload/media', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir el archivo');
      }

      alert('¡Anuncio creado con éxito! Redirigiendo a Mis Anuncios...');
      router.push('/mis-anuncios');

    } catch (err: any) {
      setError(err.message || 'No se pudo guardar el anuncio en la base de datos.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Verificando sesión...</div>;
  }

  // Lógica de visualización basada en la categoría seleccionada O la del QR
  const showAutoFields = category === 'autos';
  const showPropertyFields = category === 'inmuebles';

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px' }}>
      <h1>Activar QR / Crear Anuncio</h1>
      <p style={{ marginBottom: '20px' }}>Bienvenido, {user?.email}. Completa los datos de tu anuncio.</p>

      <form onSubmit={handleSubmit} method="POST">

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="qr_code" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2563eb' }}>
            Códigos del Kit QR
          </label>
          <input
            id="qr_code"
            name="qr_code"
            value={qrCodeInput}
            onChange={(e) => setQrCodeInput(e.target.value)}
            readOnly={!!urlCode}
            placeholder="Ej: QV-001"
            required
            style={{ width: '100%', padding: '8px', color: '#333', border: '2px solid #2563eb', borderRadius: '4px', backgroundColor: urlCode ? '#e0f2fe' : 'white' }}
          />
          {!urlCode && <small style={{ color: '#666' }}>Ingresa el código manualmente si no lo escaneaste.</small>}
        </div>

        {/* Campo Título */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '5px' }}>Título del Anuncio</label>
          <input
            id="title"
            name="titulo"
            type="text"
            required
            placeholder={showAutoFields ? "Ej: Toyota Yaris 2018" : showPropertyFields ? "Ej: Depto 2D 2B Centro" : "Título del aviso"}
            style={{ width: '100%', padding: '8px', color: '#333' }}
          />
        </div>

        {/* Campo Descripción */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '5px' }}>Descripción</label>
          <textarea
            id="description"
            name="descripcion"
            rows={5}
            style={{ width: '100%', padding: '8px', color: '#333' }}
          />
        </div>

        {/* Campo Categoría */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="category" style={{ display: 'block', marginBottom: '5px' }}>Categoría</label>
          <select
            id="category"
            name="categoria"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            // No bloqueamos el select totalmente, pero sugerimos lo del QR
            style={{ width: '100%', padding: '8px', color: '#333', backgroundColor: 'white' }}
          >
            <option value="">-- Selecciona una categoría --</option>
            <option value="autos">Autos</option>
            <option value="inmuebles">Inmuebles</option>
            <option value="tecnologia">Tecnología</option>
            <option value="otros">Otros</option>
          </select>
        </div>

        {/* CAMPOS ESPECÍFICOS: AUTO */}
        {showAutoFields && (
          <div style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px', marginBottom: '15px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#1f2937', marginBottom: '10px' }}>Detalles del Vehículo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '3px' }}>Marca</label>
                <input name="marca" type="text" placeholder="Ej: Toyota" style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '3px' }}>Modelo</label>
                <input name="modelo" type="text" placeholder="Ej: Yaris" style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '3px' }}>Año</label>
                <input name="anio" type="number" placeholder="2018" style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '3px' }}>Kilometraje</label>
                <input name="kilometraje" type="number" placeholder="50000" style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '3px' }}>Transmisión</label>
                <select name="transmision" style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                  <option value="manual">Manual</option>
                  <option value="automatica">Automática</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* CAMPOS ESPECÍFICOS: PROPIEDAD */}
        {showPropertyFields && (
          <div style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px', marginBottom: '15px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#1f2937', marginBottom: '10px' }}>Detalles de la Propiedad</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '3px' }}>m² Totales</label>
                <input name="m2" type="number" style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '3px' }}>Habitaciones</label>
                <input name="habitaciones" type="number" style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '3px' }}>Baños</label>
                <input name="banos" type="number" style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        )}

        {/* Campo WhatsApp de Contacto */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="contact_phone" style={{ display: 'block', marginBottom: '5px' }}>WhatsApp de Contacto (+569...)</label>
          <input
            id="contact_phone"
            name="contact_phone"
            type="tel"
            placeholder="+56912345678"
            required
            style={{ width: '100%', padding: '8px', color: '#333' }}
          />
        </div>

        {/* Campo Precio */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="price" style={{ display: 'block', marginBottom: '5px' }}>Precio (CLP)</label>
          <input
            id="price"
            name="precio"
            type="number"
            style={{ width: '100%', padding: '8px', color: '#333' }}
          />
        </div>

        {/* Campo de Archivo (Imagen/Video) */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="file" style={{ display: 'block', marginBottom: '5px' }}>Imagen Principal</label>
          <input
            id="file"
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            required
            style={{ width: '100%', padding: '8px', color: '#333' }}
          />
        </div>

        <hr style={{ margin: '20px 0' }} />

        {/* Muestra errores si existen */}
        {error && <p style={{ color: 'red', marginBottom: '10px' }}>Error: {error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ width: '100%', padding: '10px 20px', fontSize: '16px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {isSubmitting ? 'Guardando...' : 'Crear Anuncio y Activar'}
        </button>
      </form>
    </div>
  );
}

export default function AnuncioPage() {
  return (
    <Suspense fallback={<div>Cargando formulario...</div>}>
      <AnuncioForm />
    </Suspense>
  );
}

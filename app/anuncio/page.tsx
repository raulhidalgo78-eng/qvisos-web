// BUSCA LA FUNCIÓN handleSubmit Y REEMPLÁZALA COMPLETAMENTE POR ESTA:

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setMessage('');

  if (!userId) return;

  try {
    let details = {};
    const commonDetails = { currency };

    if (category === 'propiedad') {
      details = { ...commonDetails, m2Total, rooms, bathrooms, type: propType, ggcc, parking, bodega, orientation };
    } else {
      details = { ...commonDetails, year, km, transmission, fuel, owners, legalStatus };
    }

    // Descripción
    const precioFmt = `${currency} ${parseFloat(price).toLocaleString('es-CL')}`;
    const extraDesc = category === 'propiedad'
      ? `Precio: ${precioFmt} | Tipo: ${propType} | GGCC: $${ggcc} | Estac: ${parking ? 'Sí' : 'No'}`
      : `Precio: ${precioFmt} | Año: ${year} | Km: ${km} | Papeles: ${legalStatus}`;

    const finalDescription = `${description}\n\n--- Resumen Técnico ---\n${extraDesc}`;

    // 1. GUARDAR EL ANUNCIO (Estado inicial: DRAFT)
    const { data: adData, error: adError } = await supabase
      .from('ads')
      .insert({
        title,
        price: parseFloat(price),
        category,
        user_id: userId,
        status: 'draft', // Se guarda como borrador primero
        qr_code: codigoQR || null,
        description: finalDescription,
        details: details
      })
      .select('id').single();

    if (adError) throw adError;

    // 2. SUBIR LA FOTO (CLIENT-SIDE UPLOAD - LA SOLUCIÓN)
    if (photos.length > 0) {
      const file = photos[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${adData.id}/image_${Date.now()}.${fileExt}`;

      // Subida directa a Supabase (Sin pasar por API route)
      const { error: uploadError } = await supabase.storage
        .from('qvisos-media')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error subiendo imagen:', uploadError);
        setMessage('⚠️ Anuncio guardado, pero falló la imagen. Intenta editarlo.');
      } else {
        // 3. ÉXITO: ACTIVAR EL ANUNCIO PARA EL ADMIN
        // Solo si la foto subió bien, pasamos a 'pending_verification'
        await supabase
          .from('ads')
          .update({ status: 'pending_verification' })
          .eq('id', adData.id);

        setMessage('✅ ¡Anuncio enviado a revisión!');
      }
    } else {
      // Si no hay foto, lo dejamos en pending o draft según tu regla de negocio
      setMessage('✅ Anuncio guardado (Sin fotos).');
    }

    setTimeout(() => router.push('/mis-anuncios'), 2000);

  } catch (error: any) {
    console.error(error);
    setMessage(`❌ Error: ${error.message}`);
  }
  setLoading(false);
};
// En: app/api/upload/media/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {

  const supabase = await createClient();

  // 1. Verificamos la sesión del usuario
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.log("❌ API: No hay usuario logueado o error de auth"); // LOG NUEVO
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  console.log("✅ API: Usuario autenticado ID:", user.id); // LOG NUEVO

  try {
    // 2. Parseamos el FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const titulo = formData.get('titulo') as string;
    const descripcion = formData.get('descripcion') as string;
    const precio = formData.get('precio') as string;
    const category = formData.get('categoria') as string;
    const contact_phone = formData.get('contact_phone') as string;

    // Parsear features (JSON string)
    let features = {};
    const featuresRaw = formData.get('features') as string;
    if (featuresRaw) {
      try {
        features = JSON.parse(featuresRaw);
      } catch (e) {
        console.error("Error parseando features:", e);
      }
    }

    // 1. Parsear Códigos QR
    const qrRaw = formData.get('qr_code') as string;
    if (!qrRaw) {
      return NextResponse.json({ message: 'El código QR es obligatorio' }, { status: 400 });
    }
    // Separa por comas o saltos de línea y limpia espacios
    const qrCodesArray = qrRaw.split(/[\n,]+/).map(code => code.trim()).filter(code => code.length > 0);

    if (qrCodesArray.length === 0) {
      return NextResponse.json({ message: 'Formato de códigos QR inválido.' }, { status: 400 });
    }

    // 2. Validar que TODOS los códigos existan y estén libres
    const { data: validQrs, error: qrError } = await supabase
      .from('qr_codes')
      .select('code')
      .is('ad_id', null) // Deben estar libres
      .in('code', qrCodesArray);

    if (qrError) {
      console.error("Error validando QRs:", qrError);
      return NextResponse.json({ message: 'Error validando códigos QR.' }, { status: 500 });
    }

    // Si encontramos menos códigos válidos de los que el usuario ingresó, hay un error.
    if (!validQrs || validQrs.length !== qrCodesArray.length) {
      const foundCodes = validQrs?.map(q => q.code) || [];
      const invalidCodes = qrCodesArray.filter(code => !foundCodes.includes(code));
      return NextResponse.json({
        message: `Los siguientes códigos no existen o ya están en uso: ${invalidCodes.join(', ')}`
      }, { status: 400 });
    }

    if (!file || !titulo) {
      return NextResponse.json({ message: 'El título y el archivo son obligatorios' }, { status: 400 });
    }

    // 3. Creamos un nombre de archivo único
    const fileName = `${Date.now()}-${file.name}`;
    const bucketName = 'media'; // El nombre de tu bucket en Supabase

    // 4. Subimos el archivo a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error subiendo archivo:', uploadError);
      throw new Error('Error al subir el archivo multimedia.');
    }

    // 5. Obtenemos la URL pública del archivo subido
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    // 6. Creamos el registro en la tabla 'ads'
    const { data: adData, error: insertError } = await supabase
      .from('ads')
      .insert({
        user_id: user.id,
        title: titulo,
        description: descripcion,
        price: precio ? parseFloat(precio) : null,
        category: category,
        contact_phone: contact_phone,
        status: 'pending_verification',
        media_url: publicUrl, // <-- ¡ESTA LÍNEA DEBE SER 'publicUrl'!
        features: features // Guardamos las características dinámicas
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error insertando anuncio:', insertError);
      throw new Error('No se pudo guardar el anuncio en la base de datos.');
    }

    // 3. Vincular TODOS los QRs al anuncio
    const { error: linkError } = await supabase
      .from('qr_codes')
      .update({
        ad_id: adData.id,
        status: 'active'
      })
      .in('code', qrCodesArray); // Actualizamos todos los del array

    if (linkError) {
      console.error('Error vinculando QRs:', linkError);
    }

    return NextResponse.json(adData, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// Archivo: app/api/upload/media/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase'; // 4 niveles arriba de /api/upload/media/
import busboy from 'busboy';
import { Readable } from 'stream';



// Función de ayuda para procesar el body de la petición
function parseMultipartForm(request: Request): Promise<{ fields: Record<string, string>, files: { filename: string, data: Buffer, type: string }[] }> {
  return new Promise((resolve, reject) => {
    const fields: Record<string, string> = {};
    const files: { filename: string, data: Buffer, type: string }[] = [];

    // Inicializamos busboy
    // Convertimos los headers a un objeto plano para busboy
    const headers: any = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const bb = busboy({ headers });

    // Manejar campos de texto (ej. adId, mediaType)
    bb.on('field', (name, val) => {
      fields[name] = val;
    });

    // Manejar archivos
    bb.on('file', (name, file, info) => {
      let fileBuffer = Buffer.alloc(0);

      file.on('data', (data) => {
        fileBuffer = Buffer.concat([fileBuffer, data]);
      });

      file.on('end', () => {
        files.push({
          filename: info.filename,
          data: fileBuffer,
          type: info.mimeType
        });
      });
    });

    bb.on('close', () => {
      resolve({ fields, files });
    });

    bb.on('error', (err) => {
      reject(err);
    });

    // Pipe el body de la petición a busboy
    // @ts-ignore
    Readable.fromWeb(request.body as any).pipe(bb);
  });
}

export async function POST(request: Request) {
  let adId: string | undefined;

  try {
    // 1. Procesar el formulario multipart/form-data
    const { fields, files } = await parseMultipartForm(request);

    adId = fields.adId;
    const mediaType = fields.mediaType; // 'image', 'video', o 'document'

    if (!adId || !files.length) {
      return NextResponse.json({ message: 'Faltan el ID del anuncio o los archivos.' }, { status: 400 });
    }

    const file = files[0]; // Procesamos un solo archivo a la vez por simplicidad
    const fileExtension = file.filename.split('.').pop();
    const path = `${adId}/${mediaType}_${Date.now()}.${fileExtension}`;
    const bucketName = 'qvisos-media'; // Tu bucket de Supabase Storage

    // 2. Subir el archivo a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(path, file.data, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false // No sobrescribir
      });

    if (uploadError) {
      console.error('Error de subida a Storage:', uploadError);
      return NextResponse.json({ message: 'Error al subir el archivo a Storage.' }, { status: 500 });
    }

    // 3. Obtener la URL pública y registrar en la tabla 'ad_media'
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(path);

    const { error: dbError } = await supabase
      .from('ad_media')
      .insert({
        ad_id: adId,
        media_type: mediaType,
        file_url: publicUrl,
        storage_path: path
      });

    if (dbError) {
      // Si falla el registro, eliminar el archivo de Storage (limpieza)
      await supabase.storage.from(bucketName).remove([path]);
      console.error('Error al registrar media en BDD:', dbError);
      return NextResponse.json({ message: 'Archivo subido, pero falló el registro en la BDD.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Archivo procesado y registrado con éxito.', url: publicUrl });

  } catch (error) {
    console.error('Error general en la API de subida:', error);
    return NextResponse.json({ message: 'Error general de servidor.' }, { status: 500 });
  }
}

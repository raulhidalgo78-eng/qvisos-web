// Archivo: app/api/upload/media/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const adId = formData.get('adId') as string;
    const mediaType = formData.get('mediaType') as string;

    if (!file || !adId) {
      return NextResponse.json({ message: 'Faltan datos' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${adId}/${mediaType}_${Date.now()}.${fileExt}`;

    // Subir a Supabase
    const { error: uploadError } = await supabase.storage
      .from('qvisos-media')
      .upload(fileName, file, { upsert: false });

    if (uploadError) throw uploadError;

    // Obtener URL
    const { data: { publicUrl } } = supabase.storage
      .from('qvisos-media')
      .getPublicUrl(fileName);

    return NextResponse.json({ message: 'OK', url: publicUrl });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const adId = formData.get('adId') as string;
    const mediaType = formData.get('mediaType') as string;

    if (!file || !adId) {
      return NextResponse.json({ message: 'Faltan datos (archivo o ID)' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${adId}/${mediaType}_${Date.now()}.${fileExt}`;

    // Subida directa
    const { error: uploadError } = await supabase.storage
      .from('qvisos-media')
      .upload(fileName, file, { upsert: false });

    if (uploadError) {
      console.error('Upload Error:', uploadError);
      return NextResponse.json({ message: 'Error de permisos o red' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('qvisos-media')
      .getPublicUrl(fileName);

    // Actualizar tabla (opcional si ya actualizas el estado en frontend, pero buena práctica)
    // ... lógica de insert en ad_media ...

    return NextResponse.json({ message: 'OK', url: publicUrl });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

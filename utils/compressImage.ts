/**
 * Comprime y redimensiona una imagen antes de subirla.
 * - Máximo 1200px de ancho (mantiene proporción)
 * - Exporta como JPEG al 85% de calidad
 * - Devuelve un nuevo File listo para FormData
 */
export async function compressImage(file: File, maxWidth = 1200, quality = 0.85): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            // Calcular dimensiones
            let { width, height } = img;
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            // Dibujar en canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(file); return; }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) { resolve(file); return; }
                    const compressed = new File(
                        [blob],
                        file.name.replace(/\.[^.]+$/, '.jpg'),
                        { type: 'image/jpeg', lastModified: Date.now() }
                    );
                    resolve(compressed);
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Error cargando imagen')); };
        img.src = objectUrl;
    });
}

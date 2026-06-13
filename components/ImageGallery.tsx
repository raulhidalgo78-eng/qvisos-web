'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
    images: string[];
    alt: string;
}

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
    const [current, setCurrent] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                Sin imagen disponible
            </div>
        );
    }

    if (images.length === 1) {
        return (
            <Image
                src={images[0]}
                alt={alt}
                fill
                className="object-contain bg-gray-100"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
            />
        );
    }

    const prev = () => setCurrent(i => (i - 1 + images.length) % images.length);
    const next = () => setCurrent(i => (i + 1) % images.length);

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Imagen principal */}
            <div className="relative flex-1 bg-gray-100">
                <Image
                    src={images[current]}
                    alt={`${alt} - foto ${current + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority={current === 0}
                />

                {/* Flechas */}
                <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/65 text-white rounded-full p-2 transition-colors"
                    aria-label="Foto anterior"
                >
                    <ChevronLeft size={22} />
                </button>
                <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/65 text-white rounded-full p-2 transition-colors"
                    aria-label="Foto siguiente"
                >
                    <ChevronRight size={22} />
                </button>

                {/* Contador */}
                <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                    {current + 1} / {images.length}
                </div>
            </div>

            {/* Miniaturas */}
            <div className="flex gap-2 overflow-x-auto pb-1 px-0.5">
                {images.map((img, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === current
                            ? 'border-blue-500 opacity-100 shadow-md'
                            : 'border-transparent opacity-55 hover:opacity-80'
                            }`}
                        aria-label={`Ver foto ${i + 1}`}
                    >
                        <Image
                            src={img}
                            alt={`Miniatura ${i + 1}`}
                            fill
                            className="object-cover"
                            sizes="64px"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}

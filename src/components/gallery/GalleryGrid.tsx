'use client'

import { useState } from 'react'
import type { GalleryImageRow } from '@/lib/db/gallery'

type Props = {
  images: GalleryImageRow[]
}

export default function GalleryGrid({ images }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (images.length === 0) {
    return <div className="py-16 text-center text-gray-500 text-sm">No photos yet.</div>
  }

  const active = lightboxIndex != null ? images[lightboxIndex] : null

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {images.map((img, i) => (
          <button
            key={img.gallery_image_id}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="aspect-square bg-white/5 border border-white/10 rounded-xl overflow-hidden relative focus:outline-none group"
            aria-label={img.caption ?? 'Open photo'}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.thumbnail_url || img.image_url}
              alt={img.caption ?? ''}
              className="w-full h-full object-cover transition-opacity group-hover:opacity-80"
            />
            {img.caption && (
              <div className="absolute bottom-0 inset-x-0 bg-black/50 px-2 py-1">
                <p className="text-[10px] text-white/80 truncate leading-tight">{img.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div
            className="flex flex-col items-center gap-3 px-4 max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.image_url}
              alt={active.caption ?? ''}
              className="max-w-full max-h-[80dvh] object-contain rounded"
            />
            {active.caption && (
              <p className="text-xs text-white/70 text-center">{active.caption}</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

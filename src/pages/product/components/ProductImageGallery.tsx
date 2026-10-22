import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import type { ProductImageResponse } from '@/services'
import { clImg } from './productDetail.utils'

interface ProductImageGalleryProps {
  images: ProductImageResponse[]
  productName: string
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  productName,
}) => {
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const sorted = [...images].sort((a, b) => {
    if (a.isPrimary) return -1
    if (b.isPrimary) return 1
    return (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  })

  const prev = useCallback(
    () => setActiveIdx((i) => (i - 1 + sorted.length) % sorted.length),
    [sorted.length],
  )
  const next = useCallback(
    () => setActiveIdx((i) => (i + 1) % sorted.length),
    [sorted.length],
  )

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') setLightbox(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, prev, next])

  if (!sorted.length) return null

  return (
    <>
      {/* Main image */}
      <div className="flex flex-col gap-2.5">
        <div
          className="relative w-full aspect-[4/3] sm:aspect-square max-h-[320px] rounded-xl overflow-hidden border border-gray-100 group cursor-zoom-in bg-gray-50 flex items-center justify-center"
          style={{ boxShadow: '0 2px 12px 0 rgba(74,124,47,0.06)' }}
          onClick={() => setLightbox(true)}
        >
          <img
            src={clImg(sorted[activeIdx]?.imageUrl, 'main')}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
            alt={`${productName} - ảnh ${activeIdx + 1}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <ZoomIn className="size-4 text-leaf-700" />
            </div>
          </div>
          {sorted.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  prev()
                }}
                aria-label="Ảnh trước"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 size-7.5 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
              >
                <ChevronLeft className="size-4 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  next()
                }}
                aria-label="Ảnh kế tiếp"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 size-7.5 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
              >
                <ChevronRight className="size-4 text-gray-700" />
              </button>
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
                {sorted.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Chọn ảnh ${i + 1}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveIdx(i)
                    }}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${
                      i === activeIdx
                        ? 'w-4 h-1 bg-white'
                        : 'w-1 h-1 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail row */}
        {sorted.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {sorted.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`flex-shrink-0 size-12 rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                  idx === activeIdx
                    ? 'border-leaf-600 shadow-2xs scale-105'
                    : 'border-gray-200 hover:border-leaf-300 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={clImg(img.imageUrl, 'thumb')}
                  className="w-full h-full object-cover"
                  alt={`Thumbnail ${idx + 1}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Đóng phóng to"
            className="absolute top-5 right-5 size-11 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="size-5 text-white" />
          </button>
          {sorted.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  prev()
                }}
                aria-label="Ảnh trước"
                className="absolute left-5 top-1/2 -translate-y-1/2 size-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer"
              >
                <ChevronLeft className="size-6 text-white" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  next()
                }}
                aria-label="Ảnh kế tiếp"
                className="absolute right-5 top-1/2 -translate-y-1/2 size-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer"
              >
                <ChevronRight className="size-6 text-white" />
              </button>
            </>
          )}
          <img
            src={clImg(sorted[activeIdx]?.imageUrl, 'main')}
            className="max-h-[88vh] max-w-[88vw] object-contain rounded-2xl shadow-2xl"
            alt={productName}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
            {sorted.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Xem ảnh ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveIdx(i)
                }}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  i === activeIdx
                    ? 'w-6 h-2 bg-white'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

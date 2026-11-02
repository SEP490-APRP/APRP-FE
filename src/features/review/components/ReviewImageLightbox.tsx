import React from 'react'
import { X } from 'lucide-react'

interface ReviewImageLightboxProps {
  imageUrl: string | null
  onClose: () => void
}

export function ReviewImageLightbox({ imageUrl, onClose }: ReviewImageLightboxProps) {
  if (!imageUrl) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-3xl max-h-[90vh] bg-neutral-900 rounded-xl overflow-hidden p-2 shadow-2xl border border-white/10"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 size-7 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center transition-colors z-10 cursor-pointer"
        >
          <X size={15} />
        </button>
        <img
          src={imageUrl}
          alt="Ảnh phóng to"
          className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
        />
      </div>
    </div>
  )
}

import React from 'react'
import { Star } from 'lucide-react'

// ── Cloudinary URL helper ────────────────────────────────────────────────────
export function clImg(url: string | undefined, mode: 'main' | 'thumb' = 'main'): string {
  if (!url || !url.includes('res.cloudinary.com')) return url ?? ''
  const transform =
    mode === 'main'
      ? 'f_auto,q_auto:best,e_sharpen:60'
      : 'f_auto,q_auto:eco,c_fill,w_150,h_150,g_center'
  return url.replace('/upload/', `/upload/${transform}/`)
}

// ── Star rating helper ───────────────────────────────────────────────────────
export const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' }> = ({
  rating,
  size = 'sm',
}) => {
  const sz = size === 'md' ? 'size-5' : 'size-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${sz} ${
            i < Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-gray-100 text-gray-300'
          }`}
        />
      ))}
    </div>
  )
}

// ── Facebook SVG Icon ─────────────────────────────────────────────────────────
export const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

import { Leaf } from 'lucide-react'
import { useState } from 'react'

/**
 * @deprecated Bản ảnh cũ, còn dùng ở giỏ hàng (App) và trang Combos.
 * Khác ProduceImage ở chỗ không tự thêm `h-full w-full object-cover` và fallback dùng
 * class `.image-fallback`. Gộp về ProduceImage sau khi kiểm tra lại giao diện 2 chỗ trên.
 */
export function LegacyProduceImage({
  src,
  alt,
  className = '',
}: {
  src: string
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  return src && !failed ? (
    <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />
  ) : (
    <div className={`image-fallback ${className}`} role="img" aria-label={alt}>
      <Leaf size={42} />
      <span>{alt}</span>
    </div>
  )
}

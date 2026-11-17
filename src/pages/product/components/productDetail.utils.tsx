import React from 'react'
import { Star } from 'lucide-react'

// ── Produce-themed Fallback helper ──────────────────────────────────────────
export function getProduceFallback(name: string = ''): string {
  const lower = name.toLowerCase()
  if (
    lower.includes('rau') ||
    lower.includes('cải') ||
    lower.includes('mồng tơi') ||
    lower.includes('ngót') ||
    lower.includes('bó xôi') ||
    lower.includes('húng') ||
    lower.includes('bạc hà') ||
    lower.includes('salad') ||
    lower.includes('xà lách')
  ) {
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop'
  }
  if (lower.includes('bắp') || lower.includes('ngô')) {
    return 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop'
  }
  if (lower.includes('đậu') || lower.includes('đậu que') || lower.includes('đậu phộng')) {
    return 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&auto=format&fit=crop'
  }
  if (lower.includes('dưa hấu')) {
    return 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop'
  }
  if (lower.includes('chuối')) {
    return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop'
  }
  if (lower.includes('xoài')) {
    return 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop'
  }
  if (lower.includes('ớt')) {
    return 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop'
  }
  if (lower.includes('cà chua')) {
    return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop'
  }
  if (lower.includes('bưởi') || lower.includes('cam')) {
    return 'https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?w=600&auto=format&fit=crop'
  }
  if (lower.includes('mít')) {
    return 'https://images.unsplash.com/photo-1588879462716-16e03eaeb72e?w=600&auto=format&fit=crop'
  }
  if (lower.includes('dừa')) {
    return 'https://images.unsplash.com/photo-1544607065-27a96d5b00c6?w=600&auto=format&fit=crop'
  }
  if (lower.includes('cà tím')) {
    return 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop'
  }
  if (
    lower.includes('củ') ||
    lower.includes('khoai') ||
    lower.includes('cà rốt') ||
    lower.includes('bí') ||
    lower.includes('gừng')
  ) {
    return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop'
  }
  // Trái cây tươi mặc định
  return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop'
}

// ── Image correction & Fallback helper ───────────────────────────────────────
export function resolveProductImage(productName?: string, originalUrl?: string): string {
  const lowerName = productName ? productName.toLowerCase() : ''
  const url = originalUrl || ''

  // Phát hiện và loại bỏ các ảnh không phải nông sản (chú chó con từ Picsum/Unsplash, tòa nhà, cầu gỗ)
  const isDogOrPuppy =
    url.includes('puppy') ||
    url.includes('dog') ||
    url.includes('picsum.photos/seed/22') ||
    url.includes('photo-1543466835') ||
    url.includes('photo-1583511655')

  // 1. Mãng cầu xiêm (thay ảnh hạt gia vị hoặc ảnh chú chó con)
  if (
    lowerName.includes('mãng cầu') &&
    (isDogOrPuppy ||
      url.includes('photo-1615485500704') ||
      url.includes('spice') ||
      url.includes('seed') ||
      !url)
  ) {
    return 'https://images.unsplash.com/photo-1596797882870-8c33deeac224?w=600&auto=format&fit=crop'
  }

  // 2. Măng cụt Lái Thiêu (thay ảnh cầu gỗ / biển photo-1597714026732-3907092c7304)
  if (
    lowerName.includes('măng cụt') &&
    (url.includes('photo-1597714026732') || url.includes('bridge') || isDogOrPuppy || !url)
  ) {
    return 'https://images.unsplash.com/photo-1546548970-71785318a17b?w=600&auto=format&fit=crop'
  }

  // 3. Đu đủ ruột đỏ (thay ảnh vòm kiến trúc / tòa nhà photo-1617112848923-cc2234396a8d)
  if (
    lowerName.includes('đu đủ') &&
    (url.includes('photo-1617112848923') ||
      url.includes('architecture') ||
      url.includes('building') ||
      !url)
  ) {
    return 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=600&auto=format&fit=crop'
  }

  // 4. Ổi nữ hoàng (thay ảnh cầu tàu biển trắng đen photo-1536511135899-7921860086f6)
  if (
    lowerName.includes('ổi') &&
    (url.includes('photo-1536511135899') || url.includes('pier') || isDogOrPuppy || !url)
  ) {
    return 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=600&auto=format&fit=crop'
  }

  // 5. Mít Thái siêu sớm (thay ảnh miếng dưa hấu photo-1592417817098-8f3d6910985c)
  if (
    lowerName.includes('mít') &&
    (url.includes('photo-1592417817098') || url.includes('watermelon') || !url)
  ) {
    return 'https://images.unsplash.com/photo-1588879462716-16e03eaeb72e?w=600&auto=format&fit=crop'
  }

  // 6. Vải thiều chín đỏ (thay ảnh quả dứa photo-1550258987-190a2d41a8ba)
  if (
    lowerName.includes('vải') &&
    (url.includes('photo-1550258987-190a2d41a8ba') || url.includes('pineapple') || !url)
  ) {
    return 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=600&auto=format&fit=crop'
  }

  // 7. Hồng xiêm Tiền Giang (thay ảnh bữa sáng bánh mì bơ phô mai photo-1596040033229-a9821ebd058d)
  if (
    lowerName.includes('hồng xiêm') &&
    (url.includes('photo-1596040033229') ||
      url.includes('bread') ||
      url.includes('cheese') ||
      !url)
  ) {
    return 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=600&auto=format&fit=crop'
  }

  // 8. Gừng sẻ củ già (thay ảnh bông cải xanh / súp lơ photo-1615485290382-441e4d049cb5)
  if (
    lowerName.includes('gừng') &&
    (url.includes('ezrip6hvips9nwmyottf') ||
      url.includes('broccoli') ||
      url.includes('photo-1459411621453') ||
      url.includes('photo-1615485290382') ||
      url.includes('bong-cai') ||
      !url)
  ) {
    return 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop'
  }

  // 9. Thanh long ruột đỏ (thay ảnh tòa nhà kiến trúc)
  if (
    lowerName.includes('thanh long') &&
    (url.includes('photo-1486406146926') ||
      url.includes('building') ||
      url.includes('architecture') ||
      url.includes('photo-1513694203232') ||
      url.includes('photo-1541888946425') ||
      !url)
  ) {
    return 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=600&auto=format&fit=crop'
  }

  // Nếu url lọt ảnh chó con từ picsum seed ngẫu nhiên hoặc rỗng/không hợp lệ
  if (
    isDogOrPuppy ||
    !url ||
    url === 'null' ||
    url === 'undefined' ||
    url.includes('placeholder')
  ) {
    return getProduceFallback(lowerName)
  }

  return url || getProduceFallback(lowerName)
}

// ── Cloudinary URL helper ────────────────────────────────────────────────────
export function clImg(url: string | undefined, mode: 'main' | 'thumb' = 'main'): string {
  if (!url) return ''
  if (!url.includes('res.cloudinary.com')) return url
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

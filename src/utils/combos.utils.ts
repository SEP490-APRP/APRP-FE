export interface ComboCardItem {
  id: string
  realId?: number
  itemType?: string
  name: string
  image: string
  badgeDiscount: string
  badgeWeight: string
  badgeHighlight: string
  category: string
  portion: string
  feature: string
  price: number
  original: number
  unit: string
  rating: number
  reviews: number
  sold: number
  stock: number
  mealType?: string
}

export function normalizeComboCategory(kind?: string | null): string {
  const normalized = (kind ?? '').toLowerCase()
  if (normalized.includes('mystery') || normalized.includes('box')) return 'Túi mù'
  return 'Combo'
}

export function isMeaningfulComboName(name?: string | null): boolean {
  const value = (name ?? '').trim()
  if (!value) return false

  const generic = ['combo', 'túi mù', 'tui mu', 'combo nông sản', 'túi mù nông sản', 'mystery box']
  return !generic.includes(value.toLowerCase())
}

export function resolveComboImage(name = '', rawUrl = '', fallback = ''): string {
  // Thay thế ảnh 1 quả xoài đơn lẻ ở các gói combo/túi mù bằng ảnh đĩa/giỏ trái cây phong phú
  if (rawUrl && rawUrl.includes('photo-1553279768-865429fa0078')) {
    const lower = name.toLowerCase()
    if (lower.includes('sinh tố') || lower.includes('detox')) {
      return 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=600&auto=format&fit=crop'
    }
    return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop'
  }
  if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim() !== '') {
    return rawUrl.trim()
  }
  const lower = name.toLowerCase()
  if (lower.includes('sinh tố') || lower.includes('detox')) {
    return 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=600&auto=format&fit=crop'
  }
  if (lower.includes('trái cây') || lower.includes('hoa quả') || lower.includes('nhiệt đới')) {
    return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop'
  }
  if (lower.includes('salad') || lower.includes('eat clean') || lower.includes('rau')) {
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop'
  }
  if (lower.includes('lẩu')) {
    return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop'
  }
  if (lower.includes('súp') || lower.includes('nấm') || lower.includes('chay') || lower.includes('đậu')) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop'
  }
  if (lower.includes('hầm') || lower.includes('bí đỏ') || lower.includes('sen') || lower.includes('canh')) {
    return 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&auto=format&fit=crop'
  }
  if (lower.includes('sinh tố') || lower.includes('bơ') || lower.includes('nước ép') || lower.includes('cam')) {
    return 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&auto=format&fit=crop'
  }
  if (lower.includes('xào') || lower.includes('cà tím') || lower.includes('bắp')) {
    return 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&auto=format&fit=crop'
  }
  if (lower.includes('thùng') || lower.includes('bếp')) {
    return 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=600&auto=format&fit=crop'
  }
  if (lower.includes('củ') || lower.includes('khoai') || lower.includes('cà rốt')) {
    return 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&auto=format&fit=crop'
  }
  return fallback || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop'
}

export function mapMysteryBoxToCard(
  mystery: {
    mysteryId?: number
    id?: number
    boxType?: string
    imageUrl?: string
    price?: number | string
    description?: string
    note?: string
    totalQuantity?: number | string
    soldQuantity?: number | string
  },
  fallbackImage = '',
): ComboCardItem {
  const price = Number(mystery.price) || 79000
  const totalQuantity = Number(mystery.totalQuantity) || 0
  const soldQuantity = Number(mystery.soldQuantity) || 0
  const name = mystery.boxType || 'Túi mù nông sản'

  return {
    id: `mystery-${mystery.mysteryId ?? mystery.id ?? 'new'}`,
    realId: mystery.mysteryId ?? mystery.id,
    itemType: 'MYSTERY_BOX',
    name,
    image: resolveComboImage(name, mystery.imageUrl, fallbackImage),
    badgeDiscount: '-50%',
    badgeWeight: 'Túi ngẫu nhiên',
    badgeHighlight: 'Túi mù',
    category: 'Túi mù',
    portion: mystery.note || 'Gia đình 2–3 người',
    feature: mystery.description || 'Nông sản tươi ngon ngẫu nhiên thu hoạch trong ngày',
    price,
    original: price * 1.5,
    unit: 'túi',
    rating: Number((mystery as any).rating ?? (mystery as any).ratingAverage ?? 0),
    reviews: Number((mystery as any).reviewCount ?? (mystery as any).totalReviews ?? 0),
    sold: soldQuantity,
    stock: Math.max(0, totalQuantity - soldQuantity) || 20,
  }
}

export function mapComboToCard(
  combo: {
    comboId?: number
    id?: number
    comboName?: string
    imageUrl?: string
    price?: number | string
    description?: string
    type?: string
    mealType?: string
    region?: string
    totalQuantity?: number | string
    soldQuantity?: number | string
  },
  fallbackImage = '',
): ComboCardItem {
  const price = Number(combo.price) || 129000
  const totalQuantity = Number(combo.totalQuantity) || 0
  const soldQuantity = Number(combo.soldQuantity) || 0
  const name = combo.comboName || 'Combo nông sản'

  return {
    id: `combo-${combo.comboId ?? combo.id ?? 'new'}`,
    realId: combo.comboId ?? combo.id,
    itemType: 'BUILD_COMBO',
    name,
    image: resolveComboImage(name, combo.imageUrl, fallbackImage),
    badgeDiscount: '-35%',
    badgeWeight: combo.region || 'Combo mùa vụ',
    badgeHighlight: normalizeComboCategory(combo.type || combo.mealType || 'combo'),
    category: 'Combo',
    portion: combo.mealType || 'Gia đình 3–4 người',
    feature: combo.description || 'Gói nông sản dinh dưỡng tươi ngon từ vườn liên kết',
    price,
    original: price * 1.4,
    unit: 'combo',
    rating: Number((combo as any).rating ?? (combo as any).ratingAverage ?? 0),
    reviews: Number((combo as any).reviewCount ?? (combo as any).totalReviews ?? 0),
    sold: soldQuantity,
    stock: Math.max(0, totalQuantity - soldQuantity) || 15,
    mealType: combo.mealType,
  }
}

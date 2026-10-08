export interface FarmerProduct {
  id: string
  name: string
  category: 'Nông sản' | 'Hộp mù' | 'Combo'
  price: number
  originalPrice: number
  discount?: string | null
  status: 'Đang bán' | 'Tạm ẩn' | 'Hết hàng'
  stock: number
  unit: string
  region: string
  /** Phương thức canh tác (Hữu cơ, VietGAP...) */
  farmingType?: string
  image: string
  freshnessScore?: number
}

export interface FarmerOrder {
  id: string
  customer: string
  phone: string
  address?: string
  items: string
  total: number
  status: string
  statusCode:
    | 'PENDING'
    | 'CONFIRMED'
    | 'READY'
    | 'SHIPPING'
    | 'DELIVERED'
    | 'CANCELLED'
  time: string
  payment: string
}

export interface FarmerVoucher {
  id: string
  code: string
  discount: string
  minOrder: string
  expiry: string
  used: number
}

export interface FarmerReview {
  id: string
  user: string
  rating: number
  date: string
  product: string
  comment: string
}

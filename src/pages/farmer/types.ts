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
    | 'SHIPPING_TO_WAREHOUSE'
    | 'ARRIVED_AT_WAREHOUSE'
    | 'DELIVERED'
    | 'CANCELLED'
  time: string
  payment: string
}

export interface FarmerVehicle {
  id: string
  number: string
  type: string
  capacity: string
  status: 'Sẵn sàng' | 'Đang chở hàng' | 'Bảo dưỡng'
}

export interface FarmerTrip {
  id: string
  origin: string
  destination: string
  departureTime: string
  vehicle: string
  weight: string
  status: 'Đang chuẩn bị' | 'Đang di chuyển' | 'Đã nhập kho'
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

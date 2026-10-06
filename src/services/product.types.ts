export interface ProductImageResponse {
  id: number
  imageUrl: string
  isPrimary?: boolean
  displayOrder?: number
}

export interface ProductResponse {
  id: number
  productName: string
  name?: string
  description?: string
  price: number
  originalPrice?: number
  sellingPrice?: number
  salePrice?: number
  pricePerKg?: number
  discountPercent?: number
  discountEndDate?: string
  stock: number
  stockKg?: number
  stockQuantity?: number
  minOrderKg?: number
  expiryDate?: string
  unit: string
  category?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE'
  shopName?: string
  shopId?: number
  shopOwnerId?: number
  createdAt: string
  image?: string
  imageUrl?: string
  primaryImageUrl?: string
  images?: ProductImageResponse[]
  region?: string
  defectReason?: string
}

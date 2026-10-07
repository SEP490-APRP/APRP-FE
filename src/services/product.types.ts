import type { CategoryResponse } from './category.types'

export type ProductStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'INACTIVE'

export interface ShopSummaryResponse {
  id: number
  fullName?: string
  shopName?: string
  phoneNumber?: string
  address?: string
}

export interface ProductImageResponse {
  id: number
  imageUrl: string
  isPrimary?: boolean
  displayOrder?: number
  createdAt?: string
}

export interface ProductImageCreationRequest {
  imageUrl: string
  isPrimary?: boolean
  displayOrder?: number
}

export interface ProductImageUpdateRequest {
  imageUrl?: string
  isPrimary?: boolean
  displayOrder?: number
}

export interface ProductCreationRequest {
  productName: string
  categoryId: number
  unit: string
  sellingPrice: number
  stockQuantity: number
  description?: string
  expiryDate: string // YYYY-MM-DD
  discountPercent?: number
  discountStartDate?: string
  discountEndDate?: string
}

export interface ProductUpdateRequest {
  productName: string
  categoryId: number
  unit: string
  sellingPrice: number
  stockQuantity: number
  description?: string
  status?: string
  expiryDate: string // YYYY-MM-DD
  discountPercent?: number
  discountStartDate?: string
  discountEndDate?: string
}

export interface GetMyProductsParams {
  status?: string
  page?: number
  size?: number
}

export interface ProductResponse {
  productId?: number
  id: number
  productName: string
  name?: string
  description?: string
  unit: string
  sellingPrice?: number
  price: number
  salePrice?: number
  pricePerKg?: number
  originalPrice?: number
  stockQuantity?: number
  stock: number
  stockKg?: number
  minOrderKg?: number
  discountPercent?: number
  discountStartDate?: string
  discountEndDate?: string
  expiryDate?: string
  status: ProductStatus
  rejectReason?: string
  defectReason?: string
  category?: CategoryResponse | string
  categoryId?: number
  shop?: ShopSummaryResponse
  shopName?: string
  shopId?: number
  shopOwnerId?: number
  images?: ProductImageResponse[]
  image?: string
  imageUrl?: string
  primaryImageUrl?: string
  region?: string
  updatedAt?: string
  createdAt?: string
}

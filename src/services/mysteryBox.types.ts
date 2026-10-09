export interface ProductMysteryItem {
  productId: number
  productName: string
  quantity: number
  sellingPrice?: number
}

export interface MysteryBox {
  mysteryId: number
  id?: number
  shopId: number
  shopOwnerId?: number
  shopName?: string
  boxType: string
  imageUrl?: string
  price: number
  description?: string
  note?: string
  isActive?: boolean
  status?: string
  totalQuantity?: number
  soldQuantity?: number
  items?: ProductMysteryItem[]
}

export interface MysteryBoxCreationRequest {
  boxType: string
  price: number
  description?: string
  note?: string
  totalQuantity: number
  items: { productId: number; quantity: number }[]
}

export interface MysteryBoxUpdateRequest {
  boxType?: string
  price?: number
  description?: string
  note?: string
  totalQuantity?: number
  items?: { productId: number; quantity: number }[]
}

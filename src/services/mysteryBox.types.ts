export interface ProductMysteryItemRequest {
  productId: number
  productQuantity: number
}

export interface ProductMysteryResponse {
  mysteryItemId?: number
  productId: number
  productName?: string
  productQuantity: number
  unit?: string
  price?: number
}

export interface MysteryBoxCreationRequest {
  boxType: string
  imageUrl?: string
  price: number
  description?: string
  note?: string
  totalQuantity: number
  items: ProductMysteryItemRequest[]
}

export interface MysteryBoxUpdateRequest {
  boxType?: string
  imageUrl?: string
  price?: number
  description?: string
  note?: string
  totalQuantity?: number
  items?: ProductMysteryItemRequest[]
}

export interface MysteryBox {
  id: number
  mysteryId?: number
  boxType: string
  price: number
  description?: string
  imageUrl?: string
  note?: string
  isActive?: boolean
  totalQuantity?: number
  soldQuantity?: number
  shopId?: number
  shopOwnerId?: number
  shopName?: string
  status?: string
  items?: ProductMysteryResponse[]
}

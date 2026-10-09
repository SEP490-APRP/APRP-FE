export interface ProductComboItem {
  productId: number
  productName: string
  price: number
  quantity: number
}

export interface BuildCombo {
  comboId: number
  id?: number
  comboName: string
  price: number
  description?: string
  type?: string
  mealType?: string
  region?: string
  totalQuantity?: number
  soldQuantity?: number
  status?: string
  imageUrl?: string
  shop?: {
    id: number
    shopName?: string
    avatar?: string
  }
  items?: ProductComboItem[]
}

export interface BuildComboCreationRequest {
  comboName: string
  price: number
  description?: string
  type?: string
  mealType?: string
  region?: string
  totalQuantity: number
  imageUrl?: string
  items: { productId: number; quantity: number }[]
}

export interface BuildComboUpdateRequest extends BuildComboCreationRequest {
  status?: string
}

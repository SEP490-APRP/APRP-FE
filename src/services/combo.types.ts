export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'

export interface ProductComboItemRequest {
  productId: number
  productQuantity: number
}

export interface ProductComboResponse {
  comboItemId?: number
  productId: number
  productName?: string
  productQuantity: number
  unit?: string
  price?: number
}

export interface BuildComboCreationRequest {
  comboName: string
  price: number
  description?: string
  type?: string
  mealType: MealType
  region?: string
  totalQuantity: number
  imageUrl?: string
  items: ProductComboItemRequest[]
}

export interface BuildComboUpdateRequest {
  comboName?: string
  price?: number
  description?: string
  type?: string
  mealType?: MealType
  region?: string
  totalQuantity?: number
  imageUrl?: string
  items?: ProductComboItemRequest[]
}

export interface BuildComboResponse {
  comboId: number
  comboName: string
  price: number
  description?: string
  type?: string
  mealType: MealType
  region?: string
  totalQuantity: number
  soldQuantity?: number
  status?: string
  imageUrl?: string
  items?: ProductComboResponse[]
}

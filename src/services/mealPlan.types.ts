export type PlanStatus = 'DRAFT' | 'AI_DRAFT' | 'CONFIRMED' | 'ARCHIVED'
export type PlanSource = 'MANUAL' | 'AI'
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'

export interface PlanMealItemResponse {
  id: number
  comboId: number
  comboName: string
  imageUrl?: string
  quantity: number
  unitPriceSnapshot: number
  isAiSuggested?: boolean
  userOverride?: boolean
  position?: number
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

export interface PlanMealResponse {
  id: number
  mealType: MealType
  sortOrder?: number
  completed: boolean
  planMealItems: PlanMealItemResponse[]
}

export interface PlanDayResponse {
  id: number
  dayIndex: number
  date?: string
  planMeals: PlanMealResponse[]
}

export interface BuildPlanResponse {
  planId: number
  buyerId: number
  planName: string
  numberOfDays: number
  numberOfPeople: number
  targetBudget?: number
  mealType?: string
  status: PlanStatus
  source: PlanSource
  createdAt: string
  updatedAt: string
  totalEstimatedPrice?: number
  totalCalories?: number
  totalProtein?: number
  totalCarbs?: number
  totalFat?: number
  planDays: PlanDayResponse[]
}

export interface ShoppingListItemResponse {
  comboId: number
  comboName: string
  imageUrl?: string
  shopId?: number
  shopName?: string
  totalQuantity: number
  unitPrice: number
  subtotal: number
  stockAvailable: number
  inStock: boolean
}

export interface ShoppingListResponse {
  planId: number
  planName: string
  totalEstimatedPrice: number
  totalCombosCount: number
  allInStock: boolean
  items: ShoppingListItemResponse[]
}

export interface PlanGenerateRequest {
  goal: string
  numberOfDays: number
  numberOfPeople: number
  targetBudget?: number
  preferredMealTypes?: MealType[]
  extraNotes?: string
}

export interface ManualPlanCreateRequest {
  planName: string
  numberOfDays: number
  numberOfPeople: number
  targetBudget?: number
  mealType?: string
}

export interface PlanHeaderUpdateRequest {
  planName?: string
  targetBudget?: number
}

export interface AddMealItemRequest {
  comboId: number
  quantity?: number
}

export interface ReplaceMealItemRequest {
  newComboId: number
  quantity?: number
}

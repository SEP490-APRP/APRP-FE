export interface Allergen {
  id: number
  name: string
  allergenKey?: string
  allergenName?: string
  description?: string
}

export interface HealthCondition {
  id: number
  name: string
  conditionKey?: string
  conditionName?: string
  description?: string
}

export interface UserHealthProfile {
  buyerId: number
  dietPreference?: 'VEGETARIAN' | 'NON_VEGETARIAN' | 'VEGAN' | string
  allergens: Allergen[]
  healthConditions: HealthCondition[]
}

export interface ExtractedPlanRequest {
  goal?: string
  numberOfDays?: number
  numberOfPeople?: number
  targetBudget?: number
}

export interface ProfileExtraction {
  addAllergies?: string[]
  removeAllergies?: string[]
  addConditions?: string[]
  removeConditions?: string[]
  dietPreference?: string
  planRequest?: ExtractedPlanRequest
  advice?: string
  notes?: string
  suggestedOptions?: string[]
  needsClarification?: boolean
}

export interface HealthProfileExtractRequest {
  text: string
}

export interface HealthProfileExtractResponse {
  requestId: number
  diff: ProfileExtraction
  currentProfile?: UserHealthProfile
  planRequest?: ExtractedPlanRequest
  needsClarification?: boolean
}

export interface ConfirmHealthProfileRequest {
  diff?: ProfileExtraction
}

export interface ManualHealthProfileUpdateRequest {
  dietPreference?: string
  allergenIds?: number[]
  conditionIds?: number[]
}

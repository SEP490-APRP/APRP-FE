import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  mealPlanService,
  healthProfileService,
  type PlanStatus,
  type PlanGenerateRequest,
  type AddMealItemRequest,
  type ReplaceMealItemRequest,
  type HealthProfileExtractRequest,
  type ConfirmHealthProfileRequest,
  type ManualHealthProfileUpdateRequest,
} from '@/services'

export const MEAL_PLAN_KEYS = {
  all: ['meal-plans'] as const,
  lists: () => [...MEAL_PLAN_KEYS.all, 'list'] as const,
  list: (status?: PlanStatus, page?: number) => [...MEAL_PLAN_KEYS.lists(), { status, page }] as const,
  details: () => [...MEAL_PLAN_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...MEAL_PLAN_KEYS.details(), id] as const,
  shoppingList: (id: number) => [...MEAL_PLAN_KEYS.detail(id), 'shopping-list'] as const,
}

export const HEALTH_PROFILE_KEYS = {
  profile: ['health-profile'] as const,
  allergens: ['allergens'] as const,
  conditions: ['health-conditions'] as const,
}

/** Hook lấy danh sách kế hoạch của Buyer */
export function useMyPlans(status?: PlanStatus, page = 1, size = 10) {
  return useQuery({
    queryKey: MEAL_PLAN_KEYS.list(status, page),
    queryFn: () => mealPlanService.getMyPlans({ status, page, size }),
  })
}

/** Hook lấy chi tiết một kế hoạch */
export function useMealPlanDetail(planId: number | null) {
  return useQuery({
    queryKey: MEAL_PLAN_KEYS.detail(planId ?? 0),
    queryFn: () => mealPlanService.getPlanById(planId!),
    enabled: !!planId && planId > 0,
  })
}

/** Hook lấy Shopping List */
export function useShoppingList(planId: number | null) {
  return useQuery({
    queryKey: MEAL_PLAN_KEYS.shoppingList(planId ?? 0),
    queryFn: () => mealPlanService.getShoppingList(planId!),
    enabled: !!planId && planId > 0,
  })
}

/** Hook sinh kế hoạch AI */
export function useGenerateAiPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: PlanGenerateRequest) => mealPlanService.generateAiPlan(req),
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.all })
      queryClient.setQueryData(MEAL_PLAN_KEYS.detail(newPlan.planId), newPlan)
    },
  })
}

/** Hook xác nhận kế hoạch */
export function useConfirmPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (planId: number) => mealPlanService.confirmPlan(planId),
    onSuccess: (_, planId) => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.detail(planId) })
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.lists() })
    },
  })
}

/** Hook lưu trữ kế hoạch */
export function useArchivePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (planId: number) => mealPlanService.archivePlan(planId),
    onSuccess: (_, planId) => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.detail(planId) })
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.lists() })
    },
  })
}

/** Hook xóa kế hoạch */
export function useDeletePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (planId: number) => mealPlanService.deletePlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.all })
    },
  })
}

/** Hook tick hoàn thành bữa ăn */
export function useToggleMealCompleted(planId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ mealId, completed }: { mealId: number; completed: boolean }) =>
      mealPlanService.toggleMealCompleted(mealId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.detail(planId) })
    },
  })
}

/** Hook sinh lại bữa ăn bằng AI */
export function useRegenerateMeal(planId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (mealId: number) => mealPlanService.regenerateMeal(planId, mealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.detail(planId) })
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.shoppingList(planId) })
    },
  })
}

/** Hook đổi combo trong bữa ăn */
export function useReplaceMealItem(planId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      mealId,
      itemId,
      request,
    }: {
      mealId: number
      itemId: number
      request: ReplaceMealItemRequest
    }) => mealPlanService.replaceMealItem(planId, mealId, itemId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.detail(planId) })
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.shoppingList(planId) })
    },
  })
}

/** Hook cập nhật số lượng combo */
export function useUpdateMealItemQuantity(planId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      mealId,
      itemId,
      quantity,
    }: {
      mealId: number
      itemId: number
      quantity: number
    }) => mealPlanService.updateMealItemQuantity(planId, mealId, itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.detail(planId) })
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.shoppingList(planId) })
    },
  })
}

/** Hook xóa combo khỏi bữa ăn */
export function useRemoveMealItem(planId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ mealId, itemId }: { mealId: number; itemId: number }) =>
      mealPlanService.removeMealItem(planId, mealId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.detail(planId) })
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.shoppingList(planId) })
    },
  })
}

/** Hook thêm vào giỏ hàng từ kế hoạch */
export function useAddPlanToCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (planId: number) => mealPlanService.addPlanToCart(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

/** Hook lấy hồ sơ sức khỏe */
export function useHealthProfile() {
  return useQuery({
    queryKey: HEALTH_PROFILE_KEYS.profile,
    queryFn: () => healthProfileService.getMyProfile(),
  })
}

/** Hook trích xuất hồ sơ sức khỏe bằng AI (Flow A) */
export function useExtractHealthProfile() {
  return useMutation({
    mutationFn: (req: HealthProfileExtractRequest) => healthProfileService.extractProfile(req),
  })
}

/** Hook xác nhận hồ sơ sức khỏe (Flow A Gatekeeper) */
export function useConfirmHealthProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: number; data: ConfirmHealthProfileRequest }) =>
      healthProfileService.confirmProfileUpdate(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HEALTH_PROFILE_KEYS.profile })
    },
  })
}

/** Hook cập nhật thủ công hồ sơ sức khỏe */
export function useUpdateHealthProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ManualHealthProfileUpdateRequest) => healthProfileService.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HEALTH_PROFILE_KEYS.profile })
    },
  })
}

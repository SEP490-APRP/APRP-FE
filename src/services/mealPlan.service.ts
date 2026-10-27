import axiosInstance from '@/services/api/axiosInstance'
import { unwrap } from '@/services/api/apiUtils'
import type { PageResponse } from '@/types'
import type {
  BuildPlanResponse,
  PlanMealResponse,
  ShoppingListResponse,
  PlanGenerateRequest,
  ManualPlanCreateRequest,
  PlanHeaderUpdateRequest,
  AddMealItemRequest,
  ReplaceMealItemRequest,
  PlanPreCheckRequest,
  PlanPreCheckResponse,
  PlanCopilotChatRequest,
  PlanCopilotChatResponse,
  PlanCopilotApplyRequest,
  PlanStatus,
} from './mealPlan.types'

export type * from './mealPlan.types'

export const mealPlanService = {
  // Tiền kiểm tra tính khả thi ngân sách & khẩu phần AI (Pre-check)
  async preCheckPlan(request: PlanPreCheckRequest): Promise<PlanPreCheckResponse> {
    const res = await axiosInstance.post('/build-plans/pre-check', request)
    return unwrap<PlanPreCheckResponse>(res)
  },

  // Flow B: Sinh kế hoạch thực đơn AI từ kho combo
  async generateAiPlan(request: PlanGenerateRequest): Promise<BuildPlanResponse> {
    const res = await axiosInstance.post('/build-plans/generate', request, { timeout: 60_000 })
    return unwrap<BuildPlanResponse>(res)
  },

  // Tạo kế hoạch thủ công
  async createManualPlan(request: ManualPlanCreateRequest): Promise<BuildPlanResponse> {
    const res = await axiosInstance.post('/build-plans', request)
    return unwrap<BuildPlanResponse>(res)
  },

  // Lấy danh sách kế hoạch của Buyer (có phân trang & lọc trạng thái)
  async getMyPlans(params?: {
    status?: PlanStatus
    page?: number
    size?: number
  }): Promise<PageResponse<BuildPlanResponse>> {
    const res = await axiosInstance.get('/build-plans', {
      params: {
        page: params?.page ?? 1,
        size: params?.size ?? 10,
        status: params?.status,
      },
    })
    return unwrap<PageResponse<BuildPlanResponse>>(res)
  },

  // Chi tiết kế hoạch
  async getPlanById(id: number): Promise<BuildPlanResponse> {
    const res = await axiosInstance.get(`/build-plans/${id}`)
    return unwrap<BuildPlanResponse>(res)
  },

  // Cập nhật tiêu đề & ngân sách
  async updatePlanHeader(id: number, request: PlanHeaderUpdateRequest): Promise<BuildPlanResponse> {
    const res = await axiosInstance.patch(`/build-plans/${id}`, request)
    return unwrap<BuildPlanResponse>(res)
  },

  // Xóa kế hoạch nháp
  async deletePlan(id: number): Promise<void> {
    const res = await axiosInstance.delete(`/build-plans/${id}`)
    return unwrap<void>(res)
  },

  // Xác nhận kế hoạch (DRAFT / AI_DRAFT -> CONFIRMED)
  async confirmPlan(id: number): Promise<BuildPlanResponse> {
    const res = await axiosInstance.post(`/build-plans/${id}/confirm`)
    return unwrap<BuildPlanResponse>(res)
  },

  // Lưu trữ kế hoạch (CONFIRMED -> ARCHIVED)
  async archivePlan(id: number): Promise<BuildPlanResponse> {
    const res = await axiosInstance.post(`/build-plans/${id}/archive`)
    return unwrap<BuildPlanResponse>(res)
  },

  // Tick hoàn thành bữa ăn
  async toggleMealCompleted(mealId: number, completed: boolean): Promise<PlanMealResponse> {
    const res = await axiosInstance.patch(`/plan-meals/${mealId}/completed`, { completed })
    return unwrap<PlanMealResponse>(res)
  },

  // Thêm combo vào bữa ăn
  async addMealItem(planId: number, mealId: number, request: AddMealItemRequest): Promise<PlanMealResponse> {
    const res = await axiosInstance.post(`/build-plans/${planId}/meals/${mealId}/items`, request)
    return unwrap<PlanMealResponse>(res)
  },

  // Đổi combo trong bữa ăn
  async replaceMealItem(
    planId: number,
    mealId: number,
    itemId: number,
    request: ReplaceMealItemRequest,
  ): Promise<PlanMealResponse> {
    const res = await axiosInstance.put(`/build-plans/${planId}/meals/${mealId}/items/${itemId}`, request)
    return unwrap<PlanMealResponse>(res)
  },

  // Cập nhật số lượng combo
  async updateMealItemQuantity(
    planId: number,
    mealId: number,
    itemId: number,
    quantity: number,
  ): Promise<PlanMealResponse> {
    const res = await axiosInstance.patch(`/build-plans/${planId}/meals/${mealId}/items/${itemId}/quantity`, {
      quantity,
    })
    return unwrap<PlanMealResponse>(res)
  },

  // Xóa combo khỏi bữa ăn
  async removeMealItem(planId: number, mealId: number, itemId: number): Promise<PlanMealResponse> {
    const res = await axiosInstance.delete(`/build-plans/${planId}/meals/${mealId}/items/${itemId}`)
    return unwrap<PlanMealResponse>(res)
  },

  // Sinh lại riêng bữa ăn bằng AI
  async regenerateMeal(planId: number, mealId: number): Promise<PlanMealResponse> {
    const res = await axiosInstance.post(`/build-plans/${planId}/meals/${mealId}/regenerate`)
    return unwrap<PlanMealResponse>(res)
  },

  // Lấy danh sách mua sắm (Shopping List)
  async getShoppingList(planId: number): Promise<ShoppingListResponse> {
    const res = await axiosInstance.get(`/build-plans/${planId}/shopping-list`)
    return unwrap<ShoppingListResponse>(res)
  },

  // Thêm toàn bộ combo còn hàng vào giỏ hàng
  async addPlanToCart(planId: number): Promise<ShoppingListResponse> {
    const res = await axiosInstance.post(`/build-plans/${planId}/add-to-cart`)
    return unwrap<ShoppingListResponse>(res)
  },

  // Trò chuyện tương tác với AI Co-pilot
  async copilotChat(planId: number, request: PlanCopilotChatRequest): Promise<PlanCopilotChatResponse> {
    const res = await axiosInstance.post(`/build-plans/${planId}/copilot-chat`, request)
    return unwrap<PlanCopilotChatResponse>(res)
  },

  // Áp dụng đề xuất từ AI Co-pilot vào thực đơn
  async copilotApply(planId: number, request: PlanCopilotApplyRequest): Promise<BuildPlanResponse> {
    const res = await axiosInstance.post(`/build-plans/${planId}/copilot-apply`, request)
    return unwrap<BuildPlanResponse>(res)
  },
}

import type { ApiResponse } from '@/types'
import type {
  BuildComboResponse,
  BuildComboCreationRequest,
  BuildComboUpdateRequest,
} from './combo.types'
import { axiosInstance } from './api/axiosInstance'

export type * from './combo.types'

export const comboService = {
  async getCombos(params?: {
    status?: string
    mealType?: string
    region?: string
    type?: string
    keyword?: string
    page?: number
    size?: number
  }): Promise<ApiResponse<{ content: BuildComboResponse[]; totalElements?: number }>> {
    const res = await axiosInstance.get<ApiResponse<{ content: BuildComboResponse[]; totalElements?: number }>>(
      '/combos',
      { params },
    )
    return res.data
  },

  async getMyCombos(params?: {
    status?: string
    mealType?: string
    page?: number
    size?: number
  }): Promise<ApiResponse<{ content: BuildComboResponse[]; totalElements?: number }>> {
    const res = await axiosInstance.get<ApiResponse<{ content: BuildComboResponse[]; totalElements?: number }>>(
      '/combos/my-shop',
      { params },
    )
    return res.data
  },

  async getComboById(id: number): Promise<ApiResponse<BuildComboResponse>> {
    const res = await axiosInstance.get<ApiResponse<BuildComboResponse>>(`/combos/${id}`)
    return res.data
  },

  async createCombo(data: BuildComboCreationRequest): Promise<ApiResponse<BuildComboResponse>> {
    const res = await axiosInstance.post<ApiResponse<BuildComboResponse>>('/combos', data)
    return res.data
  },

  async updateCombo(id: number, data: BuildComboUpdateRequest): Promise<ApiResponse<BuildComboResponse>> {
    const res = await axiosInstance.put<ApiResponse<BuildComboResponse>>(`/combos/${id}`, data)
    return res.data
  },

  async toggleStatus(id: number, status: string): Promise<ApiResponse<BuildComboResponse>> {
    const res = await axiosInstance.patch<ApiResponse<BuildComboResponse>>(`/combos/${id}/status`, null, {
      params: { status },
    })
    return res.data
  },

  async deleteCombo(id: number): Promise<ApiResponse<string>> {
    const res = await axiosInstance.delete<ApiResponse<string>>(`/combos/${id}`)
    return res.data
  },
}

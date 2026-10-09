import axiosInstance from '@/services/api/axiosInstance'
import { unwrap } from '@/services/api/apiUtils'
import type { PageResponse } from '@/types'
import type { BuildCombo, BuildComboCreationRequest, BuildComboUpdateRequest } from './combo.types'

export type * from './combo.types'

export const comboService = {
  // Lấy danh sách build combo công khai
  async getCombos(params?: {
    status?: string
    mealType?: string
    region?: string
    type?: string
    keyword?: string
    page?: number
    size?: number
  }): Promise<PageResponse<BuildCombo>> {
    const res = await axiosInstance.get('/combos', {
      params: {
        page: params?.page ?? 1,
        size: params?.size ?? 50,
        status: params?.status ?? 'ACTIVE',
        ...params,
      },
    })
    return unwrap<PageResponse<BuildCombo>>(res)
  },

  // Chi tiết 1 combo
  async getById(id: number): Promise<BuildCombo> {
    const res = await axiosInstance.get(`/combos/${id}`)
    return unwrap<BuildCombo>(res)
  },

  // Lấy danh sách combo của shop đang đăng nhập
  async getMyShopCombos(params?: {
    status?: string
    mealType?: string
    page?: number
    size?: number
  }): Promise<PageResponse<BuildCombo>> {
    const res = await axiosInstance.get('/combos/my-shop', {
      params: {
        page: params?.page ?? 1,
        size: params?.size ?? 10,
        ...params,
      },
    })
    return unwrap<PageResponse<BuildCombo>>(res)
  },

  // Shop tạo combo
  async createCombo(data: BuildComboCreationRequest): Promise<BuildCombo> {
    const res = await axiosInstance.post('/combos', data)
    return unwrap<BuildCombo>(res)
  },

  // Shop cập nhật combo
  async updateCombo(id: number, data: BuildComboUpdateRequest): Promise<BuildCombo> {
    const res = await axiosInstance.put(`/combos/${id}`, data)
    return unwrap<BuildCombo>(res)
  },

  // Shop đổi trạng thái combo
  async updateStatus(id: number, status: string): Promise<BuildCombo> {
    const res = await axiosInstance.patch(`/combos/${id}/status`, null, {
      params: { status },
    })
    return unwrap<BuildCombo>(res)
  },

  // Shop xóa combo
  async deleteCombo(id: number): Promise<void> {
    const res = await axiosInstance.delete(`/combos/${id}`)
    return unwrap<void>(res)
  },
}

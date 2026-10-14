import type { ApiResponse } from '@/types'
import type {
  MysteryBox,
  MysteryBoxCreationRequest,
  MysteryBoxUpdateRequest,
} from './mysteryBox.types'
import { axiosInstance } from './api/axiosInstance'
import { mockMysteryBoxes } from '@/mocks/mysteryBox.mock'

export type * from './mysteryBox.types'

export const mysteryBoxService = {
  async getForBuyer(): Promise<ApiResponse<MysteryBox[]>> {
    try {
      const res = await axiosInstance.get<ApiResponse<{ content: MysteryBox[] }>>('/mystery-boxes')
      if (res.data?.result?.content) {
        return { code: 200, result: res.data.result.content }
      }
    } catch {
      // Fallback mock nếu API chưa có data
    }
    return { code: 200, result: [...mockMysteryBoxes] }
  },

  async getMyMysteryBoxes(page = 1, size = 10): Promise<ApiResponse<{ content: MysteryBox[]; totalElements?: number }>> {
    const res = await axiosInstance.get<ApiResponse<{ content: MysteryBox[]; totalElements?: number }>>(
      '/mystery-boxes/my-shop',
      { params: { page, size } },
    )
    return res.data
  },

  async createMysteryBox(data: MysteryBoxCreationRequest): Promise<ApiResponse<MysteryBox>> {
    const res = await axiosInstance.post<ApiResponse<MysteryBox>>('/mystery-boxes', data)
    return res.data
  },

  async updateMysteryBox(id: number, data: MysteryBoxUpdateRequest): Promise<ApiResponse<MysteryBox>> {
    const res = await axiosInstance.put<ApiResponse<MysteryBox>>(`/mystery-boxes/${id}`, data)
    return res.data
  },

  async toggleStatus(id: number, isActive: boolean): Promise<ApiResponse<MysteryBox>> {
    const res = await axiosInstance.patch<ApiResponse<MysteryBox>>(
      `/mystery-boxes/${id}/status`,
      null,
      { params: { isActive } },
    )
    return res.data
  },

  async deleteMysteryBox(id: number): Promise<ApiResponse<void>> {
    const res = await axiosInstance.delete<ApiResponse<void>>(`/mystery-boxes/${id}`)
    return res.data
  },
}

import axiosInstance from '@/services/api/axiosInstance'
import { unwrap } from '@/services/api/apiUtils'
import type { ApiResponse, PageResponse } from '@/types'
import type { MysteryBox, MysteryBoxCreationRequest, MysteryBoxUpdateRequest } from './mysteryBox.types'

export type * from './mysteryBox.types'

export const mysteryBoxService = {
  // Lấy danh sách mystery box công khai cho buyer
  async getForBuyer(params?: {
    shopId?: number
    boxType?: string
    isActive?: boolean
    page?: number
    size?: number
  }): Promise<PageResponse<MysteryBox>> {
    const res = await axiosInstance.get('/mystery-boxes', {
      params: {
        page: params?.page ?? 1,
        size: params?.size ?? 50,
        isActive: params?.isActive ?? true,
        ...params,
      },
    })
    return unwrap<PageResponse<MysteryBox>>(res)
  },

  // Chi tiết 1 mystery box
  async getById(id: number): Promise<MysteryBox> {
    const res = await axiosInstance.get(`/mystery-boxes/${id}`)
    return unwrap<MysteryBox>(res)
  },

  // Lấy danh sách mystery box của shop đang đăng nhập
  async getMyShopBoxes(page = 1, size = 10): Promise<PageResponse<MysteryBox>> {
    const res = await axiosInstance.get('/mystery-boxes/my-shop', {
      params: { page, size },
    })
    return unwrap<PageResponse<MysteryBox>>(res)
  },

  // Shop tạo mới mystery box
  async createMysteryBox(data: MysteryBoxCreationRequest): Promise<MysteryBox> {
    const res = await axiosInstance.post('/mystery-boxes', data)
    return unwrap<MysteryBox>(res)
  },

  // Shop cập nhật mystery box
  async updateMysteryBox(id: number, data: MysteryBoxUpdateRequest): Promise<MysteryBox> {
    const res = await axiosInstance.put(`/mystery-boxes/${id}`, data)
    return unwrap<MysteryBox>(res)
  },

  // Shop bật / tắt trạng thái
  async toggleStatus(id: number, isActive: boolean): Promise<MysteryBox> {
    const res = await axiosInstance.patch(`/mystery-boxes/${id}/status`, null, {
      params: { isActive },
    })
    return unwrap<MysteryBox>(res)
  },

  // Shop xóa mystery box
  async deleteMysteryBox(id: number): Promise<void> {
    const res = await axiosInstance.delete(`/mystery-boxes/${id}`)
    return unwrap<void>(res)
  },
}

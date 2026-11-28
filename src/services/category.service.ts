import type { ApiResponse } from '@/types'
import type { CategoryResponse } from './category.types'
import { axiosInstance } from './api/axiosInstance'

export type * from './category.types'

export const categoryService = {
  async getAll(): Promise<ApiResponse<CategoryResponse[]>> {
    try {
      const response = await axiosInstance.get<ApiResponse<CategoryResponse[]>>('/categories')
      const result = response.data.result
      if (Array.isArray(result)) {
        return response.data
      }
    } catch (e) {
      console.warn('Cannot fetch categories from backend API:', e)
    }
    return { code: 1000, result: [] }
  },

  /** Chỉ lấy danh mục thật trong DB (không dùng dữ liệu mẫu): dùng ở form cần lưu categoryId */
  async getAllFromServer(): Promise<CategoryResponse[]> {
    const response = await axiosInstance.get<ApiResponse<CategoryResponse[]>>('/categories')
    return Array.isArray(response.data.result) ? response.data.result : []
  },

  async getById(id: number): Promise<ApiResponse<CategoryResponse | null>> {
    try {
      const response = await axiosInstance.get<ApiResponse<CategoryResponse>>(`/categories/${id}`)
      if (response.data.result) {
        return response.data
      }
    } catch (e) {
      console.warn(`Cannot fetch category id ${id} from backend API:`, e)
    }
    return { code: 1000, result: null }
  },
}

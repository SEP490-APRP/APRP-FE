import type { ApiResponse } from '@/types'
import type { CategoryResponse } from './category.types'
import { axiosInstance } from './api/axiosInstance'
import { ENV } from '@/utils'

export type * from './category.types'

const MOCK_CATEGORIES: CategoryResponse[] = [
  { categoryId: 1, name: 'Rau ăn lá', description: 'Các loại rau xanh thu hoạch tươi sáng sớm' },
  { categoryId: 2, name: 'Củ quả vườn', description: 'Củ và quả sạch tự nhiên giải cứu từ nhà vườn' },
  { categoryId: 3, name: 'Trái cây theo mùa', description: 'Hoa quả đặc sản các vùng miền vào vụ thu hoạch' },
  { categoryId: 4, name: 'Nông sản hữu cơ', description: 'Nông sản canh tác chuẩn VietGAP & Organic' },
  { categoryId: 5, name: 'Nấm & Thực vật', description: 'Các loại nấm tươi sạch giàu dinh dưỡng' },
  { categoryId: 6, name: 'Đặc sản Đà Lạt', description: 'Rau củ ôn đới chuyển trực tiếp từ Đà Lạt' },
]

export const categoryService = {
  async getAll(): Promise<ApiResponse<CategoryResponse[]>> {
    const response = await axiosInstance.get<ApiResponse<CategoryResponse[]>>('/categories')
    const result = response.data.result
    return {
      ...response.data,
      result: Array.isArray(result) ? result : [],
    }
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

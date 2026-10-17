import axiosInstance from '@/services/api/axiosInstance'
import { unwrap } from '@/services/api/apiUtils'
import type {
  Allergen,
  HealthCondition,
  UserHealthProfile,
  HealthProfileExtractRequest,
  HealthProfileExtractResponse,
  ConfirmHealthProfileRequest,
  ManualHealthProfileUpdateRequest,
} from './healthProfile.types'

export type * from './healthProfile.types'

export const healthProfileService = {
  // Lấy danh mục dị ứng
  async getAllergens(): Promise<Allergen[]> {
    const res = await axiosInstance.get('/allergens')
    return unwrap<Allergen[]>(res)
  },

  // Lấy danh mục bệnh lý / tình trạng sức khỏe
  async getHealthConditions(): Promise<HealthCondition[]> {
    const res = await axiosInstance.get('/health-conditions')
    return unwrap<HealthCondition[]>(res)
  },

  // Lấy hồ sơ sức khỏe hiện tại của Buyer
  async getMyProfile(): Promise<UserHealthProfile> {
    const res = await axiosInstance.get('/health-profile/me')
    return unwrap<UserHealthProfile>(res)
  },

  // Cập nhật thủ công hồ sơ sức khỏe
  async updateMyProfile(data: ManualHealthProfileUpdateRequest): Promise<UserHealthProfile> {
    const res = await axiosInstance.put('/health-profile/me', data)
    return unwrap<UserHealthProfile>(res)
  },

  // Flow A: Trích xuất dị ứng & bệnh lý bằng AI từ đoạn mô tả tự do
  async extractProfile(data: HealthProfileExtractRequest): Promise<HealthProfileExtractResponse> {
    const res = await axiosInstance.post('/health-profile/extract', data)
    return unwrap<HealthProfileExtractResponse>(res)
  },

  // Flow A: Buyer xác nhận cập nhật hồ sơ sau khi xem bảng diff của AI
  async confirmProfileUpdate(requestId: number, data: ConfirmHealthProfileRequest): Promise<UserHealthProfile> {
    const res = await axiosInstance.post(`/health-profile/requests/${requestId}/confirm`, data)
    return unwrap<UserHealthProfile>(res)
  },
}

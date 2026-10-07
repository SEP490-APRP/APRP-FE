import type { ApiResponse } from '@/types'
import type { UserResponse } from './user.types'
import { STORAGE_KEYS } from '@/utils'
import { readStoredUser } from '@/stores'

export type { UserResponse }

export const authService = {
  getUserInfo(): UserResponse | null {
    const user = readStoredUser()
    if (!user) return null
    return {
      id: Number(user.id) || 1,
      fullName: user.name,
      email: user.email,
      phoneNumber: user.phone,
      status: 'ACTIVE',
      role: { name: user.role.toUpperCase() },
      kycStatus: user.kycStatus ?? 'APPROVED',
      vehicleNumber: '59A-888.88',
      ratingAverage: 4.9,
      address: 'TP. Hồ Chí Minh',
    }
  },

  async getMyInfo(): Promise<ApiResponse<UserResponse>> {
    const info = this.getUserInfo()
    if (info) {
      return { code: 200, result: info }
    }
    return {
      code: 200,
      result: {
        id: 1,
        fullName: 'Shipper CapNong',
        email: 'shipper@capnong.vn',
        phoneNumber: '0933 555 789',
        status: 'ACTIVE',
        role: { name: 'SHIPPER' },
        kycStatus: 'APPROVED',
        vehicleNumber: '59A-888.88',
        ratingAverage: 4.9,
        address: 'TP. Hồ Chí Minh',
      },
    }
  },

  getToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN)
    } catch {
      return null
    }
  },
}

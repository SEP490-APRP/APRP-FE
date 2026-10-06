import type { ApiResponse, PageResponse } from '@/types'
import type { AdminUserReport, UserResponse } from './user.types'
import { mockReportData, mockUsers } from '@/mocks/user.mock'
import { freshResponses } from '@/mocks/fresh'

export type * from './user.types'

export const userService = freshResponses({
  async getAllUsers(): Promise<ApiResponse<UserResponse[]>> {
    await new Promise((r) => setTimeout(r, 200))
    return { code: 200, result: [...mockUsers] }
  },

  async getUserById(id: number): Promise<ApiResponse<UserResponse>> {
    await new Promise((r) => setTimeout(r, 150))
    const u = mockUsers.find((user) => user.id === id) || mockUsers[0]
    return { code: 200, result: u }
  },

  async getUsersByRolePaged(
    roles: string[],
    status: string | null = null,
    page: number = 0,
    size: number = 10,
  ): Promise<ApiResponse<PageResponse<UserResponse>>> {
    await new Promise((r) => setTimeout(r, 200))
    let filtered = mockUsers.filter((u) => roles.includes(u.role?.name))
    if (status) {
      filtered = filtered.filter((u) => u.status === status)
    }
    const totalElements = filtered.length
    const totalPages = Math.ceil(totalElements / size) || 1
    const start = page * size
    const content = filtered.slice(start, start + size)

    return {
      code: 200,
      result: {
        page,
        size,
        totalElements,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
        content,
      },
    }
  },

  async approveShopOwner(userId: number): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 300))
    const target = mockUsers.find((u) => u.id === userId)
    if (target) {
      target.status = 'ACTIVE'
      target.kycStatus = 'APPROVED'
    }
    return { code: 200, result: true, message: 'Duyệt Shop thành công' }
  },

  async approveShipper(userId: number): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 300))
    const target = mockUsers.find((u) => u.id === userId)
    if (target) {
      target.status = 'ACTIVE'
      target.kycStatus = 'APPROVED'
    }
    return { code: 200, result: true, message: 'Duyệt Shipper thành công' }
  },

  async deactivateUser(userId: number): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 300))
    const target = mockUsers.find((u) => u.id === userId)
    if (target) {
      target.status = 'INACTIVE'
      target.lockedAt = new Date().toISOString()
    }
    return { code: 200, result: true, message: 'Đã khóa tài khoản' }
  },

  async activateUser(userId: number): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 300))
    const target = mockUsers.find((u) => u.id === userId)
    if (target) {
      target.status = 'ACTIVE'
      delete target.lockedAt
    }
    return { code: 200, result: true, message: 'Đã kích hoạt tài khoản' }
  },

  async getAdminUserReport(
    _type?: unknown,
    _from?: string,
    _to?: string,
  ): Promise<ApiResponse<AdminUserReport>> {
    await new Promise((r) => setTimeout(r, 300))
    return {
      code: 200,
      result: mockReportData,
    }
  },

  async generateAdminUserReport(
    _param?: unknown,
    _from?: string,
    _to?: string,
  ): Promise<ApiResponse<AdminUserReport>> {
    await new Promise((r) => setTimeout(r, 300))
    return {
      code: 200,
      result: mockReportData,
    }
  },
})

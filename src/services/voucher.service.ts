import axiosInstance from '@/services/api/axiosInstance'
import { unwrap } from '@/services/api/apiUtils'
import type { VoucherResponse, VoucherCreateRequest } from './voucher.types'

export type * from './voucher.types'

export const voucherService = {
  // 1. Lấy danh sách voucher công khai để hiển thị trên sàn
  async getPublicVouchers(): Promise<VoucherResponse[]> {
    const res = await axiosInstance.get('/vouchers')
    return unwrap<VoucherResponse[]>(res)
  },

  // 2. Buyer lưu (thu thập) mã hiển thị sẵn
  async collectVoucher(voucherId: number): Promise<void> {
    const res = await axiosInstance.post(`/vouchers/${voucherId}/collect`)
    return unwrap<void>(res)
  },

  // 3. Buyer lưu mã ẩn bằng code gõ tay
  async collectByCode(voucherCode: string): Promise<void> {
    const res = await axiosInstance.post('/vouchers/collect-by-code', null, {
      params: { voucherCode: voucherCode.trim().toUpperCase() },
    })
    return unwrap<void>(res)
  },

  // 4. Lấy danh sách ví voucher của người dùng đang đăng nhập
  async getMyVouchers(): Promise<VoucherResponse[]> {
    const res = await axiosInstance.get('/users/me/vouchers')
    return unwrap<VoucherResponse[]>(res)
  },

  // 5. SHOP: Lấy danh sách voucher quản lý của Shop
  async getShopVouchers(): Promise<VoucherResponse[]> {
    const res = await axiosInstance.get('/shop/vouchers')
    return unwrap<VoucherResponse[]>(res)
  },

  // 6. SHOP: Tạo voucher mới của Shop
  async createShopVoucher(data: VoucherCreateRequest): Promise<VoucherResponse> {
    const res = await axiosInstance.post('/shop/vouchers', data)
    return unwrap<VoucherResponse>(res)
  },

  // 7. SHOP: Bật / Tắt trạng thái voucher của Shop
  async toggleShopVoucher(voucherId: number): Promise<VoucherResponse> {
    const res = await axiosInstance.put(`/shop/vouchers/${voucherId}/toggle-status`)
    return unwrap<VoucherResponse>(res)
  },

  // 8. ADMIN: Lấy danh sách voucher toàn sàn của Admin
  async getAdminVouchers(): Promise<VoucherResponse[]> {
    const res = await axiosInstance.get('/admin/vouchers')
    return unwrap<VoucherResponse[]>(res)
  },

  // 9. ADMIN: Tạo voucher toàn sàn
  async createAdminVoucher(data: VoucherCreateRequest): Promise<VoucherResponse> {
    const res = await axiosInstance.post('/admin/vouchers', data)
    return unwrap<VoucherResponse>(res)
  },

  // 10. ADMIN: Bật / Tắt trạng thái voucher toàn sàn
  async toggleAdminVoucher(voucherId: number): Promise<VoucherResponse> {
    const res = await axiosInstance.put(`/admin/vouchers/${voucherId}/toggle-status`)
    return unwrap<VoucherResponse>(res)
  },

  // 11. Compatibility methods for storefront shop voucher queries
  async getBuyerShopVouchers(shopId: number, page = 0, size = 10): Promise<{ result: { content: VoucherResponse[]; totalPages: number } }> {
    const list = await this.getPublicVouchers()
    const shopList = list.filter((voucher) => {
      const isShopOwned = Number(voucher.shopId) === Number(shopId)
      const isShopScope = voucher.voucherScope === 'SHOP' || voucher.creatorRole === 'SHOP'
      const isPlatformScope = voucher.voucherScope === 'PLATFORM' || voucher.creatorRole === 'ADMIN'
      return isShopOwned || (isShopScope && isShopOwned) || (isPlatformScope && !isShopOwned)
    })
    const start = page * size
    const end = start + size
    const paged = shopList.slice(start, end)
    return {
      result: {
        content: paged,
        totalPages: Math.max(1, Math.ceil(shopList.length / Math.max(size, 1))),
      },
    }
  },

  async canReceiveVoucher(voucherCode: string): Promise<{ result: boolean }> {
    try {
      const myVouchers = await this.getMyVouchers()
      const normalized = voucherCode.trim().toUpperCase()
      const alreadyOwned = myVouchers.some(
        (voucher) => voucher.voucherCode?.trim().toUpperCase() === normalized,
      )
      return { result: !alreadyOwned }
    } catch {
      return { result: true }
    }
  },

  async receiveVoucher(voucherCode: string): Promise<void> {
    return this.collectByCode(voucherCode)
  },
}

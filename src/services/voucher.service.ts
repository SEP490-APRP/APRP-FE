import type { ApiResponse, PageResponse } from '@/types'
import type { VoucherResponse } from './voucher.types'
import { mockVouchers } from '@/mocks/voucher.mock'
import { freshResponses } from '@/mocks/fresh'

export type * from './voucher.types'

export const voucherService = freshResponses({
  async getBuyerShopVouchers(
    shopId: number,
    page: number = 0,
    size: number = 10,
  ): Promise<ApiResponse<PageResponse<VoucherResponse>>> {
    await new Promise((r) => setTimeout(r, 150))
    const list = mockVouchers.filter((v) => !v.shopId || v.shopId === Number(shopId))
    return {
      code: 200,
      result: {
        page,
        size,
        totalElements: list.length,
        totalPages: Math.ceil(list.length / size) || 1,
        first: page === 0,
        last: true,
        content: list,
      },
    }
  },

  async canReceiveVoucher(_voucherCode: string): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 100))
    return { code: 200, result: true }
  },

  async receiveVoucher(voucherCode: string): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 200))
    const v = mockVouchers.find((item) => item.voucherCode === voucherCode)
    if (v) {
      v.claimedCount = (v.claimedCount || 0) + 1
    }
    return { code: 200, result: true, message: 'Đã lưu voucher thành công!' }
  },
})

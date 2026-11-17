import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/api/axiosInstance', () => ({
  default: { get: vi.fn(), put: vi.fn(), post: vi.fn() },
}))

import axiosInstance from '@/services/api/axiosInstance'
import { shipperErrorMessage, shipperService } from './shipper.service'

const api = axiosInstance as unknown as {
  get: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
}

describe('shipperService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('nhận đơn lỗi thì ném lỗi ra, không giả báo thành công', async () => {
    const apiError = { status: 409, data: { code: 7005, message: 'Đơn hàng này đã được shipper khác nhận' } }
    api.put.mockRejectedValueOnce(apiError)

    await expect(shipperService.acceptOrder(12)).rejects.toBe(apiError)
    expect(api.put).toHaveBeenCalledWith('/orders/12/ship')
  })

  it('giao thành công gửi kèm danh sách ảnh bằng chứng', async () => {
    api.put.mockResolvedValueOnce({ data: { code: 1000, result: { orderId: 5, status: 'DELIVERED' } } })

    const res = await shipperService.deliverOrder(5, ['https://img/1.jpg'])

    expect(api.put).toHaveBeenCalledWith('/orders/5/deliver', { proofImageUrls: ['https://img/1.jpg'] })
    expect(res.status).toBe('DELIVERED')
  })

  it('lấy đơn mới gửi kèm toạ độ shipper', async () => {
    api.get.mockResolvedValueOnce({
      data: { code: 1000, result: { content: [{ orderId: 1, paymentMethod: 'COD', totalAmount: 215000, items: [] }], number: 0, size: 10, totalElements: 1, totalPages: 1 } },
    })

    const res = await shipperService.getAvailableOrders(0, 10, { lat: 10.8, lng: 106.7 })

    expect(api.get).toHaveBeenCalledWith('/orders/ready', { params: { page: 0, size: 10, lat: 10.8, lng: 106.7 } })
    expect(res.result?.content[0].codAmount).toBe(215000)
  })
})

describe('shipperErrorMessage', () => {
  it('thiếu tiền ký quỹ COD thì nói rõ số tiền cần nạp thêm', () => {
    const msg = shipperErrorMessage(
      { data: { code: 16013, result: { required: 215000, available: 200000, missing: 15000 } } },
      'lỗi',
    )
    expect(msg).toContain('215.000đ')
    expect(msg).toContain('15.000đ')
  })

  it('mã lạ thì dùng message của BE, không có thì dùng câu dự phòng', () => {
    expect(shipperErrorMessage({ data: { code: 9999, message: 'Lỗi BE' } }, 'dự phòng')).toBe('Lỗi BE')
    expect(shipperErrorMessage(new Error(), 'dự phòng')).toBe('dự phòng')
  })
})

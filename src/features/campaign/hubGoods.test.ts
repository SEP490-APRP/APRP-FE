import { describe, expect, it } from 'vitest'
import { hubStateOf, matchesOrder } from './hubGoods'
import type { PreOrderResponse } from '@/services'

const token = 'CN' + 'a'.repeat(32)
const order = (extra: Partial<PreOrderResponse>) =>
  ({ preOrderId: 1, code: 'PO-7', recipientName: 'Hoàng Gia Huy', recipientPhone: '0911000007', qrCode: token, status: 'READY', ...extra }) as PreOrderResponse

describe('hàng tại hub', () => {
  it('đơn xe giao tới phải được hub xác nhận trước khi chờ shipper', () => {
    expect(hubStateOf(order({ onTheWay: true }))).toBe('onTheWay')
    expect(hubStateOf(order({}))).toBe('unconfirmed')
    expect(hubStateOf(order({ hubReceivedAt: '2026-11-26T08:00:00' }))).toBe('atHub')
    expect(hubStateOf(order({ status: 'SHIPPING' }))).toBe('delivering')
  })

  it('tìm được bằng link trên tem, mã đơn, tên hoặc số điện thoại', () => {
    expect(matchesOrder(order({}), `http://localhost:3000/truy-xuat/${token}?thung=2`)).toBe(true)
    expect(matchesOrder(order({}), 'po-7')).toBe(true)
    expect(matchesOrder(order({}), 'gia huy')).toBe(true)
    expect(matchesOrder(order({}), '000007')).toBe(true)
    expect(matchesOrder(order({}), 'PO-99')).toBe(false)
  })
})

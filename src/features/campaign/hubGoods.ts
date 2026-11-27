import type { PreOrderResponse } from '@/services'

/** Hàng của một đơn đối với hub: chưa tới, tới rồi chờ hub xác nhận, đã nhận chờ shipper lấy, đang giao, đã xong */
export type HubState = 'unconfirmed' | 'atHub' | 'onTheWay' | 'delivering' | 'delivered' | 'failed'

export function hubStateOf(o: PreOrderResponse): HubState {
  if (o.status === 'SHIPPING' || (o.status === 'READY' && o.pickedUpAt)) return 'delivering'
  if (o.status === 'DELIVERED') return 'delivered'
  if (o.status === 'FAILED') return 'failed'
  if (o.status === 'PROCESSING' || o.onTheWay) return 'onTheWay'
  return o.hubReceivedAt ? 'atHub' : 'unconfirmed'
}

/** Khớp ô quét / nhập: mã QR (hoặc cả đường link trên tem), mã đơn, tên hay số điện thoại người nhận */
export function matchesOrder(o: PreOrderResponse, text: string) {
  const q = text.trim().toLowerCase()
  if (!q) return true
  const token = o.qrCode?.toLowerCase()
  if (token && q.includes(token)) return true
  return [o.code, o.recipientName, o.recipientPhone].some((v) => v?.toLowerCase().includes(q))
}

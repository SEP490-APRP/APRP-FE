import { describe, expect, it } from 'vitest'
import { scanBox } from './crateScan'
import type { HubTripBox } from '@/services'

const token = 'CN' + 'b'.repeat(32)
const box: HubTripBox = { orderId: 4, code: 'PO-04', recipientName: 'Đỗ Minh Khoa', hubName: 'Hub Gò Vấp', crateKg: 20, crates: 3, loaded: [1], qrCode: token }
const other: HubTripBox = { ...box, orderId: 5, code: 'PO-05', loaded: [], qrCode: 'CN' + 'c'.repeat(32) }
const url = (t: string, crate?: number) => `http://localhost:3000/truy-xuat/${t}${crate ? `?thung=${crate}` : ''}`

describe('quét thùng lên xe', () => {
  it('tem có số thùng thì nhận đúng thùng đó, quét trùng được báo', () => {
    expect(scanBox([box, other], url(token, 3))).toEqual({ box, crate: 3 })
    expect(scanBox([box, other], url(token, 1))).toEqual({ error: 'Thùng 1 của đơn PO-04 đã quét rồi.' })
  })

  it('tem cũ hoặc gõ mã đơn thì nhận thùng kế tiếp', () => {
    expect(scanBox([box, other], url(token))).toEqual({ box, crate: 2 })
    expect(scanBox([box, other], 'po-05')).toEqual({ box: other, crate: 1 })
  })

  it('báo khi mã lạ, trùng nhiều đơn hoặc đơn đã đủ', () => {
    expect(scanBox([box, other], url('CN' + 'd'.repeat(32)))).toHaveProperty('error')
    expect(scanBox([box, other], 'khoa')).toHaveProperty('error')
    expect(scanBox([{ ...box, loaded: [1, 2, 3] }], 'po-04')).toHaveProperty('error')
  })
})

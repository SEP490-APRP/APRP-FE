import { describe, expect, it } from 'vitest'
import type { PreOrderResponse } from '@/services'
import { isLocalUrl, labelsPdfDoc, toLabels, traceUrl } from './packageLabels'

const order = {
  preOrderId: 1, code: 'PO-1', campaignTitle: 'Rau cải', recipientName: 'Nguyễn An', recipientPhone: '0900000001', shippingAddress: '1 Đường Bí Mật',
  crateKg: 10, crateQuantity: 3, qrCode: 'CNabc', shelfLifeTier: 'DAYS_3_4', deliverBy: '2026-11-23T00:00:00',
} as unknown as PreOrderResponse

describe('tem QR thùng hàng', () => {
  it('mỗi thùng một tem', () => {
    expect(toLabels([order]).map((l) => `${l.crate}/${l.crates}`)).toEqual(['1/3', '2/3', '3/3'])
  })

  it('mã QR trỏ tới trang truy xuất', () => {
    expect(traceUrl('https://capnong.vn/', 'CNabc')).toBe('https://capnong.vn/truy-xuat/CNabc')
  })

  it('nhận ra địa chỉ chỉ mở được trên máy này', () => {
    expect(isLocalUrl('http://localhost:3000')).toBe(true)
    expect(isLocalUrl('http://127.0.0.1')).toBe(true)
    expect(isLocalUrl('http://192.168.1.10:3000')).toBe(false)
    expect(isLocalUrl('https://localhost.capnong.vn')).toBe(false)
  })

  it('tem in tên người nhận, số kg, hạn dùng và không in số điện thoại, địa chỉ', () => {
    const text = JSON.stringify(labelsPdfDoc(toLabels([order]), 'https://capnong.vn'))
    for (const part of ['Nguyễn An', 'Thùng 3/3', 'Giữ tươi 3–4 ngày', '23/11/2026', 'https://capnong.vn/truy-xuat/CNabc']) expect(text).toContain(part)
    expect(text).toContain('https://capnong.vn/truy-xuat/CNabc?thung=3')
    expect(text).not.toContain('0900000001')
    expect(text).not.toContain('Đường Bí Mật')
  })
})

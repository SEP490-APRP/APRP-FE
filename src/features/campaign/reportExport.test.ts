import { describe, expect, it } from 'vitest'
import type { CampaignResponse, FarmRegistrationResponse, PreOrderResponse } from '@/services'
import { buildXlsx } from '@/utils/xlsx'
import { buildReport } from './report'
import { reportPdfDoc, reportSheets } from './reportExport'

const c = {
  campaignId: 1, code: 'CD-1', title: 'Rau cải <Linh Trung>', status: 'COMPLETED', targetVolumeKg: 400, minThresholdKg: 150,
  rescuePricePerKg: 10000, depositPercent: 0.3, callPostedAt: '2026-11-01T07:00:00', completedAt: '2026-11-19T09:00:00', cutoffAt: '2026-11-09T07:00:00',
} as unknown as CampaignResponse
const order = (id: number, extra: Partial<PreOrderResponse> = {}) =>
  ({
    preOrderId: id, code: `DT-${id}`, status: 'DELIVERED', totalKg: 100, totalAmount: 1_000_000, depositAmount: 300_000, remainingAmount: 720_000,
    shippingFee: 20_000, depositStatus: 'RELEASED_TO_FARMER', recipientName: 'An & Bình', recipientPhone: '0900000001',
    shippingAddress: '1 Đường Bí Mật', shipperIncomeAmount: 19_400, deliveredAt: '2026-11-18T10:00:00', ...extra,
  }) as unknown as PreOrderResponse
const regs = [
  { registrationId: 1, shopId: 7, shopName: 'Vườn A', status: 'APPROVED', allocatedVolumeKg: 200, receivedWeightKg: 200, countedWeightKg: 200, payoutAmount: 1_700_000 },
] as unknown as FarmRegistrationResponse[]

const orders = [order(1), order(2, { recipientPhone: '0900000002' }), order(3, { status: 'CANCELLED', depositStatus: 'REFUNDED', cancelReason: 'Huỷ', shipperIncomeAmount: 0 })]
const report = buildReport(c, orders, regs, [])
const input = { c, report, orders, trips: [], note: 'Cần thêm hub' }

describe('báo cáo chiến dịch', () => {
  it('tính đúng số liệu tổng kết', () => {
    expect(report.rescuedKg).toBe(200)
    expect(report.pctTarget).toBe(50)
    expect(report.days).toBe(19)
    expect(report.money.collected).toBe(2 * 1_020_000)
    expect(report.money.platform).toBe(2_040_000 - 1_700_000 - 38_800)
    expect(report.score).toBe(Math.round((50 + 100 + 100) / 3))
  })

  it('bản PDF có đủ mục và không lộ số điện thoại, địa chỉ', () => {
    const text = JSON.stringify(reportPdfDoc(input))
    for (const part of ['1. Thông tin chiến dịch', '5. Tài chính', '6. Nhà vườn tham gia', '9. Nhận xét', 'Cần thêm hub', 'Rau cải <Linh Trung>']) expect(text).toContain(part)
    expect(text).not.toContain('0900000001')
    expect(text).not.toContain('Đường Bí Mật')
  })

  it('file Excel là gói zip có đủ 5 sheet', () => {
    const sheets = reportSheets(input)
    expect(sheets.map((s) => s.name)).toEqual(['Tổng quan', 'Tài chính', 'Nhà vườn', 'Đơn hàng', 'Xe ra hub'])
    const bytes = buildXlsx(sheets)
    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04])
    const text = new TextDecoder().decode(bytes)
    expect(text).toContain('xl/worksheets/sheet5.xml')
    expect(text).not.toContain('0900000001')
  })
})

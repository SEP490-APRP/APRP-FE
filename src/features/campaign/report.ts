import type { CampaignResponse, FarmRegistrationResponse, HubTrip, PreOrderResponse } from '@/services'

/** Số liệu tổng kết một chiến dịch: dùng chung cho popup Báo cáo và file PDF / Excel xuất ra */

export const ymd = (v?: string | null) => (v ? v.slice(0, 10) : null)
const at = (day: string) => new Date(`${day}T00:00:00`)
export const fmtDay = (day?: string | null) =>
  day ? at(day.slice(0, 10)).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

export interface ReportMetric {
  label: string
  done: number
  total: number
  unit: 'kg' | 'đơn'
  pct: number
}

export interface ReportFarm {
  shopId: number
  name: string
  allocatedKg: number
  receivedKg: number
  rejectedKg: number
  countedKg: number
  pay: number
}

export const orderShipFee = (o: PreOrderResponse) => Math.max(0, Number(o.shippingFee ?? 0) - Number(o.shippingDiscountAmount ?? 0))

export function ratingOf(score: number) {
  if (score >= 90) return { label: 'Rất thành công', tone: 'good' as const }
  if (score >= 75) return { label: 'Thành công', tone: 'good' as const }
  if (score >= 50) return { label: 'Tạm đạt', tone: 'warn' as const }
  return { label: 'Chưa đạt', tone: 'bad' as const }
}

export function buildReport(c: CampaignResponse, orders: PreOrderResponse[], regs: FarmRegistrationResponse[], trips: HubTrip[]) {
  const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((n, x) => n + f(x), 0)

  const start = ymd(c.callPostedAt ?? c.publishAt ?? c.publishedAt ?? c.createdAt)
  // Ngày kết thúc lấy từ ô "Kết thúc chiến dịch"; chiến dịch cũ chưa nhập thì lấy ngày bấm hoàn tất
  const finish = ymd(c.finishDate)
  const end = finish ?? ymd(c.completedAt)
  const days = start && end ? Math.max(1, Math.round((at(end).getTime() - at(start).getTime()) / 86_400_000) + 1) : null

  const valid = orders.filter((o) => !['CANCELLED', 'PENDING'].includes(o.status))
  const delivered = orders.filter((o) => o.status === 'DELIVERED')
  const failed = orders.filter((o) => o.status === 'FAILED')
  const cancelled = orders.filter((o) => o.status === 'CANCELLED')
  const rescuedKg = sum(delivered, (o) => Number(o.totalKg ?? 0))
  const target = Number(c.targetVolumeKg ?? 0)

  // Gộp các lô theo nhà vườn
  const byShop = new Map<number, ReportFarm>()
  for (const r of regs) {
    if (r.status !== 'APPROVED') continue
    const f = byShop.get(r.shopId) ?? {
      shopId: r.shopId, name: r.shopName ?? `Shop #${r.shopId}`, allocatedKg: 0, receivedKg: 0, rejectedKg: 0, countedKg: 0, pay: 0,
    }
    f.allocatedKg += Number(r.allocatedVolumeKg ?? 0)
    f.receivedKg += Number(r.receivedWeightKg ?? 0)
    f.rejectedKg += Number(r.rejectedWeightKg ?? 0)
    f.countedKg += Number(r.countedWeightKg ?? 0)
    f.pay += Number(r.payoutAmount ?? 0)
    byShop.set(r.shopId, f)
  }
  const farms = [...byShop.values()].sort((a, b) => b.countedKg - a.countedKg)
  const received = Number(c.acceptedVolumeKg ?? 0) || sum(farms, (f) => f.countedKg)

  const farmPay = sum(farms, (f) => f.pay)
  // Sàn thu: cọc đã giải ngân (gồm cọc không hoàn của đơn thất bại) + phần còn lại thu khi giao
  const collected =
    sum(orders.filter((o) => o.depositStatus === 'RELEASED_TO_FARMER'), (o) => Number(o.depositAmount ?? 0)) +
    sum(delivered, (o) => Number(o.remainingAmount ?? 0))
  const shipPay = sum(orders, (o) => Number(o.shipperIncomeAmount ?? 0))
  const tripPay = sum(trips.filter((t) => t.paidAt), (t) => Number(t.netAmount ?? 0))
  const damagePay = sum(orders, (o) => Number(o.damageRefundTotal ?? 0))

  // Mức độ thành công: trung bình các tỉ lệ đạt được
  const onTime = finish ? delivered.filter((o) => (ymd(o.deliveredAt) ?? '') <= finish).length : 0
  const metrics: ReportMetric[] = [
    { label: 'Giải cứu so với mục tiêu', done: rescuedKg, total: target, unit: 'kg' as const },
    { label: 'Đơn giao thành công', done: delivered.length, total: valid.length, unit: 'đơn' as const },
    { label: 'Hàng nhận về đã tới người mua', done: rescuedKg, total: received, unit: 'kg' as const },
    ...(finish ? [{ label: 'Giao đúng hạn', done: onTime, total: delivered.length, unit: 'đơn' as const }] : []),
  ]
    .filter((m) => m.total > 0)
    .map((m) => ({ ...m, pct: Math.min(100, Math.round((m.done / m.total) * 100)) }))
  const score = metrics.length ? Math.round(sum(metrics, (m) => m.pct) / metrics.length) : null

  return {
    start,
    end,
    hasFinishDate: !!finish,
    days,
    target,
    rescuedKg,
    pctTarget: target > 0 ? Math.round((rescuedKg / target) * 100) : 0,
    received,
    validCount: valid.length,
    delivered,
    failed,
    cancelled,
    buyers: new Set(delivered.map((o) => o.recipientPhone || o.buyerName || o.preOrderId)).size,
    hubs: new Set(delivered.map((o) => o.hubId).filter(Boolean)).size,
    goodsValue: sum(delivered, (o) => Number(o.totalAmount ?? 0)),
    farms,
    money: {
      collected,
      farmPay,
      shipPay,
      tripPay,
      damagePay,
      refunded: sum(orders, (o) => Number(o.shortfallRefundAmount ?? 0) + Number(o.damageRefundTotal ?? 0)),
      platform: collected - farmPay - shipPay - tripPay - damagePay,
    },
    metrics,
    score,
  }
}

export type CampaignReport = ReturnType<typeof buildReport>

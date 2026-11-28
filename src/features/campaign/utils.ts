import type { CampaignResponse, VehicleType } from '@/services'

export const formatKg = (kg: number | null | undefined) =>
  `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(Number(kg ?? 0))} kg`

export const formatVnd = (v: number | null | undefined) =>
  `${new Intl.NumberFormat('vi-VN').format(Math.round(Number(v ?? 0)))}đ`

/** "Còn 3 ngày", "Còn 5 giờ", "Đã chốt" */
export function timeLeftLabel(cutoffAt: string, now = Date.now()) {
  const ms = new Date(cutoffAt).getTime() - now
  if (!Number.isFinite(ms) || ms <= 0) return 'Đã chốt'
  const hours = Math.floor(ms / 3_600_000)
  if (hours >= 48) return `Còn ${Math.floor(hours / 24)} ngày`
  if (hours >= 1) return `Còn ${hours} giờ`
  return `Còn ${Math.max(1, Math.floor(ms / 60_000))} phút`
}

export const progressOf = (c: Pick<CampaignResponse, 'progressPercent'>) =>
  Math.max(0, Math.min(100, Number(c.progressPercent ?? 0)))

/** Nhà vườn đăng ký góp hàng được chưa: chiến dịch nháp phải đăng lời kêu gọi rồi mới nhận đăng ký */
export const registrationOpen = (c: Pick<CampaignResponse, 'status' | 'callPostedAt'>) => c.status !== 'DRAFT' || !!c.callPostedAt

export const openingText = (c: Pick<CampaignResponse, 'publishAt'>) =>
  c.publishAt
    ? `Mở đăng ký lúc ${new Date(c.publishAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}`
    : 'Chờ CapNong mở đăng ký'


/** Loại xe tài xế và sức chở (kg), khớp VehicleType ở BE; dùng lọc chuyến chở hàng ra hub */
export const VEHICLE_TYPES: { id: VehicleType; label: string; capacityKg: number }[] = [
  { id: 'MOTORBIKE', label: 'Xe máy', capacityKg: 60 },
  { id: 'VAN', label: 'Xe ba gác / bán tải', capacityKg: 500 },
  { id: 'TRUCK_1T', label: 'Xe tải 1 tấn', capacityKg: 1000 },
  { id: 'TRUCK_2T', label: 'Xe tải 2 tấn', capacityKg: 2000 },
  { id: 'TRUCK_5T', label: 'Xe tải 5 tấn', capacityKg: 5000 },
]

export const vehicleLabel = (t?: string | null) => VEHICLE_TYPES.find((v) => v.id === t)?.label ?? 'Xe máy'
export const vehicleCapacity = (t?: string | null) => VEHICLE_TYPES.find((v) => v.id === t)?.capacityKg ?? 60

/** Nhãn cho đơn READY theo vị trí thật của hàng (đã chốt xe chưa có nghĩa hàng đã tới hub) */
export const readyLabel = (hubStage?: string | null, atHub = 'Tại hub') =>
  hubStage === 'AT_SITE' ? 'Chờ xe tại điểm tập kết' : hubStage === 'ON_THE_WAY' ? 'Đang chở ra hub' : atHub

/** Như readyLabel, thêm trường hợp xe đã tới mà hub chưa xác nhận (màn quản trị) */
export const adminReadyLabel = (o: { hubStage?: string | null; hubReceivedAt?: string | null }) =>
  o.hubStage === 'AT_HUB' && !o.hubReceivedAt ? 'Chờ hub xác nhận' : readyLabel(o.hubStage)

/** Dòng ghi hub đã xác nhận đơn lúc nào, ai xác nhận (shipper chỉ thấy đơn đã xác nhận) */
export const hubConfirmText = (o: { hubReceivedAt?: string | null; hubReceivedBy?: string | null }) =>
  o.hubReceivedAt
    ? `Hub đã xác nhận ${new Date(o.hubReceivedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}${o.hubReceivedBy ? ` · ${o.hubReceivedBy}` : ''}`
    : null

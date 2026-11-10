import type { CampaignResponse } from '@/services'

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

export const CRATE_SIZES = [10, 20, 50] as const

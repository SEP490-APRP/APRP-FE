/**
 * Dòng "Còn ~2,3 km · khoảng 6 phút" trên bản đồ theo dõi đơn.
 * distanceKm / estimatedMinutes do BE tính cho chặng hiện tại (tới nhà vườn hoặc tới khách).
 * Trả null khi chưa có dữ liệu hoặc đơn đã giao xong.
 */
export function formatEta(distanceKm?: number | null, estimatedMinutes?: number | null): string | null {
  if (distanceKm == null || !Number.isFinite(distanceKm)) return null
  if (distanceKm <= 0 && (estimatedMinutes ?? 0) <= 0) return null
  const dist =
    distanceKm < 1
      ? `${Math.max(50, Math.round((distanceKm * 1000) / 50) * 50)} m`
      : `${distanceKm.toFixed(1).replace('.', ',')} km`
  const mins = estimatedMinutes ?? 0
  const time = mins <= 1 ? 'sắp tới nơi' : `khoảng ${mins} phút`
  return `Còn ~${dist} · ${time}`
}

import type { HubTripBox } from '@/services'

/**
 * Đọc mã vừa quét (đường link trên tem) hoặc mã đơn / tên người nhận vừa gõ, chọn thùng cần đánh dấu.
 * Tem có ghi số thùng thì đánh dấu đúng thùng đó (quét trùng không bị đếm hai lần); tem cũ thì lấy thùng kế tiếp.
 */
export function scanBox(boxes: HubTripBox[], text: string): { box: HubTripBox; crate: number } | { error: string } {
  const q = text.trim().toLowerCase()
  const token = q.match(/cn[0-9a-f]{32}/)?.[0]
  let found = token
    ? boxes.filter((b) => b.qrCode?.toLowerCase() === token)
    : boxes.filter((b) => [b.code, b.recipientName].some((v) => v?.toLowerCase().includes(q)))
  if (found.length > 1) {
    const exact = found.filter((b) => b.code.toLowerCase() === q)
    if (exact.length === 1) found = exact
  }
  if (!q || found.length === 0) return { error: 'Mã này không thuộc danh sách của bạn.' }
  if (found.length > 1) return { error: `Có ${found.length} đơn khớp, bấm chọn thùng ở đúng đơn.` }
  const box = found[0]
  if (box.loaded.length >= box.crates) return { error: `Đơn ${box.code} đã đủ ${box.crates} thùng.` }
  const n = Number(q.match(/[?&]thung=(\d+)/)?.[1])
  if (n >= 1 && n <= box.crates) {
    return box.loaded.includes(n) ? { error: `Thùng ${n} của đơn ${box.code} đã quét rồi.` } : { box, crate: n }
  }
  const next = Array.from({ length: box.crates }, (_, i) => i + 1).find((i) => !box.loaded.includes(i))!
  return { box, crate: next }
}

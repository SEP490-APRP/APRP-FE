/** Tên phường / xã trong địa chỉ (để gom đơn giao); địa chỉ không ghi thì trả undefined */
export function wardOf(address: string): string | undefined {
  return address
    .split(',')
    .map((s) => s.trim())
    .find((s) => /^(Phường|Xã|Thị trấn|P\.)\s*\S/i.test(s))
}

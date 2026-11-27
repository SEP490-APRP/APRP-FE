/** Cỡ thùng chuẩn, lớn trước (khớp CrateSplitter ở máy chủ) */
const SIZES = [15, 10, 5] as const

/**
 * Chia số kg người mua nhập thành thùng: thùng lớn nhất mà số kg chia hết. Không phải bội số của 5 thì trả null.
 */
export function splitCrates(kg: number): { crateKg: number; quantity: number } | null {
  if (!Number.isInteger(kg) || kg < 5 || kg % 5 !== 0) return null
  const crateKg = SIZES.find((s) => kg % s === 0)!
  return { crateKg, quantity: kg / crateKg }
}

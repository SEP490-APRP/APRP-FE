/**
 * Mã đối soát khi bàn giao hàng: nhà vườn ghi/dán lên túi hàng, tài xế so khớp trước khi bấm "Đã lấy hàng".
 * Dùng chung một định dạng ở màn nhà vườn và màn tài xế để hai bên đọc giống nhau.
 */
export const pickupCode = (orderId: number | string) => `#${orderId}`

/** Trạng thái nhà vườn cần dán mã lên túi hàng (đã xác nhận, chưa bàn giao) */
export const needsPickupCode = (status?: string) => status === 'CONFIRMED' || status === 'READY' || status === 'SHIPPING'

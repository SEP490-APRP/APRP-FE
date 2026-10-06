import { z } from 'zod'

/**
 * Schema cho các form đăng nhập/đăng ký. Thông báo lỗi giữ nguyên câu chữ của bản cũ,
 * thứ tự field = thứ tự kiểm tra (form chỉ hiện lỗi đầu tiên).
 */

const PASSWORD_MIN = 6

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Vui lòng nhập Email hoặc Số điện thoại của bạn'),
  password: z.string().min(PASSWORD_MIN, 'Mật khẩu cần tối thiểu 6 ký tự'),
})
export type LoginValues = z.input<typeof loginSchema>

/** Toàn bộ field của form đăng ký (dùng chung cho nhà vườn, người mua và tài xế). */
export type RegisterValues = {
  fullName: string
  phone: string
  email: string
  password: string
  confirmPassword: string
  buyerAddress: string
  shipperVehicle: string
  shipperArea: string
  shopName: string
  shopAddress: string
  shopRegion: string
  shopFarmingType: string
  shopBankName: string
  shopBankAccount: string
  shopBankHolder: string
}

export const REGISTER_DEFAULTS: RegisterValues = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  buyerAddress: '',
  shipperVehicle: 'Xe máy kèm thùng bảo ôn',
  shipperArea: 'TP. Hồ Chí Minh',
  shopName: '',
  shopAddress: '',
  shopRegion: 'Đà Lạt & Lâm Đồng',
  shopFarmingType: 'Hữu cơ Organic',
  shopBankName: 'Vietcombank',
  shopBankAccount: '',
  shopBankHolder: '',
}

const passwordsMatch = (v: { password: string; confirmPassword: string }) =>
  v.password === v.confirmPassword
const MISMATCH = { message: 'Mật khẩu xác nhận không trùng khớp', path: ['confirmPassword'] }

/** Bước 1 đăng ký nhà vườn: thông tin chủ hộ (bắt buộc số điện thoại). */
export const shopAccountSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên chủ nông hộ / người đại diện'),
    phone: z.string().trim().min(1, 'Vui lòng cung cấp số điện thoại liên hệ'),
    password: z.string().min(PASSWORD_MIN, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch, MISMATCH)

/** Bước 2 đăng ký nhà vườn: hồ sơ gian hàng để duyệt KYC. */
export const shopKycSchema = z.object({
  shopName: z.string().trim().min(1, 'Vui lòng nhập tên nhà vườn hoặc tên gian hàng của bạn'),
  shopAddress: z.string().trim().min(1, 'Vui lòng cung cấp địa chỉ nông trại / kho xuất hàng'),
  shopBankAccount: z
    .string()
    .trim()
    .min(1, 'Vui lòng cung cấp số tài khoản ngân hàng để quyết toán'),
})

/** Đăng ký người mua / tài xế: cần điện thoại HOẶC email. */
export const memberRegisterSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Vui lòng nhập họ và tên của bạn'),
    phone: z.string().trim(),
    email: z.string().trim(),
    password: z.string().min(PASSWORD_MIN, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.phone !== '' || v.email !== '', {
    message: 'Vui lòng cung cấp số điện thoại hoặc email liên hệ',
    path: ['phone'],
  })
  .refine(passwordsMatch, MISMATCH)

import { describe, expect, it } from 'vitest'
import { validate } from '@/utils'
import {
  loginSchema,
  memberRegisterSchema,
  REGISTER_DEFAULTS,
  shopAccountSchema,
  shopKycSchema,
} from './auth.schemas'

const error = (r: ReturnType<typeof validate>) => (r.ok ? null : r.error)

describe('loginSchema', () => {
  it('bắt buộc email/số điện thoại (bỏ khoảng trắng)', () =>
    expect(error(validate(loginSchema, { identifier: '  ', password: '123456' }))).toBe(
      'Vui lòng nhập Email hoặc Số điện thoại của bạn',
    ))
  it('mật khẩu tối thiểu 6 ký tự', () =>
    expect(error(validate(loginSchema, { identifier: 'a@b.vn', password: '123' }))).toBe(
      'Mật khẩu cần tối thiểu 6 ký tự',
    ))
  it('hợp lệ thì trả dữ liệu đã trim', () => {
    const r = validate(loginSchema, { identifier: ' a@b.vn ', password: '123456' })
    expect(r).toEqual({ ok: true, data: { identifier: 'a@b.vn', password: '123456' } })
  })
})

describe('shopAccountSchema', () => {
  const base = { ...REGISTER_DEFAULTS, fullName: 'Chú Bảy', phone: '0912', password: '123456' }
  it('bắt buộc số điện thoại', () =>
    expect(error(validate(shopAccountSchema, { ...base, phone: '' }))).toBe(
      'Vui lòng cung cấp số điện thoại liên hệ',
    ))
  it('mật khẩu xác nhận phải trùng', () =>
    expect(error(validate(shopAccountSchema, { ...base, confirmPassword: 'khac' }))).toBe(
      'Mật khẩu xác nhận không trùng khớp',
    ))
  it('hợp lệ', () =>
    expect(validate(shopAccountSchema, { ...base, confirmPassword: '123456' }).ok).toBe(true))
})

describe('shopKycSchema', () => {
  it('lỗi theo đúng thứ tự: tên -> địa chỉ -> số tài khoản', () => {
    expect(error(validate(shopKycSchema, REGISTER_DEFAULTS))).toBe(
      'Vui lòng nhập tên nhà vườn hoặc tên gian hàng của bạn',
    )
    expect(error(validate(shopKycSchema, { ...REGISTER_DEFAULTS, shopName: 'HTX' }))).toBe(
      'Vui lòng cung cấp địa chỉ nông trại / kho xuất hàng',
    )
    expect(
      error(
        validate(shopKycSchema, { ...REGISTER_DEFAULTS, shopName: 'HTX', shopAddress: 'Đà Lạt' }),
      ),
    ).toBe('Vui lòng cung cấp số tài khoản ngân hàng để quyết toán')
  })
})

describe('memberRegisterSchema', () => {
  const base = {
    ...REGISTER_DEFAULTS,
    fullName: 'Mai',
    password: '123456',
    confirmPassword: '123456',
  }
  it('cần số điện thoại hoặc email', () =>
    expect(error(validate(memberRegisterSchema, base))).toBe(
      'Vui lòng cung cấp số điện thoại hoặc email liên hệ',
    ))
  it('chỉ có email cũng được', () =>
    expect(validate(memberRegisterSchema, { ...base, email: 'mai@capnong.vn' }).ok).toBe(true))
})

import { describe, expect, it } from 'vitest'
import { validate } from '@/utils'
import { productFormSchema } from './productForm.schema'

const base = {
  name: 'Cà rốt',
  price: 18000,
  stock: 100,
  unit: 'kg',
  region: 'Tây Nguyên',
  farmingType: 'VietGAP',
}
const error = (values: object) => {
  const r = validate(productFormSchema, values)
  return r.ok ? null : r.error
}

describe('productFormSchema', () => {
  it('hợp lệ', () => expect(error(base)).toBeNull())
  it('ô số để trống (NaN) báo thiếu giá', () =>
    expect(error({ ...base, price: Number.NaN })).toBe('Vui lòng nhập giá bán'))
  it('giá phải lớn hơn 0', () =>
    expect(error({ ...base, price: 0 })).toBe('Giá bán phải lớn hơn 0'))
  it('tồn kho phải là số nguyên dương', () => {
    expect(error({ ...base, stock: 1.5 })).toBe('Tồn kho phải là số nguyên')
    expect(error({ ...base, stock: -3 })).toBe('Tồn kho phải lớn hơn 0')
  })
  it('tên chỉ có khoảng trắng là thiếu', () =>
    expect(error({ ...base, name: '   ' })).toBe('Vui lòng nhập tên nông sản'))
})

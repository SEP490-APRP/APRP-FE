import { describe, expect, it } from 'vitest'
import { formatEta } from './eta'

describe('formatEta', () => {
  it('hiện quãng đường và số phút dự kiến', () => {
    expect(formatEta(2.3, 6)).toBe('Còn ~2,3 km · khoảng 6 phút')
  })

  it('dưới 1 km đổi sang mét, còn 1 phút thì báo sắp tới', () => {
    expect(formatEta(0.42, 1)).toBe('Còn ~400 m · sắp tới nơi')
  })

  it('chưa có dữ liệu hoặc đã giao xong thì không hiện', () => {
    expect(formatEta(undefined, undefined)).toBeNull()
    expect(formatEta(0, 0)).toBeNull()
  })
})

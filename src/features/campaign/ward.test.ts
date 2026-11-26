import { describe, expect, it } from 'vitest'
import { wardOf } from './ward'

describe('phường trong địa chỉ gợi ý', () => {
  it('lấy đoạn phường / xã, không có thì bỏ trống', () => {
    expect(wardOf('45 Lê Lợi, Phường Bến Nghé, Quận 1, Hồ Chí Minh')).toBe('Phường Bến Nghé')
    expect(wardOf('Đường Nguyễn Ảnh Thủ, Xã Tân Xuân, Hóc Môn')).toBe('Xã Tân Xuân')
    expect(wardOf('Chợ Bến Thành, Lê Lợi, Quận 1')).toBeUndefined()
  })
})

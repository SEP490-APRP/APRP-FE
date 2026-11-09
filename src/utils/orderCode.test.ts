import { describe, expect, it } from 'vitest'
import { needsPickupCode, pickupCode } from './orderCode'

describe('mã đối soát bàn giao hàng', () => {
  it('cùng một định dạng ở màn nhà vườn và tài xế', () => {
    expect(pickupCode(123)).toBe('#123')
  })

  it('chỉ hiện khi đơn đã xác nhận và chưa bàn giao', () => {
    expect(needsPickupCode('CONFIRMED')).toBe(true)
    expect(needsPickupCode('READY')).toBe(true)
    expect(needsPickupCode('SHIPPING')).toBe(true)
    expect(needsPickupCode('PICKED_UP')).toBe(false)
    expect(needsPickupCode('PENDING')).toBe(false)
  })
})

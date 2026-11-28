import { describe, expect, it } from 'vitest'
import { splitCrates } from './crates'

describe('chia thùng theo số kg', () => {
  it('dùng thùng lớn nhất mà số kg chia hết', () => {
    expect(splitCrates(40)).toEqual({ crateKg: 10, quantity: 4 })
    expect(splitCrates(45)).toEqual({ crateKg: 15, quantity: 3 })
    expect(splitCrates(35)).toEqual({ crateKg: 5, quantity: 7 })
  })

  it('không nhận số kg lẻ', () => {
    for (const kg of [0, 3, 12, 7.5, -5, Number.NaN]) expect(splitCrates(kg)).toBeNull()
  })
})

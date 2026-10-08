import { afterEach, describe, expect, it, vi } from 'vitest'
import { absoluteUrl } from './helpers'

describe('absoluteUrl', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('tạo link tuyệt đối với clean URLs', () => {
    vi.stubGlobal('window', { location: { origin: 'https://capnong.vn', pathname: '/' } })
    expect(absoluteUrl('/cua-hang/101')).toBe('https://capnong.vn/cua-hang/101')
  })

  it('xử lý route không có dấu gạch chéo đầu', () => {
    vi.stubGlobal('window', { location: { origin: 'https://x.io', pathname: '/' } })
    expect(absoluteUrl('san-pham/702')).toBe('https://x.io/san-pham/702')
  })
})

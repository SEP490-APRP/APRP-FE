import { afterEach, describe, expect, it, vi } from 'vitest'
import { absoluteUrl } from './helpers'

describe('absoluteUrl', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('đặt route sau # vì app dùng hash router', () => {
    vi.stubGlobal('window', { location: { origin: 'https://capnong.vn', pathname: '/' } })
    expect(absoluteUrl('/cua-hang/101')).toBe('https://capnong.vn/#/cua-hang/101')
  })

  it('giữ đường dẫn con khi app được deploy dưới thư mục con', () => {
    vi.stubGlobal('window', { location: { origin: 'https://x.io', pathname: '/capnong/' } })
    expect(absoluteUrl('/san-pham/702')).toBe('https://x.io/capnong/#/san-pham/702')
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let store: Record<string, string>

beforeEach(() => {
  store = {}
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => (store[k] = v),
    removeItem: (k: string) => delete store[k],
  })
  vi.stubGlobal('window', new EventTarget())
  vi.stubGlobal('location', { hash: '' })
  // Store đọc localStorage lúc import, nên mỗi test import lại module.
  vi.resetModules()
})

afterEach(() => vi.unstubAllGlobals())

describe('useCartStore', () => {
  it('đọc giỏ cũ { carrot: 2 }, bỏ id lạ, giới hạn theo tồn kho', async () => {
    store['capnong-cart'] = JSON.stringify({ carrot: 2, '701': 1, 'box-3': 1, tomato: 9999 })
    const { useCartStore } = await import('./useCartStore')
    const { items } = useCartStore.getState()
    expect(items.carrot).toBe(2)
    expect(items['701']).toBeUndefined()
    expect(items['box-3']).toBeUndefined()
    expect(items.tomato).toBeLessThan(9999)
  })

  it('ghi lại đúng định dạng cũ, không bọc {state, version}', async () => {
    const { useCartStore } = await import('./useCartStore')
    useCartStore.getState().changeQuantity('carrot', 1)
    useCartStore.getState().changeQuantity('carrot', 1)
    expect(JSON.parse(store['capnong-cart'])).toEqual({ carrot: 2 })
    useCartStore.getState().remove('carrot')
    expect(JSON.parse(store['capnong-cart'])).toEqual({})
  })

  it('cartCount và cartTotal', async () => {
    const { cartCount, cartTotal } = await import('./useCartStore')
    const { allProducts } = await import('@/mocks/catalog')
    const p = allProducts[0]
    expect(cartCount({ [p.id]: 3 })).toBe(3)
    expect(cartTotal({ [p.id]: 3, unknown: 5 })).toBe(p.price * 3)
  })
})

describe('useAuthStore', () => {
  const user = { name: 'Mai', email: 'mai@capnong.vn', role: 'buyer' }

  it('khôi phục phiên cũ: user không có id được gán id "local", token là chuỗi thô', async () => {
    store['capnong-user'] = JSON.stringify(user)
    store['capnong-token'] = 'raw-token'
    const { useAuthStore } = await import('./useAuthStore')
    expect(useAuthStore.getState().user).toEqual({ ...user, id: 'local' })
    expect(useAuthStore.getState().token).toBe('raw-token')
  })

  it('bỏ qua user lưu sai kiểu (role lạ)', async () => {
    store['capnong-user'] = JSON.stringify({ ...user, role: 'superadmin' })
    const { useAuthStore } = await import('./useAuthStore')
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('login/logout ghi đúng 2 key cũ', async () => {
    const { useAuthStore } = await import('./useAuthStore')
    useAuthStore.getState().login({ ...user, role: 'admin', id: 7 }, 'jwt')
    expect(JSON.parse(store['capnong-user'])).toMatchObject({ id: '7', role: 'admin' })
    expect(store['capnong-token']).toBe('jwt')
    useAuthStore.getState().logout()
    expect(store['capnong-user']).toBeUndefined()
    expect(store['capnong-token']).toBeUndefined()
  })

  it('event 401 từ axiosInstance: đăng xuất và về trang đăng nhập', async () => {
    const { useAuthStore } = await import('./useAuthStore')
    const { AUTH_UNAUTHORIZED_EVENT } = await import('@/services/api')
    useAuthStore.getState().login({ ...user, role: 'buyer' }, 'jwt')
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
    expect(useAuthStore.getState().user).toBeNull()
    expect(location.hash).toBe('/dang-nhap')
  })
})

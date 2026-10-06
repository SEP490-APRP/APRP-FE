import type { AxiosAdapter } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getErrorMessage } from '@/utils'
import { AUTH_UNAUTHORIZED_EVENT, axiosInstance } from './axiosInstance'

function respond(status: number, data: unknown): AxiosAdapter {
  return async (config) => {
    const response = { status, data, statusText: '', headers: {}, config }
    if (status >= 400) {
      throw Object.assign(new Error(`Request failed with status code ${status}`), {
        isAxiosError: true,
        config,
        response,
      })
    }
    return response
  }
}

describe('axiosInstance', () => {
  let store: Record<string, string>
  const dispatchEvent = vi.fn()

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => (store[k] = v),
      removeItem: (k: string) => delete store[k],
    })
    vi.stubGlobal('window', { dispatchEvent })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    dispatchEvent.mockReset()
  })

  it('gắn Bearer token khi đã đăng nhập', async () => {
    store['capnong-token'] = 'abc'
    const res = await axiosInstance.get('/me', { adapter: respond(200, { result: 1 }) })
    expect(res.config.headers.Authorization).toBe('Bearer abc')
  })

  it('không gắn Authorization khi chưa có token', async () => {
    const res = await axiosInstance.get('/me', { adapter: respond(200, {}) })
    expect(res.config.headers.Authorization).toBeUndefined()
  })

  it('401: phát event đăng xuất và reject ApiError', async () => {
    const err = await axiosInstance
      .get('/me', { adapter: respond(401, { message: 'Hết phiên đăng nhập' }) })
      .catch((e: unknown) => e)
    expect(err).toEqual({
      status: 401,
      message: 'Hết phiên đăng nhập',
      data: { message: 'Hết phiên đăng nhập' },
    })
    expect(dispatchEvent).toHaveBeenCalledOnce()
    expect(dispatchEvent.mock.calls[0][0].type).toBe(AUTH_UNAUTHORIZED_EVENT)
  })

  it('lỗi khác 401 không đăng xuất, message vẫn đọc được qua getErrorMessage', async () => {
    const err = await axiosInstance
      .get('/x', { adapter: respond(500, { message: 'Lỗi máy chủ' }) })
      .catch((e: unknown) => e)
    expect(dispatchEvent).not.toHaveBeenCalled()
    expect(getErrorMessage(err)).toBe('Lỗi máy chủ')
  })
})

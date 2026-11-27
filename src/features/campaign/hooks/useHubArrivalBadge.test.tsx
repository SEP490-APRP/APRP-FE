import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { adminHubService, type DeliveryHub } from '@/services'
import { useHubArrivalBadge } from './useHubArrivalBadge'

describe('số đỏ đơn chờ hub xác nhận', () => {
  it('cộng số đơn chờ xác nhận của mọi hub', async () => {
    vi.spyOn(adminHubService, 'list').mockResolvedValue([{ hubId: 1, unconfirmedOrders: 2 }, { hubId: 2, unconfirmedOrders: 1 }] as DeliveryHub[])
    const client = new QueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
    const { result } = renderHook(() => useHubArrivalBadge(), { wrapper })

    await waitFor(() => expect(result.current.count).toBe(3))
  })
})

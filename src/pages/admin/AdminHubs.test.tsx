import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { adminHubService, type DeliveryHub } from '@/services'
import AdminHubs from './AdminHubs'

const hubs = Array.from({ length: 23 }, (_, i) => ({
  hubId: i + 1,
  name: `Hub số ${i + 1}`,
  address: `${i + 1} Quang Trung`,
  latitude: 10.8,
  longitude: 106.6,
  active: true,
  waitingOrders: 0,
  unconfirmedOrders: i === 20 ? 2 : 0,
})) as DeliveryHub[]

describe('AdminHubs', () => {
  it('chia 10 hub mỗi trang, hub có hàng chờ xác nhận nằm đầu trang 1', async () => {
    vi.spyOn(adminHubService, 'list').mockResolvedValue(hubs)
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AdminHubs />
      </QueryClientProvider>,
    )
    const rows = () => within(screen.getAllByRole('rowgroup')[1]).getAllByRole('row')
    await screen.findByText('Hub số 1')
    expect(rows()).toHaveLength(10)
    expect(rows()[0].textContent).toContain('Hub số 21')

    fireEvent.click(screen.getByRole('button', { name: 'Trang 3' }))
    expect(rows()).toHaveLength(3)

    // Đổi bộ lọc thì về trang đầu
    fireEvent.click(screen.getByRole('tab', { name: /Đang hoạt động/ }))
    expect(rows()).toHaveLength(10)
  })
})

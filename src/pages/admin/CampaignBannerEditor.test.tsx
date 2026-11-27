import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import type { CampaignResponse } from '@/services'
import CampaignBannerEditor from './CampaignBannerEditor'

const campaign = {
  campaignId: 1, title: 'Khoai lang mật', status: 'ACTIVE', bannerOnHome: false, cutoffAt: '2027-01-01T18:00:00',
  targetVolumeKg: 1000, minThresholdKg: 500, bookedVolumeKg: 0, rescuePricePerKg: 15000, depositPercent: 0.3,
} as unknown as CampaignResponse

describe('banner trang chủ', () => {
  it('chiến dịch mới đang tắt; chỉ dẫn vào công tắc và bật được ngay', () => {
    const done = vi.fn()
    render(
      <QueryClientProvider client={new QueryClient()}>
        <CampaignBannerEditor c={campaign} onNotice={() => undefined} guide onGuideDone={done} />
      </QueryClientProvider>,
    )
    const toggle = screen.getByRole('checkbox', { name: 'Hiện ở trang chủ' }) as HTMLInputElement
    expect(toggle.checked).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: /Bật ngay/ }))
    expect(toggle.checked).toBe(true)
    expect(done).toHaveBeenCalled()
    expect(screen.queryByRole('dialog', { name: 'Bật hiện ở trang chủ' })).toBeNull()
  })
})

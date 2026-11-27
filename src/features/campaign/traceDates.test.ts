import { describe, expect, it, vi } from 'vitest'
import axiosInstance from '@/services/api/axiosInstance'
import { campaignService } from '@/services/campaign.service'
import { fmtLabelDay } from './packageLabels'

describe('ngày trên trang quét QR', () => {
  it('đổi hạn dùng dạng mảng của máy chủ để không hiện Invalid Date', async () => {
    vi.spyOn(axiosInstance, 'get').mockResolvedValue({
      data: { code: 1000, result: { bestBefore: [2026, 12, 1, 0, 0], harvestDate: [2026, 11, 24], packedAt: [2026, 11, 26, 8, 30, 15] } },
    })
    const p = await campaignService.trace('CNabc')
    expect(p.bestBefore).toBe('2026-12-01T00:00:00')
    expect(fmtLabelDay(p.bestBefore)).toBe('01/12/2026')
    expect(fmtLabelDay(p.harvestDate)).toBe('24/11/2026')
  })
})

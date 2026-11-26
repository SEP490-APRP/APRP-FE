import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { FleetVehicle } from '@/features/campaign/deliveryPlan'
import type { HubFeeConfig } from '@/services'
import TruckFeeTable from './TruckFeeTable'

const cfg = {
  openKm: 4,
  tiers: [
    { label: 'Xe tải nhỏ', maxKg: 1000, openFee: 250000, perKm: 13000, perKmOver20: 11000 },
    { label: 'Xe tải trung', maxKg: 2500, openFee: 350000, perKm: 15000, perKmOver20: 13000 },
  ],
  hubServiceFeeRate: 0,
} as unknown as HubFeeConfig

const vehicle = (tripNo: number, totalKg: number, routeKm: number) => ({ key: `xe-${tripNo}`, tripNo, totalKg, routeKm }) as FleetVehicle

describe('TruckFeeTable', () => {
  it('hiện bảng giá và cách tính đúng số trên thẻ xe', () => {
    render(<TruckFeeTable cfg={cfg} vehicles={[vehicle(1, 1910, 53.5), vehicle(2, 950, 19.8)]} />)
    const text = screen.getByRole('region', { name: 'Bảng cước xe tải' }).textContent
    expect(text).toContain('đến 2,5 tấn')
    expect(text).toContain('Km 5 - 20')
    const rows = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(rows[0]).toContain('33,5 km')
    expect(rows[0]).toContain('1.026.000')
    expect(rows[1]).toContain('15,8 km')
    expect(rows[1]).toContain('455.000')
  })
})

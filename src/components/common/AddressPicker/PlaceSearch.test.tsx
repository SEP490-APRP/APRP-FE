import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlaceSearch, type PlaceValue } from './PlaceSearch'

vi.mock('@/components/map/GoogleMapTrackingModal', () => ({ loadGoogleMapsScript: () => Promise.reject(new Error('no map')) }))
vi.mock('./placeSuggest', () => ({
  suggestPlaces: () => Promise.resolve([{ id: 'a', main: '20 Võ Văn Ngân', secondary: 'Thủ Đức', full: '20 Võ Văn Ngân, Thủ Đức', lat: 10.85, lng: 106.77 }]),
  locatePlace: () => Promise.resolve({}),
}))

describe('ô địa chỉ điểm tập kết', () => {
  it('gõ ra gợi ý, chọn gợi ý thì có tên, địa chỉ và toạ độ', async () => {
    const seen: PlaceValue[] = []
    function Host() {
      const [v, setV] = useState<PlaceValue>({ name: '', address: '' })
      return <PlaceSearch id="s" label="Điểm tập kết" value={v} onChange={(n) => { seen.push(n); setV(n) }} />
    }
    render(<Host />)
    fireEvent.change(screen.getByLabelText('Điểm tập kết'), { target: { value: 'vo van ngan' } })
    fireEvent.click(await screen.findByText('20 Võ Văn Ngân', undefined, { timeout: 2000 }))

    await waitFor(() => expect(seen.at(-1)).toEqual({ name: '20 Võ Văn Ngân', address: '20 Võ Văn Ngân, Thủ Đức', lat: 10.85, lng: 106.77 }))
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})

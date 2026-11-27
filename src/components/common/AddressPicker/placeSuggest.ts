/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PlaceSuggestion {
  id: string
  /** Dòng chính: tên địa điểm hoặc số nhà, đường */
  main: string
  secondary: string
  /** Địa chỉ đầy đủ */
  full: string
  placeId?: string
  lat?: number
  lng?: number
}

const geocode = (g: any, request: Record<string, unknown>) =>
  new Promise<any[]>((resolve, reject) => {
    new g.Geocoder().geocode(request, (res: any[] | null, status: string) => {
      if (status === 'OK') resolve(res ?? [])
      else if (status === 'ZERO_RESULTS') resolve([])
      else reject(new Error(status))
    })
  })

/** Places API bản mới */
async function fromNewPlaces(g: any, input: string): Promise<PlaceSuggestion[]> {
  const { suggestions } = await g.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input, includedRegionCodes: ['vn'], language: 'vi' })
  return (suggestions ?? [])
    .map((s: any) => s.placePrediction)
    .filter(Boolean)
    .map((p: any) => ({
      id: p.placeId,
      placeId: p.placeId,
      main: p.mainText?.text ?? p.text.text,
      secondary: p.secondaryText?.text ?? '',
      full: p.text.text,
    }))
}

/** Places API bản cũ */
function fromLegacyPlaces(g: any, input: string) {
  return new Promise<PlaceSuggestion[]>((resolve, reject) => {
    new g.places.AutocompleteService().getPlacePredictions({ input, componentRestrictions: { country: 'vn' } }, (res: any[] | null, status: string) => {
      if (status !== 'OK' && status !== 'ZERO_RESULTS') return reject(new Error(status))
      resolve((res ?? []).map((p) => ({
        id: p.place_id,
        placeId: p.place_id,
        main: p.structured_formatting?.main_text ?? p.description,
        secondary: p.structured_formatting?.secondary_text ?? '',
        full: p.description,
      })))
    })
  })
}

async function fromGeocoder(g: any, input: string): Promise<PlaceSuggestion[]> {
  const res = await geocode(g, { address: `${input}, Việt Nam`, region: 'vn' })
  return res.slice(0, 5).map((r) => {
    const parts = String(r.formatted_address).split(',')
    return {
      id: r.place_id ?? r.formatted_address,
      main: parts[0].trim(),
      secondary: parts.slice(1).join(',').trim(),
      full: r.formatted_address,
      lat: r.geometry.location.lat(),
      lng: r.geometry.location.lng(),
    }
  })
}

/**
 * Gợi ý địa chỉ khi đang gõ. Khoá Google Maps có thể chưa bật Places: thử Places bản mới, bản cũ rồi tới Geocoding.
 */
export async function suggestPlaces(input: string): Promise<PlaceSuggestion[]> {
  const g = (window as any).google?.maps
  if (!g) return []
  if (g.places?.AutocompleteSuggestion) {
    try {
      return await fromNewPlaces(g, input)
    } catch { /* chưa bật Places mới: thử cách sau */ }
  }
  if (g.places?.AutocompleteService) {
    try {
      return await fromLegacyPlaces(g, input)
    } catch { /* chưa bật Places cũ: thử Geocoding */ }
  }
  return fromGeocoder(g, input)
}

/** Toạ độ của gợi ý đã chọn; không lấy được thì để trống cho người dùng ghim trên bản đồ */
export async function locatePlace(s: PlaceSuggestion): Promise<{ lat?: number; lng?: number }> {
  if (s.lat != null && s.lng != null) return { lat: s.lat, lng: s.lng }
  const g = (window as any).google?.maps
  if (!g) return {}
  try {
    const [hit] = await geocode(g, s.placeId ? { placeId: s.placeId } : { address: s.full, region: 'vn' })
    return hit ? { lat: hit.geometry.location.lat(), lng: hit.geometry.location.lng() } : {}
  } catch {
    return {}
  }
}

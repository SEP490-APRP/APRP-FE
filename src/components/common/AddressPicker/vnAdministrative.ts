import { useQuery, type QueryClient } from '@tanstack/react-query'
import type { AddressValue } from './AddressPicker'

/**
 * Danh mục hành chính Việt Nam sau sáp nhập 07/2025 (2 cấp: Tỉnh/Thành phố → Phường/Xã/Đặc khu).
 * Nguồn công khai: provinces.open-api.vn (API v2).
 */
const BASE = 'https://provinces.open-api.vn/api/v2'

export interface VnUnit {
  code: number
  name: string
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Không tải được danh mục địa chính (${res.status})`)
  return res.json() as Promise<T>
}

const fetchProvinces = async () => (await getJson<VnUnit[]>(`${BASE}/p/`)).map(({ code, name }) => ({ code, name }))
const fetchWards = async (provinceCode: number) => {
  const p = await getJson<{ wards: VnUnit[] }>(`${BASE}/p/${provinceCode}?depth=2`)
  return (p.wards ?? []).map(({ code, name }) => ({ code, name }))
}

export function useProvinces() {
  return useQuery({
    queryKey: ['vn-admin', 'provinces'],
    queryFn: fetchProvinces,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
  })
}

export function useWards(provinceCode?: number) {
  return useQuery({
    queryKey: ['vn-admin', 'wards', provinceCode],
    queryFn: () => fetchWards(provinceCode as number),
    enabled: provinceCode != null,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
  })
}

/** Tìm không dấu: "long binh" khớp "Phường Long Bình" */
export function normalizeVi(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

/**
 * Tách chuỗi địa chỉ đã ghép ("Số nhà, Phường X, Tỉnh Y") ngược lại thành Tỉnh/Phường có mã
 * để AddressPicker hiện sẵn. Không khớp được thì trả nguyên chuỗi ở ô địa chỉ cụ thể.
 */
export async function parseAddress(
  qc: QueryClient,
  text: string,
  coords?: { lat?: number; lng?: number },
): Promise<AddressValue> {
  const base: AddressValue = { provinceName: '', wardName: '', detail: text, lat: coords?.lat, lng: coords?.lng }
  const parts = text.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length < 2) return base
  try {
    const provinces = await qc.fetchQuery({ queryKey: ['vn-admin', 'provinces'], queryFn: fetchProvinces, staleTime: Infinity })
    const pName = normalizeVi(parts[parts.length - 1])
    const province = provinces.find((p) => normalizeVi(p.name) === pName)
    if (!province) return base
    const wards = await qc.fetchQuery({ queryKey: ['vn-admin', 'wards', province.code], queryFn: () => fetchWards(province.code), staleTime: Infinity })
    const wName = normalizeVi(parts[parts.length - 2])
    const ward = wards.find((w) => normalizeVi(w.name) === wName)
    return {
      ...base,
      provinceCode: province.code,
      provinceName: province.name,
      wardCode: ward?.code,
      wardName: ward?.name ?? '',
      detail: parts.slice(0, ward ? -2 : -1).join(', '),
    }
  } catch {
    return base
  }
}

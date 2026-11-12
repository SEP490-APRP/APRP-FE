import { useQuery } from '@tanstack/react-query'

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

export function useProvinces() {
  return useQuery({
    queryKey: ['vn-admin', 'provinces'],
    queryFn: async () => (await getJson<VnUnit[]>(`${BASE}/p/`)).map(({ code, name }) => ({ code, name })),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
  })
}

export function useWards(provinceCode?: number) {
  return useQuery({
    queryKey: ['vn-admin', 'wards', provinceCode],
    queryFn: async () => {
      const p = await getJson<{ wards: VnUnit[] }>(`${BASE}/p/${provinceCode}?depth=2`)
      return (p.wards ?? []).map(({ code, name }) => ({ code, name }))
    },
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

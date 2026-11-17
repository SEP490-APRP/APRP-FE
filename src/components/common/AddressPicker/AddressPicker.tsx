import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Loader2, MapPin, Search, X } from 'lucide-react'
import { loadGoogleMapsScript } from '@/components/map/GoogleMapTrackingModal'
import { normalizeVi, useProvinces, useWards, type VnUnit } from './vnAdministrative'

export interface AddressValue {
  provinceCode?: number
  provinceName: string
  wardCode?: number
  wardName: string
  /** Số nhà, tên đường, toà nhà… */
  detail: string
  lat?: number
  lng?: number
}

export const EMPTY_ADDRESS: AddressValue = { provinceName: '', wardName: '', detail: '' }

/** "S902 Vinhome Grand Park, Phường Long Bình, Thành phố Hồ Chí Minh" */
export function composeAddress(v: AddressValue): string {
  return [v.detail.trim(), v.wardName, v.provinceName].filter(Boolean).join(', ')
}

interface Props {
  value: AddressValue
  onChange: (v: AddressValue) => void
  /** Nhãn ô địa chỉ cụ thể */
  detailLabel?: string
  required?: boolean
  showMap?: boolean
}

/** Chọn địa điểm kiểu sàn TMĐT: Tỉnh/Thành phố → Phường/Xã, địa chỉ cụ thể, ghim trên bản đồ */
export function AddressPicker({ value, onChange, detailLabel = 'Địa chỉ cụ thể', required, showMap = true }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'province' | 'ward'>('province')
  const [q, setQ] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const provinces = useProvinces()
  const wards = useWards(value.provinceCode)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0)
  }, [tab, open])
  const switchTab = (t: 'province' | 'ward') => {
    setQ('')
    setTab(t)
  }

  const list = tab === 'province' ? provinces : wards
  const filtered = useMemo(() => {
    const items = list.data ?? []
    const nq = normalizeVi(q)
    return nq ? items.filter((u) => normalizeVi(u.name).includes(nq)) : items
  }, [list.data, q])

  const pickProvince = (p: VnUnit) => {
    if (p.code !== value.provinceCode) {
      onChange({ ...value, provinceCode: p.code, provinceName: p.name, wardCode: undefined, wardName: '', lat: undefined, lng: undefined })
    }
    switchTab('ward')
  }
  const pickWard = (w: VnUnit) => {
    onChange({ ...value, wardCode: w.code, wardName: w.name, lat: undefined, lng: undefined })
    setOpen(false)
  }

  const areaText = [value.provinceName, value.wardName].filter(Boolean).join(', ')

  return (
    <div className="flex flex-col gap-3">
      {/* Tỉnh/Thành phố, Phường/Xã */}
      <div ref={boxRef} className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            switchTab(value.provinceCode && !value.wardCode ? 'ward' : 'province')
            setOpen((o) => !o)
          }}
          className={`relative flex w-full items-center justify-between rounded-md border bg-white px-3 pb-2 pt-4 text-left text-sm transition-colors ${
            open ? 'border-[#326318] ring-2 ring-[#326318]/15' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <span className="absolute -top-2 left-2 bg-white px-1 text-[11px] font-normal text-gray-500">
            Tỉnh/Thành phố, Phường/Xã{required && <span className="text-red-500"> *</span>}
          </span>
          <span className={`truncate ${areaText ? 'text-gray-900' : 'text-gray-400'}`}>{areaText || 'Chọn Tỉnh/Thành phố, Phường/Xã'}</span>
          <ChevronDown size={16} className={`shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl">
            <div role="tablist" className="grid grid-cols-2 border-b border-gray-200 text-sm">
              {(
                [
                  ['province', 'Tỉnh/Thành phố', true],
                  ['ward', 'Phường/Xã', !!value.provinceCode],
                ] as const
              ).map(([id, label, enabled]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  disabled={!enabled}
                  onClick={() => switchTab(id)}
                  className={`border-b-2 py-2.5 font-semibold transition-colors disabled:cursor-not-allowed disabled:text-gray-300 ${
                    tab === id ? 'border-[#326318] text-[#326318]' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative border-b border-gray-100 px-3 py-2">
              <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={tab === 'province' ? 'Tìm tỉnh/thành phố' : 'Tìm phường/xã'}
                className="w-full rounded-md bg-gray-50 py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-[#326318]/40"
              />
            </div>
            <ul role="listbox" className="max-h-64 overflow-y-auto py-1 text-sm">
              {list.isLoading && (
                <li className="flex items-center gap-2 px-4 py-3 text-gray-500"><Loader2 size={14} className="animate-spin" /> Đang tải…</li>
              )}
              {list.isError && (
                <li className="px-4 py-3 text-red-600">
                  Không tải được danh sách.{' '}
                  <button type="button" onClick={() => list.refetch()} className="font-semibold underline">Thử lại</button>
                </li>
              )}
              {!list.isLoading && !list.isError && filtered.length === 0 && <li className="px-4 py-3 text-gray-400">Không tìm thấy</li>}
              {filtered.map((u) => {
                const active = tab === 'province' ? u.code === value.provinceCode : u.code === value.wardCode
                return (
                  <li key={u.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => (tab === 'province' ? pickProvince(u) : pickWard(u))}
                      className={`block w-full px-4 py-2 text-left hover:bg-[#f4f7f1] ${active ? 'font-semibold text-[#326318]' : 'text-gray-800'}`}
                    >
                      {u.name}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Địa chỉ cụ thể */}
      <label className="relative block">
        <span className="absolute -top-2 left-2 bg-white px-1 text-[11px] font-normal text-gray-500">
          {detailLabel}{required && <span className="text-red-500"> *</span>}
        </span>
        <textarea
          rows={2}
          required={required}
          disabled={!value.wardCode}
          value={value.detail}
          onChange={(e) => onChange({ ...value, detail: e.target.value, lat: undefined, lng: undefined })}
          placeholder={value.wardCode ? 'Số nhà, tên đường, toà nhà…' : 'Chọn Tỉnh/Thành phố, Phường/Xã trước'}
          className="w-full resize-none rounded-md border border-gray-300 px-3 pb-2 pt-4 text-sm font-normal text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#326318] focus:ring-2 focus:ring-[#326318]/15 disabled:bg-gray-50"
        />
      </label>

      {showMap && <AddressMap value={value} onChange={onChange} />}
    </div>
  )
}

/* ─────────────── Bản đồ: tự định vị theo địa chỉ, kéo ghim để chỉnh ─────────────── */

const HCM = { lat: 10.7769, lng: 106.7009 }

function AddressMap({ value, onChange }: { value: AddressValue; onChange: (v: AddressValue) => void }) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const geocoderRef = useRef<any>(null)
  const valueRef = useRef(value)
  valueRef.current = value
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [locating, setLocating] = useState(false)

  // Khởi tạo Google Maps 1 lần
  useEffect(() => {
    let cancelled = false
    loadGoogleMapsScript(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '')
      .then(() => {
        if (cancelled || !elRef.current) return
        const g = window.google.maps
        const start = value.lat != null && value.lng != null ? { lat: value.lat, lng: value.lng } : HCM
        const map = new g.Map(elRef.current, {
          center: start,
          zoom: value.lat != null ? 16 : 11,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'cooperative',
          clickableIcons: false,
        })
        const marker = new g.Marker({ map, position: start, draggable: true, visible: value.lat != null })
        const commit = (lat: number, lng: number) => {
          marker.setPosition({ lat, lng })
          marker.setVisible(true)
          onChange({ ...valueRef.current, lat, lng })
        }
        marker.addListener('dragend', (e: any) => commit(e.latLng.lat(), e.latLng.lng()))
        map.addListener('click', (e: any) => commit(e.latLng.lat(), e.latLng.lng()))
        mapRef.current = map
        markerRef.current = marker
        geocoderRef.current = new g.Geocoder()
        setState('ready')
      })
      .catch(() => !cancelled && setState('error'))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Địa chỉ đổi mà chưa có toạ độ → tự tìm toạ độ (debounce)
  const query = composeAddress(value)
  useEffect(() => {
    if (state !== 'ready' || !value.provinceName || value.lat != null) return
    const zoom = value.detail.trim() ? 17 : value.wardName ? 14 : 11
    const t = setTimeout(() => {
      setLocating(true)
      geocoderRef.current.geocode({ address: `${query}, Việt Nam`, region: 'vn' }, (res: any[] | null, status: string) => {
        setLocating(false)
        if (status !== 'OK' || !res?.length) return
        const loc = res[0].geometry.location
        mapRef.current.setCenter(loc)
        mapRef.current.setZoom(zoom)
        markerRef.current.setPosition(loc)
        markerRef.current.setVisible(true)
        // Chỉ ghi toạ độ khi đã có địa chỉ cụ thể (đủ chính xác cho điểm tập kết)
        if (value.detail.trim()) onChange({ ...valueRef.current, lat: loc.lat(), lng: loc.lng() })
      })
    }, 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, query, value.lat])

  if (state === 'error') {
    return (
      <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">
        Không tải được bản đồ, địa chỉ vẫn được lưu bình thường.
      </p>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-md border border-gray-200">
      <div ref={elRef} className="h-48 w-full bg-[#f1ede4] sm:h-56" />
      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
          <Loader2 size={16} className="mr-2 animate-spin" /> Đang tải bản đồ…
        </div>
      )}
      {state === 'ready' && (
        <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-gray-700 shadow">
          {locating ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} className="text-[#326318]" />}
          {value.lat != null ? 'Kéo ghim hoặc chạm bản đồ để chỉnh vị trí' : 'Nhập địa chỉ cụ thể để ghim vị trí'}
        </div>
      )}
      {value.lat != null && (
        <button
          type="button"
          onClick={() => {
            markerRef.current?.setVisible(false)
            onChange({ ...value, lat: undefined, lng: undefined })
          }}
          className="absolute right-2 top-2 rounded-full bg-white/95 p-1 text-gray-500 shadow hover:text-gray-800"
          aria-label="Bỏ ghim"
          title="Bỏ ghim, định vị lại theo địa chỉ"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin, Search, X } from 'lucide-react'
import { loadGoogleMapsScript } from '@/components/map/GoogleMapTrackingModal'
import { AddressMap, EMPTY_ADDRESS } from './AddressPicker'
import { locatePlace, suggestPlaces, type PlaceSuggestion } from './placeSuggest'

export interface PlaceValue {
  /** Tên ngắn của địa điểm (dòng chính của gợi ý) */
  name: string
  address: string
  lat?: number
  lng?: number
}

/** Một ô nhập địa chỉ có gợi ý; chọn gợi ý là ghim luôn trên bản đồ, vẫn kéo ghim / chạm bản đồ để chỉnh */
export function PlaceSearch({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string
  label: string
  value: PlaceValue
  onChange: (v: PlaceValue) => void
  placeholder?: string
}) {
  const [items, setItems] = useState<PlaceSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [searching, setSearching] = useState(false)
  const [failed, setFailed] = useState(false)
  /** Chỉ tìm khi người dùng đang gõ, không tìm lại sau khi đã chọn */
  const [typed, setTyped] = useState<string | null>(null)
  const request = useRef(0)
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    loadGoogleMapsScript(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').catch(() => setFailed(true))
  }, [])

  useEffect(() => {
    const text = typed?.trim() ?? ''
    const mine = ++request.current
    if (text.length < 3) {
      setItems([])
      setSearching(false)
      return
    }
    setSearching(true)
    const t = setTimeout(() => {
      suggestPlaces(text)
        .then((res) => {
          if (mine !== request.current) return
          setItems(res)
          setActive(0)
          setFailed(false)
        })
        .catch(() => mine === request.current && setFailed(true))
        .finally(() => mine === request.current && setSearching(false))
    }, 350)
    return () => clearTimeout(t)
  }, [typed])

  const pick = async (s: PlaceSuggestion) => {
    setOpen(false)
    setTyped(null)
    const next = { name: s.main.slice(0, 200), address: s.full.slice(0, 500) }
    onChange({ ...next, lat: s.lat, lng: s.lng })
    if (s.lat == null) {
      const at = await locatePlace(s)
      // Trong lúc chờ người dùng đã gõ địa chỉ khác thì bỏ qua
      if (valueRef.current.address === next.address) onChange({ ...next, ...at })
    }
  }
  const type = (text: string) => {
    const address = text.slice(0, 500)
    setTyped(address)
    setOpen(true)
    onChange({ name: address.split(',')[0].trim().slice(0, 200), address, lat: undefined, lng: undefined })
  }
  const showList = open && (typed?.trim().length ?? 0) >= 3

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-bold text-gray-700">{label}</label>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          id={id}
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          value={value.address}
          placeholder={placeholder}
          onChange={(e) => type(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!showList) return
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
              if (items.length) setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length)
            } else if (e.key === 'Enter') {
              e.preventDefault()
              if (items[active]) void pick(items[active])
            } else if (e.key === 'Escape') {
              // Chỉ đóng danh sách gợi ý, không đóng cửa sổ đang nhập
              e.stopPropagation()
              setOpen(false)
            }
          }}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-[#326318] focus:ring-2 focus:ring-[#326318]/15"
        />
        {searching ? (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
        ) : value.address ? (
          <button type="button" aria-label="Xoá địa chỉ" onClick={() => type('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-gray-700">
            <X size={15} />
          </button>
        ) : null}
        {showList && (
          <ul id={`${id}-list`} role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
            {items.map((s, i) => (
              <li key={s.id} role="option" aria-selected={i === active}>
                {/* onMouseDown giữ ô nhập không mất focus trước khi bấm chọn */}
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => void pick(s)} onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-start gap-2 px-3 py-2 text-left ${i === active ? 'bg-[#f4f7f1]' : ''}`}>
                  <MapPin size={15} className="mt-0.5 shrink-0 text-[#326318]" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-gray-900">{s.main}</span>
                    {s.secondary && <span className="block truncate text-xs text-gray-500">{s.secondary}</span>}
                  </span>
                </button>
              </li>
            ))}
            {items.length === 0 && (
              <li className="px-3 py-2.5 text-xs text-gray-500">
                {searching ? 'Đang tìm…' : failed ? 'Không lấy được gợi ý, bạn chạm bản đồ để ghim vị trí.' : 'Không thấy địa chỉ phù hợp, thử ghi thêm phường, tỉnh.'}
              </li>
            )}
          </ul>
        )}
      </div>
      {value.address && value.lat == null && <p className="text-xs font-semibold text-amber-700">Chọn một gợi ý hoặc chạm bản đồ để ghim vị trí.</p>}
      <AddressMap
        value={{ ...EMPTY_ADDRESS, detail: value.address, lat: value.lat, lng: value.lng }}
        onChange={(v) => onChange({ ...valueRef.current, lat: v.lat, lng: v.lng })}
        hint="Chọn gợi ý hoặc chạm bản đồ để ghim vị trí"
      />
    </div>
  )
}

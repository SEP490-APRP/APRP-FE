import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Loader2, PackageCheck, ScanLine, X } from 'lucide-react'
import type { HubTripBox } from '@/services'
import { isPackageToken, savedWebUrl, traceUrl } from '@/features/campaign/packageLabels'
import { scanBox } from '@/features/campaign/crateScan'

const allCrates = (b: HubTripBox) => Array.from({ length: b.crates }, (_, i) => i + 1)
const isFull = (b: HubTripBox) => b.loaded.length >= b.crates

type Filter = 'all' | 'left' | 'full'

/** Cửa sổ kiểm thùng: mỗi đơn một thẻ có mã QR; quét tem hoặc bấm từng thùng. Dùng khi tài xế bốc hàng và shipper lấy hàng ở hub */
export default function CrateScanDialog({
  title,
  subtitle,
  word,
  boxes,
  line,
  saving = false,
  onSet,
  onClose,
  action,
}: {
  title: string
  subtitle: string
  /** "nhận" (tài xế bốc lên xe) hoặc "lấy" (shipper lấy ở hub) */
  word: 'nhận' | 'lấy'
  boxes: HubTripBox[]
  /** Dòng ghi hub trên mỗi thẻ */
  line: (b: HubTripBox) => string
  saving?: boolean
  onSet: (b: HubTripBox, loaded: number[]) => void
  onClose: () => void
  /** Nút việc tiếp theo ở chân cửa sổ */
  action?: ReactNode
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [scan, setScan] = useState('')
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [zoom, setZoom] = useState<HubTripBox | null>(null)
  const webUrl = savedWebUrl()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (zoom ? setZoom(null) : onClose())
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, zoom])

  const total = boxes.reduce((s, b) => s + b.crates, 0)
  const done = boxes.reduce((s, b) => s + b.loaded.length, 0)
  const filters: { id: Filter; label: string; list: HubTripBox[] }[] = [
    { id: 'all', label: 'Tất cả', list: boxes },
    { id: 'left', label: `Chưa ${word} đủ`, list: boxes.filter((b) => !isFull(b)) },
    { id: 'full', label: `Đã ${word} đủ`, list: boxes.filter(isFull) },
  ]
  const list = filters.find((f) => f.id === filter)!.list

  const toggle = (b: HubTripBox, n: number) => onSet(b, b.loaded.includes(n) ? b.loaded.filter((x) => x !== n) : [...b.loaded, n])
  const submit = () => {
    if (!scan.trim()) return
    const r = scanBox(boxes, scan)
    setScan('')
    if ('error' in r) {
      setNote({ ok: false, text: r.error })
      return
    }
    onSet(r.box, [...r.box.loaded, r.crate])
    setNote({ ok: true, text: `Đã ${word} thùng ${r.crate}/${r.box.crates} của đơn ${r.box.code} (${r.box.recipientName ?? ''}).` })
  }

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-900/55 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="crate-scan-title" onClick={(e) => e.stopPropagation()}
        className="flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-[#f6f8f3] shadow-2xl sm:rounded-3xl">
        <header className="flex items-start justify-between gap-3 bg-[#326318] px-5 py-4 text-white">
          <div className="min-w-0">
            <h3 id="crate-scan-title" className="flex items-center gap-2 text-xl font-black"><PackageCheck size={20} className="text-[#ffea79]" /> {title}</h3>
            <p className="truncate text-xs text-white/75">{subtitle}</p>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-full bg-white/10 p-2 hover:bg-white/20"><X size={18} /></button>
        </header>

        <div className="flex flex-col gap-3 border-b border-gray-200 bg-white px-5 py-3">
          <div role="tablist" aria-label="Tình trạng kiểm thùng" className="grid grid-cols-3 gap-2">
            {filters.map((f) => (
              <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
                className={`rounded-2xl border-2 px-3 py-2 text-left ${filter === f.id ? 'border-[#326318] bg-[#eef6e7]' : 'border-gray-100 bg-gray-50'}`}>
                <span className="block text-[11px] font-bold text-gray-500">{f.label}</span>
                <span className="block text-lg font-black tabular-nums text-gray-900">{f.list.length} đơn</span>
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); submit() }} className="flex gap-2">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-gray-300 px-3 focus-within:border-[#326318]">
              <ScanLine size={16} className="shrink-0 text-gray-400" />
              <input autoFocus value={scan} onChange={(e) => setScan(e.target.value)} aria-label="Quét hoặc nhập mã"
                placeholder="Quét QR trên thùng, hoặc nhập mã đơn" className="w-full py-2.5 text-sm outline-none" />
            </label>
            <button type="submit" className="rounded-xl bg-[#326318] px-4 text-sm font-bold capitalize text-white">{word}</button>
          </form>
          {note && <p role="status" className={`text-xs font-bold ${note.ok ? 'text-[#326318]' : 'text-red-600'}`}>{note.text}</p>}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {list.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Không có đơn nào trong mục này.</p>
          ) : (
            <ul className="grid items-start gap-3 sm:grid-cols-2">
              {list.map((b) => {
                const full = isFull(b)
                return (
                  <li key={b.orderId} className={`flex flex-col gap-2 rounded-2xl border-2 bg-white p-3 ${full ? 'border-[#326318]' : 'border-gray-100'}`}>
                    <div className="flex gap-3">
                      {isPackageToken(b.qrCode) ? (
                        <button type="button" onClick={() => setZoom(b)} aria-label={`Phóng to mã QR đơn ${b.code}`} className="h-fit shrink-0 rounded-xl border border-gray-200 p-1.5 hover:border-[#326318]">
                          <QRCodeSVG value={traceUrl(webUrl, b.qrCode)} size={84} level="M" />
                        </button>
                      ) : (
                        <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-center text-[11px] text-gray-500">Chưa có mã QR</span>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col gap-1 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <b className="truncate text-sm text-gray-900">{b.recipientName}</b>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${full ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{b.loaded.length}/{b.crates} thùng</span>
                        </div>
                        <p className="font-bold text-gray-700">{b.crates} thùng × {b.crateKg} kg = {b.crates * b.crateKg} kg</p>
                        <p className="truncate text-gray-500">{b.code}</p>
                        <p className="truncate font-semibold text-[#326318]">{line(b)}</p>
                        <button type="button" onClick={() => onSet(b, full ? [] : allCrates(b))}
                          className="mt-auto w-fit rounded-lg border border-[#326318] px-2.5 py-1 font-bold text-[#326318]">
                          {full ? 'Bỏ chọn' : `${word === 'nhận' ? 'Nhận' : 'Lấy'} cả đơn`}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {allCrates(b).map((n) => {
                        const on = b.loaded.includes(n)
                        return (
                          <button key={n} type="button" aria-pressed={on} aria-label={`Thùng ${n} đơn ${b.code}`} onClick={() => toggle(b, n)}
                            className={`flex h-9 min-w-9 items-center justify-center gap-0.5 rounded-lg border px-1.5 text-xs font-black ${on ? 'border-[#326318] bg-[#326318] text-white' : 'border-gray-300 bg-white text-gray-600'}`}>
                            {on && <Check size={12} />}{n}
                          </button>
                        )
                      })}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-3 border-t border-gray-200 bg-white px-5 py-3">
          <div className="min-w-[180px] flex-1">
            <p className="flex items-center gap-2 text-sm font-black text-gray-900">
              Đã {word} {done}/{total} thùng
              {saving && <Loader2 size={14} className="animate-spin text-[#326318]" />}
            </p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-[#326318] transition-[width]" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700">Đóng</button>
          {action}
        </footer>
      </div>

      {zoom && isPackageToken(zoom.qrCode) && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/60 p-4" onClick={(e) => { e.stopPropagation(); setZoom(null) }}>
          <div role="dialog" aria-modal="true" aria-label={`Mã QR đơn ${zoom.code}`} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center">
            <QRCodeSVG value={traceUrl(webUrl, zoom.qrCode)} size={260} level="M" />
            <p className="text-base font-black text-gray-900">{zoom.recipientName} · {zoom.crates} thùng × {zoom.crateKg} kg</p>
            <p className="text-xs text-gray-500">{zoom.code} · {zoom.hubName}</p>
            <a href={traceUrl(webUrl, zoom.qrCode)} target="_blank" rel="noreferrer" className="w-full rounded-xl border border-gray-300 py-2.5 text-sm font-bold text-gray-700">Xem thông tin thùng</a>
            <button type="button" onClick={() => setZoom(null)} className="text-xs font-bold text-gray-500 underline">Đóng</button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}

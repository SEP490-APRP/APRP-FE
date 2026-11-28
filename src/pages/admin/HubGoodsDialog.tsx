import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { AlertTriangle, Check, CheckCheck, Download, ExternalLink, Loader2, Phone, ScanLine, Warehouse, X } from 'lucide-react'
import { adminHubService, type DeliveryHub, type PreOrderResponse } from '@/services'
import { downloadLabelsPdf, isPackageToken, savedWebUrl, toLabels, traceUrl } from '@/features/campaign/packageLabels'
import { formatKg, readyLabel } from '@/features/campaign/utils'
import { hubStateOf, matchesOrder, type HubState } from '@/features/campaign/hubGoods'
import { globalShowConfirm } from '@/components/common/Popup'
import { getErrorMessage } from '@/utils'

const STATES: { id: HubState; label: string; chip: string }[] = [
  { id: 'unconfirmed', label: 'Chờ xác nhận', chip: 'bg-red-100 text-red-700' },
  { id: 'atHub', label: 'Đã nhận, chờ lấy', chip: 'bg-amber-100 text-amber-800' },
  { id: 'onTheWay', label: 'Chưa tới hub', chip: 'bg-gray-100 text-gray-700' },
  { id: 'delivering', label: 'Đang giao', chip: 'bg-blue-100 text-blue-800' },
  { id: 'delivered', label: 'Đã giao', chip: 'bg-emerald-100 text-emerald-800' },
  { id: 'failed', label: 'Giao thất bại', chip: 'bg-red-100 text-red-700' },
]

const fmtTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : ''

/**
 * Hàng ở một hub. Xe tải giao tới thì đơn "chờ xác nhận": người trực hub quét tem hoặc bấm Đã nhận (thiếu / hư thì báo);
 * chỉ đơn đã xác nhận shipper mới thấy. Cửa sổ cũng cho biết shipper nào đang giữ, đã lấy đơn.
 */
export default function HubGoodsDialog({ hub, onClose }: { hub: DeliveryHub; onClose: () => void }) {
  const qc = useQueryClient()
  const orders = useQuery({ queryKey: ['admin-hubs', 'orders', hub.hubId], queryFn: () => adminHubService.orders(hub.hubId), refetchInterval: 30_000 })
  const [picked, setPicked] = useState<HubState | null>(null)
  const [search, setSearch] = useState('')
  const [zoom, setZoom] = useState<PreOrderResponse | null>(null)
  /** Đơn đang mở ô báo thiếu / hư */
  const [reporting, setReporting] = useState<number | null>(null)
  const [issueCrates, setIssueCrates] = useState(1)
  const [issueNote, setIssueNote] = useState('')
  const [printing, setPrinting] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
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

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-hubs'] })
  const fail = (e: unknown, text: string) => {
    refresh()
    setMessage({ ok: false, text: getErrorMessage(e, text) })
  }
  const receive = useMutation({
    mutationFn: (list: PreOrderResponse[]) => adminHubService.receive(hub.hubId, list.map((o) => o.preOrderId)),
    onSuccess: (_n, list) => {
      refresh()
      setMessage({ ok: true, text: list.length === 1 ? `Đã nhận đơn ${list[0].code} (${list[0].recipientName}).` : `Đã nhận ${list.length} đơn.` })
    },
    onError: (e) => fail(e, 'Không xác nhận được.'),
  })
  const report = useMutation({
    mutationFn: (o: PreOrderResponse) => adminHubService.reportIssue(hub.hubId, o.preOrderId, { crates: issueCrates, note: issueNote.trim() }),
    onSuccess: (_r, o) => {
      setReporting(null)
      refresh()
      setMessage({ ok: true, text: `Đã báo thiếu / hư đơn ${o.code} cho tài xế.` })
    },
    onError: (e) => fail(e, 'Không gửi được báo thiếu / hư.'),
  })

  const all = orders.data ?? []
  const of = (s: HubState) => all.filter((o) => hubStateOf(o) === s)
  const state = picked ?? STATES.find((s) => of(s.id).length > 0)?.id ?? 'unconfirmed'
  // Đang tìm thì tìm trên mọi trạng thái
  const list = search.trim() ? all.filter((o) => matchesOrder(o, search)) : of(state)
  const waiting = of('unconfirmed')
  const clean = waiting.filter((o) => !o.hubIssueNote)
  const kg = (xs: PreOrderResponse[]) => xs.reduce((s, o) => s + Number(o.totalKg ?? 0), 0)

  // Máy quét gõ mã rồi Enter: khớp đúng một đơn đang chờ thì xác nhận đã nhận
  const scan = () => {
    if (!search.trim()) return
    const found = all.filter((o) => matchesOrder(o, search))
    if (found.length !== 1) {
      setMessage({ ok: false, text: found.length === 0 ? 'Không có đơn nào ở hub này khớp mã vừa quét.' : `Có ${found.length} đơn khớp, bấm Đã nhận ở đúng đơn.` })
      return
    }
    const o = found[0]
    const s = hubStateOf(o)
    setSearch('')
    setPicked(s)
    if (s !== 'unconfirmed') {
      setMessage({ ok: false, text: `Đơn ${o.code} đang ở mục "${STATES.find((x) => x.id === s)!.label}".` })
    } else if (o.hubIssueNote) {
      setMessage({ ok: false, text: `Đơn ${o.code} đã báo thiếu / hư. Bấm Đã nhận trên thẻ khi đã bổ sung đủ.` })
    } else {
      receive.mutate([o])
    }
  }
  const receiveAll = async () => {
    const agreed = await globalShowConfirm('Xác nhận đã nhận đủ?', 'Shipper sẽ thấy và nhận được các đơn này.', {
      confirmText: 'Đã nhận đủ',
      details: [
        `${clean.length} đơn · ${clean.reduce((s, o) => s + o.crateQuantity, 0)} thùng · ${formatKg(kg(clean))}`,
        ...(waiting.length > clean.length ? [`${waiting.length - clean.length} đơn đang báo thiếu / hư được giữ lại`] : []),
      ],
    })
    if (agreed) receive.mutate(clean)
  }
  const print = async (xs: PreOrderResponse[], name: string) => {
    setPrinting(true)
    try {
      await downloadLabelsPdf(toLabels(xs.filter((o) => isPackageToken(o.qrCode))), webUrl, name)
    } catch {
      setMessage({ ok: false, text: 'Không tạo được file tem, thử lại.' })
    } finally {
      setPrinting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-900/55 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="hub-goods-title" onClick={(e) => e.stopPropagation()}
        className="flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-[#f6f8f3] shadow-2xl sm:rounded-3xl">
        <header className="flex items-start justify-between gap-3 bg-[#326318] px-5 py-4 text-white">
          <div className="min-w-0">
            <h3 id="hub-goods-title" className="flex items-center gap-2 truncate text-xl font-black"><Warehouse size={20} className="text-[#ffea79]" /> {hub.name}</h3>
            <p className="truncate text-xs text-white/75">{hub.address}</p>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-full bg-white/10 p-2 hover:bg-white/20"><X size={18} /></button>
        </header>

        <div className="flex flex-col gap-3 border-b border-gray-200 bg-white px-5 py-3">
          <div role="tablist" aria-label="Tình trạng hàng" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {STATES.map((s) => (
              <button key={s.id} type="button" role="tab" aria-selected={!search && state === s.id} onClick={() => { setPicked(s.id); setSearch('') }}
                className={`rounded-2xl border-2 px-3 py-2 text-left ${!search && state === s.id ? 'border-[#326318] bg-[#eef6e7]' : 'border-gray-100 bg-gray-50'}`}>
                <span className="block text-[11px] font-bold text-gray-500">{s.label}</span>
                <span className={`block text-lg font-black tabular-nums ${s.id === 'unconfirmed' && of(s.id).length ? 'text-red-600' : 'text-gray-900'}`}>{of(s.id).length}</span>
                <span className="block text-[11px] text-gray-500">{formatKg(kg(of(s.id)))}</span>
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); scan() }} className="flex gap-2">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-gray-300 px-3 focus-within:border-[#326318]">
              <ScanLine size={16} className="shrink-0 text-gray-400" />
              <input autoFocus value={search} onChange={(e) => { setSearch(e.target.value); setMessage(null) }} aria-label="Quét hoặc nhập mã"
                placeholder="Quét QR trên thùng để xác nhận, hoặc tìm theo mã đơn / tên / số điện thoại" className="w-full py-2.5 text-sm outline-none" />
            </label>
            <button type="submit" disabled={receive.isPending} className="rounded-xl bg-[#326318] px-4 text-sm font-bold text-white disabled:opacity-50">Nhận</button>
          </form>
          {message && <p role="status" className={`text-xs font-bold ${message.ok ? 'text-[#326318]' : 'text-red-600'}`}>{message.text}</p>}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {orders.isPending ? (
            <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
          ) : orders.isError ? (
            <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{getErrorMessage(orders.error, 'Không tải được hàng ở hub.')}</p>
          ) : list.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              {all.length === 0 ? 'Hub này chưa có hàng chiến dịch nào.' : 'Không có đơn nào trong mục này.'}
            </p>
          ) : (
            <ul className="grid items-start gap-3 sm:grid-cols-2">
              {list.map((o) => {
                const st = hubStateOf(o)
                const s = STATES.find((x) => x.id === st)!
                return (
                  <li key={o.preOrderId} className={`flex flex-col gap-2 rounded-2xl border-2 bg-white p-3 ${o.hubIssueNote ? 'border-red-300' : 'border-gray-100'}`}>
                    <div className="flex gap-3">
                      {isPackageToken(o.qrCode) ? (
                        <button type="button" onClick={() => setZoom(o)} aria-label={`Phóng to mã QR đơn ${o.code}`} className="h-fit shrink-0 rounded-xl border border-gray-200 p-1.5 hover:border-[#326318]">
                          <QRCodeSVG value={traceUrl(webUrl, o.qrCode)} size={84} level="M" />
                        </button>
                      ) : (
                        <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-center text-[11px] text-gray-500">Chưa đóng gói</span>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col gap-1 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <b className="truncate text-sm text-gray-900">{o.recipientName}</b>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${s.chip}`}>{st === 'onTheWay' && o.status === 'READY' ? readyLabel(o.hubStage, s.label) : s.label}</span>
                        </div>
                        <p className="font-bold text-gray-700">{o.crateQuantity} thùng × {o.crateKg} kg = {formatKg(o.totalKg)}</p>
                        <p className="truncate text-gray-500" title={o.campaignTitle}>{o.code} · {o.campaignTitle}</p>
                        <p className="truncate text-gray-500" title={o.shippingAddress ?? undefined}>{o.shippingAddress}</p>
                        {o.recipientPhone && <a href={`tel:${o.recipientPhone}`} className="inline-flex w-fit items-center gap-1 font-bold text-[#326318]"><Phone size={12} /> {o.recipientPhone}</a>}
                      </div>
                    </div>

                    {st === 'atHub' && (
                      <p className="rounded-lg bg-[#eef6e7] px-2.5 py-1.5 text-xs font-semibold text-[#254d12]">
                        Hub nhận {fmtTime(o.hubReceivedAt)}{o.hubReceivedBy ? ` · ${o.hubReceivedBy}` : ''}
                        {o.shipperName ? <b className="block text-blue-800">Shipper {o.shipperName} đã nhận đơn, chưa tới lấy</b> : <span className="block">Chưa có shipper nhận</span>}
                      </p>
                    )}
                    {st !== 'atHub' && o.shipperName && (
                      <p className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-800">
                        Shipper {o.shipperName}{o.pickedUpAt ? ` lấy hàng lúc ${fmtTime(o.pickedUpAt)}` : ''}
                      </p>
                    )}
                    {o.hubIssueNote && (
                      <p className="flex items-start gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" /> Thiếu / hư {o.hubIssueCrates} thùng: {o.hubIssueNote}
                      </p>
                    )}

                    {st === 'unconfirmed' && (
                      reporting === o.preOrderId ? (
                        <form onSubmit={(e) => { e.preventDefault(); if (issueNote.trim()) report.mutate(o) }} className="flex flex-col gap-2 rounded-xl border border-red-200 p-2.5 text-xs">
                          <label className="flex items-center gap-2 font-bold text-gray-700">
                            Số thùng thiếu / hư
                            <input type="number" min={1} max={o.crateQuantity} value={issueCrates} onChange={(e) => setIssueCrates(Math.min(o.crateQuantity, Math.max(1, Number(e.target.value) || 1)))}
                              className="w-20 rounded-lg border border-gray-300 px-2 py-1" />
                          </label>
                          <input value={issueNote} onChange={(e) => setIssueNote(e.target.value)} maxLength={500} aria-label="Ghi chú thiếu / hư" placeholder="Ghi rõ: thiếu thùng nào, hư ra sao" className="rounded-lg border border-gray-300 px-2 py-1.5" />
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setReporting(null)} className="rounded-lg px-3 py-1.5 font-bold text-gray-600">Thôi</button>
                            <button type="submit" disabled={!issueNote.trim() || report.isPending} className="rounded-lg bg-red-600 px-3 py-1.5 font-bold text-white disabled:opacity-40">Gửi báo</button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => { setReporting(o.preOrderId); setIssueCrates(o.hubIssueCrates ?? 1); setIssueNote(o.hubIssueNote ?? '') }}
                            className="flex-1 rounded-xl border border-red-200 py-2 text-xs font-bold text-red-700 hover:bg-red-50">Báo thiếu / hư</button>
                          <button type="button" disabled={receive.isPending} onClick={() => receive.mutate([o])}
                            className="inline-flex flex-[2] items-center justify-center gap-1.5 rounded-xl bg-[#326318] py-2 text-xs font-black text-white disabled:opacity-50">
                            <Check size={14} /> Đã nhận đủ {o.crateQuantity} thùng
                          </button>
                        </div>
                      )
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-5 py-3">
          <button type="button" disabled={printing || !list.some((o) => isPackageToken(o.qrCode))} onClick={() => void print(list, `Tem_${hub.name}`)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 disabled:opacity-40">
            {printing ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Tải tem QR đang xem
          </button>
          {clean.length > 0 ? (
            <button type="button" disabled={receive.isPending} onClick={() => void receiveAll()} className="inline-flex items-center gap-2 rounded-xl bg-[#326318] px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">
              {receive.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />} Nhận đủ tất cả ({clean.length} đơn)
            </button>
          ) : (
            <p className="text-sm font-black text-gray-900">{waiting.length ? `${waiting.length} đơn đang báo thiếu / hư` : 'Không còn đơn chờ xác nhận'}</p>
          )}
        </footer>
      </div>

      {zoom && isPackageToken(zoom.qrCode) && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/60 p-4" onClick={(e) => { e.stopPropagation(); setZoom(null) }}>
          <div role="dialog" aria-modal="true" aria-label={`Mã QR đơn ${zoom.code}`} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center">
            <QRCodeSVG value={traceUrl(webUrl, zoom.qrCode)} size={260} level="M" />
            <p className="text-base font-black text-gray-900">{zoom.recipientName} · {zoom.crateQuantity} thùng × {zoom.crateKg} kg</p>
            <p className="text-xs text-gray-500">{zoom.code}</p>
            <div className="flex w-full gap-2">
              <a href={traceUrl(webUrl, zoom.qrCode)} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-300 py-2.5 text-sm font-bold text-gray-700">
                <ExternalLink size={14} /> Xem thông tin
              </a>
              <button type="button" disabled={printing} onClick={() => void print([zoom], `Tem_${zoom.code}`)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#326318] py-2.5 text-sm font-bold text-white disabled:opacity-50">
                <Download size={14} /> Tải tem
              </button>
            </div>
            <button type="button" onClick={() => setZoom(null)} className="text-xs font-bold text-gray-500 underline">Đóng</button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}

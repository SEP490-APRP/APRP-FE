import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { AlertTriangle, Download, Loader2, QrCode, X } from 'lucide-react'
import { downloadLabelsPdf, fmtLabelDay, isLocalUrl, savedWebUrl, SHELF_TEXT, toLabels, traceUrl, WEB_URL_KEY } from '@/features/campaign/packageLabels'
import { formatKg } from '@/features/campaign/utils'
import { adminCampaignService, type CampaignResponse } from '@/services'
import { getErrorMessage } from '@/utils'

/** Xem trước và tải PDF tem QR dán thùng; orderId có giá trị thì chỉ in tem của đơn đó */
export default function PackageLabelsDialog({ c, orderId, onClose }: { c: CampaignResponse; orderId?: number; onClose: () => void }) {
  const [webUrl, setWebUrl] = useState(savedWebUrl)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  // Máy chủ cấp mã tem cho đơn chưa có rồi trả danh sách thùng cần dán
  const q = useQuery({
    queryKey: ['admin-campaigns', 'package-labels', c.campaignId],
    queryFn: () => adminCampaignService.packageLabels(c.campaignId),
    gcTime: 0,
  })
  const orders = (q.data ?? []).filter((o) => orderId == null || o.preOrderId === orderId)
  const labels = toLabels(orders)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const download = async () => {
    setBusy(true)
    setFailed(false)
    try {
      try {
        localStorage.setItem(WEB_URL_KEY, webUrl.trim())
      } catch {
        // không lưu được thì thôi
      }
      await downloadLabelsPdf(labels, webUrl, `Tem_${c.code}${orderId != null && orders[0] ? `_${orders[0].code}` : ''}`)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="labels-title" onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h3 id="labels-title" className="flex items-center gap-2 text-lg font-black text-gray-900"><QrCode size={20} className="text-[#326318]" /> Tem QR dán thùng</h3>
            <p className="text-xs text-gray-500">{q.isPending ? 'Đang tải…' : `${labels.length} tem · ${orders.length} đơn`}</p>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100"><X size={18} /></button>
        </header>

        <div className="flex flex-col gap-3 overflow-y-auto bg-gray-50 p-5">
          {q.isError ? (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{getErrorMessage(q.error, 'Chưa tải được danh sách thùng.')}</p>
          ) : q.isPending ? (
            <div className="h-40 animate-pulse rounded-2xl bg-gray-200" />
          ) : labels.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">Chưa có thùng nào đã đóng gói và đang chờ giao.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {labels.map(({ order: o, crate, crates }) => (
                <li key={`${o.preOrderId}-${crate}`} className="flex gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-3">
                  <div className="min-w-0 flex-1 text-xs text-gray-700">
                    <p className="font-black text-[#326318]">CAPNONG</p>
                    <p className="truncate text-base font-black text-gray-900">{o.recipientName || o.buyerName}</p>
                    <p className="text-sm font-bold">Thùng {crate}/{crates} · {formatKg(o.crateKg)}</p>
                    <p className="truncate">{[o.sourceProductName, o.sourceShopName].filter(Boolean).join(' · ') || o.campaignTitle}</p>
                    <p className="font-bold">{(o.shelfLifeTier && SHELF_TEXT[o.shelfLifeTier]?.label) || 'Bảo quản nơi thoáng mát'}</p>
                    <p>Dùng trước {fmtLabelDay(o.deliverBy)}</p>
                  </div>
                  <a href={traceUrl(webUrl, o.qrCode ?? '')} target="_blank" rel="noreferrer" title="Mở trang người quét sẽ thấy" className="shrink-0 self-center">
                    <QRCodeSVG value={traceUrl(webUrl, o.qrCode ?? '')} size={92} level="M" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4">
          <label className="flex flex-col gap-1 text-xs font-bold text-gray-600">
            Địa chỉ web in trên mã QR
            <input value={webUrl} onChange={(e) => setWebUrl(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-normal" />
          </label>
          {isLocalUrl(webUrl) && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" /> Điện thoại không mở được địa chỉ localhost. Đổi sang địa chỉ web đã đưa lên mạng, hoặc địa chỉ IP của máy này khi thử trong cùng Wi-Fi.
            </p>
          )}
          {failed && <p role="alert" className="text-sm font-semibold text-red-600">Chưa tạo được file PDF. Tải lại trang rồi thử lại.</p>}
          <button type="button" disabled={busy || labels.length === 0 || !webUrl.trim()} onClick={download}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#326318] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Tải PDF {labels.length || ''} tem để in
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}

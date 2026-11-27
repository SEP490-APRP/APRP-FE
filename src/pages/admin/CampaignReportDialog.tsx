import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, FileSpreadsheet, FileText, HandCoins, Landmark, Loader2, PackageCheck, ShoppingBag, Sprout, Undo2, Users, Warehouse, X, XCircle } from 'lucide-react'
import { adminHubTripService, type CampaignResponse, type FarmRegistrationResponse, type PreOrderResponse } from '@/services'
import { buildReport, fmtDay, ratingOf, type ReportMetric } from '@/features/campaign/report'
import { downloadReportExcel, downloadReportPdf } from '@/features/campaign/reportExport'
import { formatKg, formatVnd } from '@/features/campaign/utils'
import { ProgressBar } from './CampaignSection'

/**
 * Báo cáo chiến dịch đã hoàn tất: thời gian từ ngày đăng bài kêu gọi tới ngày kết thúc chiến dịch,
 * kết quả đạt được (hàng giải cứu, đơn, người tham gia), tiền sàn nhận, biểu đồ mức độ thành công và xuất PDF / Excel.
 */
export default function CampaignReportDialog({
  c,
  orders,
  regs,
  onClose,
}: {
  c: CampaignResponse
  orders: PreOrderResponse[]
  regs: FarmRegistrationResponse[]
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Chuyến xe ra hub: cước đã trả tài xế là một khoản chi của sàn
  const trips = useQuery({ queryKey: ['admin-campaigns', 'hub-trips', c.campaignId], queryFn: () => adminHubTripService.list(c.campaignId) })

  const [note, setNote] = useState('')
  const [pdfState, setPdfState] = useState<'idle' | 'busy' | 'error'>('idle')
  const r = buildReport(c, orders, regs, trips.data ?? [])
  const { money } = r
  const input = { c, report: r, orders, trips: trips.data ?? [], note }
  const exportPdf = async () => {
    setPdfState('busy')
    try {
      await downloadReportPdf(input)
      setPdfState('idle')
    } catch {
      setPdfState('error')
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="report-title" onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <header className="flex items-start justify-between gap-3 bg-[#326318] px-6 py-4 text-white">
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#ffea79]">Báo cáo chiến dịch · {c.code}</p>
            <h3 id="report-title" className="mt-0.5 text-lg font-black leading-snug">{c.title}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" disabled={trips.isPending || pdfState === 'busy'} onClick={exportPdf} title="Tải bản PDF để đọc, trình ký"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-black text-[#326318] hover:bg-[#ffea79] disabled:opacity-50">
              {pdfState === 'busy' ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />} PDF
            </button>
            <button type="button" disabled={trips.isPending} onClick={() => downloadReportExcel(input)} title="Số liệu chi tiết để đối soát"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-black text-[#326318] hover:bg-[#ffea79] disabled:opacity-50">
              <FileSpreadsheet size={15} /> Excel
            </button>
            <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-full p-2 hover:bg-white/15"><X size={18} /></button>
          </div>
        </header>

        <div className="flex flex-col gap-5 overflow-y-auto p-6">
          {pdfState === 'error' && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">Chưa tạo được file PDF. Tải lại trang rồi thử lại.</p>}
          {/* Thời gian */}
          <section aria-label="Thời gian chiến dịch" className="flex items-center gap-3 rounded-2xl bg-[#f6faf2] p-4">
            <Moment label="Bắt đầu · đăng kêu gọi" value={fmtDay(r.start)} />
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
              {r.days != null && <span className="rounded-full bg-[#ffea79] px-3 py-0.5 text-xs font-black text-[#2b5619]">{r.days} ngày</span>}
              <span className="h-0.5 w-full rounded-full bg-[#b9dba8]" />
            </div>
            <Moment label={r.hasFinishDate ? 'Kết thúc chiến dịch' : 'Kết thúc · ngày hoàn tất'} value={fmtDay(r.end)} right />
          </section>

          {/* Kết quả chính */}
          <section className="flex flex-col gap-2">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-bold text-gray-500"><Sprout size={16} className="text-[#326318]" /> Đã giải cứu</p>
                <p className="text-4xl font-black tabular-nums text-[#326318]">{formatKg(r.rescuedKg)}</p>
              </div>
              <p className="text-right text-sm font-bold text-gray-500">
                <span className="block text-2xl font-black text-gray-900">{r.pctTarget}%</span>
                mục tiêu {formatKg(r.target)}
              </p>
            </div>
            <ProgressBar percent={r.pctTarget} />
            <p className="text-xs text-gray-500">Nhận tại điểm tập kết {formatKg(r.received)} đạt chuẩn</p>
          </section>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Count icon={<PackageCheck size={18} />} value={`${r.delivered.length}/${r.validCount}`} label="Đơn đã giao" />
            <Count icon={<Users size={18} />} value={String(r.buyers)} label="Người mua" />
            <Count icon={<Sprout size={18} />} value={String(r.farms.length)} label="Nhà vườn" />
            <Count icon={<Warehouse size={18} />} value={String(r.hubs)} label="Hub giao hàng" />
          </div>

          {(r.failed.length > 0 || r.cancelled.length > 0) && (
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {r.failed.length > 0 && <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">{r.failed.length} đơn thất bại</span>}
              {r.cancelled.length > 0 && <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">{r.cancelled.length} đơn đã huỷ</span>}
            </div>
          )}

          <section className="grid gap-3 sm:grid-cols-3" aria-label="Tiền">
            <Money icon={<ShoppingBag size={16} />} label="Tiền hàng đã giao" value={formatVnd(r.goodsValue)} />
            <Money icon={<HandCoins size={16} />} label="Đã trả nhà vườn" value={formatVnd(money.farmPay)} />
            <Money icon={<Undo2 size={16} />} label="Hoàn người mua" value={formatVnd(money.refunded)} />
          </section>

          {/* Tiền sàn nhận được sau chiến dịch */}
          <section aria-label="Tiền sàn nhận được" className="shrink-0 overflow-hidden rounded-2xl border border-[#cfe6c4]">
            <div className="flex items-center justify-between gap-3 bg-[#eef6e7] px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-black text-gray-900"><Landmark size={18} className="text-[#326318]" /> Sàn nhận được</p>
              <p className={`text-2xl font-black tabular-nums ${money.platform < 0 ? 'text-red-600' : 'text-[#326318]'}`}>
                {trips.isPending ? '…' : `${money.platform < 0 ? '−' : ''}${formatVnd(Math.abs(money.platform))}`}
              </p>
            </div>
            <dl className="px-4 py-1 text-sm">
              <Line label="Thu từ người mua" value={money.collected} />
              <Line label="Trả nhà vườn" value={-money.farmPay} />
              <Line label="Cước shipper giao hàng" value={-money.shipPay} />
              <Line label="Cước xe chở ra hub" value={-money.tripPay} />
              <Line label="Bồi thường hàng hư" value={-money.damagePay} />
            </dl>
            {trips.isError && <p className="px-4 pb-3 text-xs font-semibold text-red-600">Chưa tải được cước xe ra hub nên số này chưa trừ khoản đó.</p>}
          </section>

          {r.farms.length > 0 && (
            <section>
              <h4 className="text-sm font-black text-gray-900">Nhà vườn tham gia</h4>
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                    <th className="py-1.5 font-bold">Nhà vườn</th>
                    <th className="py-1.5 text-right font-bold">Số kg</th>
                    <th className="py-1.5 text-right font-bold">Đã nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {r.farms.map((f) => (
                    <tr key={f.shopId} className="border-b border-gray-50 last:border-b-0">
                      <td className="py-2 font-bold text-gray-900">{f.name}</td>
                      <td className="py-2 text-right tabular-nums">{formatKg(f.countedKg)}</td>
                      <td className="py-2 text-right font-black tabular-nums text-[#326318]">{formatVnd(f.pay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {r.score != null && <SuccessChart score={r.score} metrics={r.metrics} />}

          <label className="flex flex-col gap-1.5 text-sm font-black text-gray-900">
            Nhận xét, bài học và kiến nghị
            <span className="text-xs font-medium text-gray-500">Đưa vào file xuất, không lưu trên hệ thống</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-normal" />
          </label>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-3 border-b border-gray-100 py-2 last:border-b-0">
      <dt className="text-gray-600">{label}</dt>
      <dd className="font-bold tabular-nums text-gray-900">{value > 0 ? '+' : value < 0 ? '−' : ''}{formatVnd(Math.abs(value))}</dd>
    </div>
  )
}

const TONE = {
  good: { Icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-800' },
  warn: { Icon: AlertTriangle, cls: 'bg-amber-100 text-amber-800' },
  bad: { Icon: XCircle, cls: 'bg-red-100 text-red-700' },
}

/** Biểu đồ cột ngang 0-100% cho từng tiêu chí, kèm điểm chung và xếp loại */
function SuccessChart({ score, metrics }: { score: number; metrics: ReportMetric[] }) {
  const rating = ratingOf(score)
  const { Icon, cls } = TONE[rating.tone]
  const qty = (n: number, unit: ReportMetric['unit']) => (unit === 'kg' ? formatKg(n) : `${n} đơn`)
  return (
    <figure aria-label="Mức độ thành công" className="rounded-2xl border border-gray-100 p-4">
      <figcaption className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-black text-gray-900">Mức độ thành công</h4>
          <p className="text-xs text-gray-500">Điểm là trung bình {metrics.length} tiêu chí</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-4xl font-black text-gray-900">{score}%</span>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${cls}`}>
            <Icon size={14} /> {rating.label}
          </span>
        </div>
      </figcaption>
      <ul className="mt-4 flex flex-col gap-2">
        {metrics.map((m) => (
          <li key={m.label} title={`${m.label}: ${qty(m.done, m.unit)} / ${qty(m.total, m.unit)} (${m.pct}%)`} className="rounded-lg py-1 hover:bg-gray-50">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-bold text-gray-700">{m.label}</span>
              <span className="shrink-0 tabular-nums text-gray-500">
                {qty(m.done, m.unit)} / {qty(m.total, m.unit)} <b className="ml-2 text-gray-900">{m.pct}%</b>
              </span>
            </div>
            <div className="mt-1 h-3 rounded-r bg-[#e4f0dc]">
              <div className="h-full rounded-r bg-[#326318]" style={{ width: `${m.pct}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-gray-400" aria-hidden="true">
        <span>0%</span><span>50%</span><span>100%</span>
      </div>
    </figure>
  )
}

function Moment({ label, value, right }: { label: string; value: string; right?: boolean }) {
  return (
    <div className={`shrink-0 ${right ? 'text-right' : ''}`}>
      <p className="text-xs font-bold text-gray-500">{label}</p>
      <p className="text-lg font-black tabular-nums text-gray-900 sm:text-xl">{value}</p>
    </div>
  )
}

function Count({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-gray-100 py-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef6e7] text-[#326318]">{icon}</span>
      <span className="text-2xl font-black tabular-nums text-gray-900">{value}</span>
      <span className="text-xs font-bold text-gray-500">{label}</span>
    </div>
  )
}

function Money({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-3">
      <p className="flex items-center gap-1.5 text-xs font-bold text-gray-500">{icon} {label}</p>
      <p className="mt-1 text-lg font-black tabular-nums text-gray-900">{value}</p>
    </div>
  )
}

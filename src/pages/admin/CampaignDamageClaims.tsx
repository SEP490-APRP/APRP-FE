import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2, Scale, Wallet, XCircle } from 'lucide-react'
import { adminCampaignService, type DamageClaim } from '@/services'
import { formatVnd } from '@/features/campaign/utils'
import { getErrorMessage } from '@/utils'

const STATUS: Record<DamageClaim['status'], { label: string; cls: string }> = {
  PENDING: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  APPROVED: { label: 'Đã hoàn tiền', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  REJECTED: { label: 'Từ chối', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
}

export const damageClaimsKey = (id: number) => ['admin-campaign', id, 'damage-claims']

/**
 * Báo hàng hư (thay cho hoàn hàng): người mua cân phần hư + chụp ảnh.
 * Admin xem ảnh, chốt số kg chấp nhận; sàn lấy tiền từ ví sàn hoàn vào ví người mua (kg x giá/kg).
 */
export default function CampaignDamageClaims({ campaignId, onNotice }: { campaignId: number; onNotice: (n: { ok: boolean; text: string }) => void }) {
  const claims = useQuery({ queryKey: damageClaimsKey(campaignId), queryFn: () => adminCampaignService.damageClaims(campaignId) })
  const rows = claims.data ?? []
  const pending = rows.filter((c) => c.status === 'PENDING').length
  const paid = rows.filter((c) => c.status === 'APPROVED').reduce((s, c) => s + Number(c.refundAmount ?? 0), 0)

  if (claims.isPending) return <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm">
        <p className="flex-1 text-gray-600">
          Người mua tự cân phần hư và chụp ảnh, không phải gửi trả hàng. Duyệt thì sàn hoàn <b>số kg chấp nhận × giá/kg</b> từ ví sàn vào ví
          người mua; báo hư chỉ nhận trong 24 giờ sau khi giao.
        </p>
        <div className="flex gap-4">
          <p><span className="block text-[11px] font-bold uppercase text-gray-500">Chờ duyệt</span><b className="text-lg text-amber-700">{pending}</b></p>
          <p><span className="block text-[11px] font-bold uppercase text-gray-500">Đã hoàn</span><b className="text-lg text-emerald-700">{formatVnd(paid)}</b></p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">Chưa có báo hàng hư nào.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((c) => <ClaimCard key={c.claimId} c={c} campaignId={campaignId} onNotice={onNotice} />)}
        </div>
      )}
    </div>
  )
}

function ClaimCard({ c, campaignId, onNotice }: { c: DamageClaim; campaignId: number; onNotice: (n: { ok: boolean; text: string }) => void }) {
  const qc = useQueryClient()
  const [kg, setKg] = useState(String(c.claimedKg))
  const [note, setNote] = useState('')
  const [zoom, setZoom] = useState<string | null>(null)
  const kgNum = Number(kg)
  const price = Number(c.pricePerKg ?? 0)
  const kgInvalid = !(kgNum > 0) || kgNum > Number(c.claimedKg)
  const done = (text: string) => {
    onNotice({ ok: true, text })
    qc.invalidateQueries({ queryKey: damageClaimsKey(campaignId) })
    qc.invalidateQueries({ queryKey: ['admin-campaign'] })
  }
  const approve = useMutation({
    mutationFn: () => adminCampaignService.approveDamage(c.claimId, kgNum, note.trim() || undefined),
    onSuccess: (r) => done(`Đã hoàn ${formatVnd(r.refundAmount ?? 0)} cho đơn ${r.preOrderCode}.`),
    onError: (e) => onNotice({ ok: false, text: getErrorMessage(e, 'Duyệt không thành công.') }),
  })
  const reject = useMutation({
    mutationFn: () => adminCampaignService.rejectDamage(c.claimId, note.trim()),
    onSuccess: (r) => done(`Đã từ chối báo hư đơn ${r.preOrderCode}.`),
    onError: (e) => onNotice({ ok: false, text: getErrorMessage(e, 'Từ chối không thành công.') }),
  })
  const busy = approve.isPending || reject.isPending
  const st = STATUS[c.status]

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black text-gray-900">{c.preOrderCode} · {c.buyerName}</p>
          <p className="text-xs text-gray-500">
            {c.buyerPhone} · đơn {c.orderKg} kg × {formatVnd(price)}/kg{c.sourceShopName ? ` · lô của ${c.sourceShopName}` : ''}
          </p>
          <p className="text-xs text-gray-500">
            Giao {c.deliveredAt ? new Date(c.deliveredAt).toLocaleString('vi-VN') : '—'} · báo lúc {new Date(c.createdAt).toLocaleString('vi-VN')}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold ${st.cls}`}>{st.label}</span>
      </header>

      <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <Scale size={18} className="shrink-0" />
        <p>Người mua cân <b>{c.claimedKg} kg</b> hư{c.reason ? ` · ${c.reason}` : ''}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {c.photoUrls.map((u) => (
          <button key={u} type="button" onClick={() => setZoom(u)} className="h-24 w-24 overflow-hidden rounded-xl border border-gray-200">
            <img src={u} alt="Ảnh báo hư" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {c.status === 'PENDING' ? (
        <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
          <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
            <label className="text-xs font-bold text-gray-700">
              Kg chấp nhận
              <input type="number" step="0.1" min={0.1} max={c.claimedKg} value={kg} onChange={(e) => setKg(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-bold text-gray-700">
              Ghi chú (bắt buộc khi từ chối)
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Vd: ảnh cân không rõ số"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            </label>
          </div>
          {kgInvalid && <p className="text-xs font-semibold text-rose-600">Kg chấp nhận phải lớn hơn 0 và không vượt {c.claimedKg} kg người mua khai.</p>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm text-gray-700">
              <Wallet size={15} /> Hoàn từ ví sàn: <b className="text-emerald-700">{formatVnd(kgInvalid ? 0 : Math.round(kgNum * price))}</b>
            </p>
            <div className="flex gap-2">
              <button type="button" disabled={busy || !note.trim()} onClick={() => reject.mutate()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-40">
                {reject.isPending ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Từ chối
              </button>
              <button type="button" disabled={busy || kgInvalid} onClick={() => approve.mutate()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#326318] px-3 py-2 text-sm font-bold text-white hover:bg-[#254d12] disabled:opacity-40">
                {approve.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Duyệt & hoàn tiền
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="border-t border-gray-100 pt-3 text-sm text-gray-700">
          {c.status === 'APPROVED'
            ? <>Chấp nhận <b>{c.approvedKg} kg</b>, đã hoàn <b className="text-emerald-700">{formatVnd(c.refundAmount ?? 0)}</b> vào ví người mua.</>
            : <>Lý do từ chối: {c.adminNote}</>}
          {c.status === 'APPROVED' && c.adminNote ? ` Ghi chú: ${c.adminNote}` : ''}
        </p>
      )}

      {zoom && (
        <button type="button" onClick={() => setZoom(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" aria-label="Đóng ảnh">
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-xl" />
        </button>
      )}
    </article>
  )
}

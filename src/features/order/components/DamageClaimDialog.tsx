import { useRef, useState } from 'react'
import { Camera, Loader2, Scale, X, ShieldCheck, ImagePlus } from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import { campaignService, type PreOrderResponse } from '@/services/campaign.service'
import { uploadService } from '@/services/upload.service'
import { getErrorMessage } from '@/utils'

const vnd = (n?: number | null) => `${Math.round(Number(n ?? 0)).toLocaleString('vi-VN')} đ`
const REASONS = ['Dập nát', 'Héo / úng', 'Thối, có mùi', 'Sai loại hàng']

/**
 * Báo hàng hư cho đơn chiến dịch (thay cho hoàn hàng):
 * người mua đặt phần hư lên cân, chụp ảnh số cân + ảnh hàng, nhập số kg. Admin duyệt và hoàn tiền vào ví.
 */
export function DamageClaimDialog({ p, onClose, onDone }: { p: PreOrderResponse; onClose: () => void; onDone: (msg: string) => void }) {
  const [kg, setKg] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [reasons, setReasons] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const kgNum = Number(kg)
  const maxKg = Number(p.totalKg ?? 0)
  const estimate = kgNum > 0 ? kgNum * Number(p.unitPrice ?? 0) : 0
  const kgError = kg !== '' && !(kgNum > 0) ? 'Nhập số kg lớn hơn 0' : kgNum > maxKg ? `Đơn chỉ có ${maxKg} kg` : null
  const valid = kgNum > 0 && kgNum <= maxKg && photos.length > 0 && !uploading

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setError(null)
    try {
      const urls: string[] = []
      for (const f of Array.from(files).slice(0, 5 - photos.length)) {
        const url = (await uploadService.uploadImage(f, 'campaign-damage')).result?.url
        if (url) urls.push(url)
      }
      setPhotos((prev) => [...prev, ...urls].slice(0, 5))
    } catch (e) {
      setError(getErrorMessage(e, 'Không tải được ảnh, thử lại nhé.'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const submit = async () => {
    if (!valid) return
    setSending(true)
    setError(null)
    try {
      const reason = [reasons.join(', '), note.trim()].filter(Boolean).join(' · ')
      await campaignService.reportDamage(p.preOrderId, { claimedKg: kgNum, photoUrls: photos, reason: reason || undefined })
      onDone(`Đã gửi báo hư ${kgNum} kg. CapNong sẽ xem ảnh và hoàn tiền vào ví của bạn.`)
    } catch (e) {
      setError(getErrorMessage(e, 'Gửi báo hư không thành công.'))
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal title="Báo hàng hư" onClose={onClose}>
      <div className="flex flex-col gap-5 p-5 text-sm">
        <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-900">
          <p className="flex items-center gap-2 font-bold"><ShieldCheck size={16} /> Không cần gửi trả hàng</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed">
            <li>Đặt phần hàng hư lên cân, chụp ảnh thấy rõ <b>số trên cân</b>.</li>
            <li>Chụp thêm ảnh cận cảnh hàng hư và thùng hàng có mã đơn <b>{p.code}</b>.</li>
            <li>CapNong đối chiếu ảnh và hoàn tiền phần hư vào ví của bạn (thường trong 24 giờ).</li>
          </ol>
        </div>

        <label className="flex flex-col gap-1.5 font-bold text-ink">
          <span className="flex items-center gap-1.5"><Scale size={15} /> Số kg hư (theo cân)</span>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min={0.1}
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              placeholder={`Tối đa ${maxKg} kg`}
              className="w-full rounded-xl border border-line bg-neutral-50 px-3 py-2.5 pr-10 font-medium"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">kg</span>
          </div>
          {kgError && <span className="text-xs font-semibold text-rose-600">{kgError}</span>}
        </label>

        <div>
          <p className="flex items-center gap-1.5 font-bold text-ink"><Camera size={15} /> Ảnh cân và ảnh hàng hư ({photos.length}/5)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {photos.map((u) => (
              <div key={u} className="relative h-20 w-20 overflow-hidden rounded-xl border border-line">
                <img src={u} alt="" className="h-full w-full object-cover" />
                <button type="button" aria-label="Bỏ ảnh" onClick={() => setPhotos((x) => x.filter((y) => y !== u))}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"><X size={12} /></button>
              </div>
            ))}
            {photos.length < 5 && (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-neutral-300 text-[11px] font-semibold text-ink-muted hover:border-emerald-500">
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                {uploading ? 'Đang tải' : 'Thêm ảnh'}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          </div>
        </div>

        <div>
          <p className="font-bold text-ink">Tình trạng</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {REASONS.map((r) => {
              const on = reasons.includes(r)
              return (
                <button key={r} type="button" aria-pressed={on} onClick={() => setReasons((x) => (on ? x.filter((y) => y !== r) : [...x, r]))}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${on ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-line text-ink-muted hover:border-neutral-400'}`}>
                  {r}
                </button>
              )
            })}
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300} placeholder="Mô tả thêm (không bắt buộc)"
            className="mt-2 w-full rounded-xl border border-line bg-neutral-50 px-3 py-2 text-sm" />
        </div>

        <div className="flex items-baseline justify-between rounded-2xl bg-neutral-50 px-4 py-3">
          <span className="text-ink-muted">Dự kiến hoàn ({kgNum > 0 ? kgNum : 0} kg × {vnd(p.unitPrice)}/kg)</span>
          <span className="text-lg font-black text-emerald-700">{vnd(estimate)}</span>
        </div>
        {p.damageClaimDeadline && (
          <p className="-mt-3 text-xs text-ink-muted">Hạn báo hư: {new Date(p.damageClaimDeadline).toLocaleString('vi-VN')} (24 giờ sau khi nhận hàng).</p>
        )}

        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p>}

        <button type="button" onClick={submit} disabled={!valid || sending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
          {sending && <Loader2 size={16} className="animate-spin" />} Gửi báo hư
        </button>
      </div>
    </Modal>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Camera, CheckCircle2, Coins, ImagePlus, Phone, X } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils'
import { money } from '@/mocks/catalog'
import {
  MAX_PROOF_IMAGES,
  MIN_FAIL_CALL_ATTEMPTS,
  shipperErrorMessage,
  shipperService,
  type DeliveryFailReason,
} from '@/services/shipper.service'
import { FAIL_REASONS } from '../constants/failReasons'

export type DeliveryResult = 'DELIVERED' | 'FAILED'

interface DeliveryResultModalProps {
  orderId: number
  result: DeliveryResult
  recipientName?: string
  recipientPhone?: string
  /** Tiền mặt cần thu (đơn COD). 0 hoặc bỏ trống = đơn đã thanh toán online */
  codAmount?: number
  paymentMethod?: string
  onClose: () => void
  /** Gọi sau khi BE đã ghi nhận */
  onDone: (result: DeliveryResult) => void
}

/**
 * Xác nhận giao hàng (Bước 3):
 * - Giao thành công: bắt buộc ít nhất 1 ảnh bằng chứng (Proof of Delivery).
 * - Giao thất bại: chọn lý do, ghi số cuộc gọi (tối thiểu 3 nếu không liên lạc được), ảnh bằng chứng.
 */
export function DeliveryResultModal({
  orderId,
  result,
  recipientName,
  recipientPhone,
  codAmount = 0,
  paymentMethod,
  onClose,
  onDone,
}: DeliveryResultModalProps) {
  const failed = result === 'FAILED'
  const isCod = codAmount > 0 || paymentMethod?.toUpperCase() === 'COD'
  const [files, setFiles] = useState<File[]>([])
  const [reason, setReason] = useState<DeliveryFailReason | null>(null)
  const [calls, setCalls] = useState(0)
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState(false)

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews])

  const errors = {
    files: files.length === 0 ? 'Chụp ít nhất 1 ảnh bằng chứng.' : null,
    reason: failed && !reason ? 'Chọn lý do giao thất bại.' : null,
    calls:
      failed && reason === 'KHONG_LIEN_LAC_DUOC' && calls < MIN_FAIL_CALL_ATTEMPTS
        ? `Cần gọi khách tối thiểu ${MIN_FAIL_CALL_ATTEMPTS} cuộc.`
        : null,
    note: failed && reason === 'KHAC' && !note.trim() ? 'Ghi rõ lý do.' : null,
  }
  const valid = !Object.values(errors).some(Boolean)

  const mutation = useMutation({
    mutationFn: async () => {
      const urls = await shipperService.uploadProofImages(files)
      if (urls.length === 0) throw new Error('Không tải được ảnh lên. Vui lòng thử lại.')
      if (failed) {
        return shipperService.failOrder(orderId, {
          reason: reason as DeliveryFailReason,
          note: note.trim() || undefined,
          callAttempts: calls,
          proofImageUrls: urls,
        })
      }
      return shipperService.deliverOrder(orderId, urls)
    },
    onSuccess: () => onDone(result),
  })

  const submit = () => {
    setTouched(true)
    if (valid && !mutation.isPending) mutation.mutate()
  }

  const pickFiles = (list: FileList | null) => {
    if (!list?.length) return
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, MAX_PROOF_IMAGES))
  }

  return (
    <Modal title={failed ? `Báo giao thất bại · Đơn #${orderId}` : `Xác nhận giao hàng · Đơn #${orderId}`} onClose={onClose}>
      <div className="space-y-5">
        {(recipientName || recipientPhone) && (
          <div className="flex items-center justify-between gap-3 rounded-card bg-paper p-3 text-sm">
            <div>
              <p className="font-bold text-ink">{recipientName || 'Người nhận'}</p>
              {recipientPhone && <p className="text-ink-muted">{recipientPhone}</p>}
            </div>
            {recipientPhone && (
              <a
                href={`tel:${recipientPhone.replace(/\s+/g, '')}`}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-bold text-leaf-700 hover:bg-leaf-50"
              >
                <Phone className="size-4" /> Gọi
              </a>
            )}
          </div>
        )}

        {!failed && (
          isCod ? (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                  <Coins className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                      Đơn thu tiền mặt (COD)
                    </span>
                    <span className="text-lg font-black text-amber-900">
                      {money(codAmount)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    Vui lòng thu đủ <strong className="font-bold">{money(codAmount)}</strong> tiền mặt từ khách trước khi bàn giao hàng. Khoản tiền này đã được ký quỹ trong ví của bạn.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-emerald-950 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                  <CheckCircle2 className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                      Đã thanh toán online ({paymentMethod || 'VietQR / Ví'})
                    </span>
                    <span className="rounded-lg bg-emerald-200/80 px-2 py-0.5 text-xs font-black text-emerald-800">
                      0 đ
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-emerald-800 leading-relaxed">
                    Đơn hàng đã được thanh toán 100% online. <span className="text-emerald-950 underline">TUYỆT ĐỐI KHÔNG THU TIỀN MẶT CỦA KHÁCH.</span>
                  </p>
                </div>
              </div>
            </div>
          )
        )}

        {failed && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-ink">Lý do</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {FAIL_REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={cn(
                    'rounded-xl border p-3 text-left text-sm transition-colors',
                    reason === r.value ? 'border-leaf-600 bg-leaf-50 text-leaf-800' : 'border-line bg-white text-ink hover:border-leaf-600',
                  )}
                >
                  <span className="font-bold">{r.label}</span>
                  <span className="mt-1 block text-caption text-ink-muted">{r.hint}</span>
                </button>
              ))}
            </div>
            {touched && errors.reason && <p className="text-caption font-semibold text-sale">{errors.reason}</p>}

            <div className="flex items-center justify-between gap-3 rounded-card border border-line p-3">
              <div>
                <p className="text-sm font-bold text-ink">Số cuộc đã gọi khách</p>
                <p className="text-caption text-ink-muted">
                  {reason === 'KHONG_LIEN_LAC_DUOC' ? `Tối thiểu ${MIN_FAIL_CALL_ATTEMPTS} cuộc` : 'Không bắt buộc'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" onClick={() => setCalls((c) => Math.max(0, c - 1))} aria-label="Bớt 1 cuộc">
                  −
                </Button>
                <span className="w-8 text-center text-lg font-extrabold text-ink">{calls}</span>
                <Button type="button" variant="outline" size="icon" onClick={() => setCalls((c) => Math.min(20, c + 1))} aria-label="Thêm 1 cuộc">
                  +
                </Button>
              </div>
            </div>
            {touched && errors.calls && <p className="text-caption font-semibold text-sale">{errors.calls}</p>}

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={reason === 'KHAC' ? 'Ghi rõ lý do (bắt buộc)' : 'Ghi chú thêm (không bắt buộc)'}
              className="w-full rounded-xl border border-line p-3 text-sm text-ink outline-none focus:ring-2 focus:ring-leaf-600"
            />
            {touched && errors.note && <p className="text-caption font-semibold text-sale">{errors.note}</p>}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-bold text-ink">
            {failed ? 'Ảnh bằng chứng (cửa nhà, lịch sử cuộc gọi...)' : 'Ảnh giao hàng (hàng tại nhà khách, khách nhận hàng)'}
          </p>
          <div className="flex flex-wrap gap-2">
            {previews.map((src, i) => (
              <div key={src} className="relative size-20 overflow-hidden rounded-xl border border-line">
                <img src={src} alt={`Ảnh ${i + 1}`} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 rounded-full bg-ink/70 p-1 text-white"
                  aria-label="Xoá ảnh"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            {files.length < MAX_PROOF_IMAGES && (
              <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-ink-muted hover:border-leaf-600 hover:text-leaf-700">
                <ImagePlus className="size-5" />
                <span className="text-caption">Thêm ảnh</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    pickFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
            )}
          </div>
          <p className="text-caption text-ink-muted">Bắt buộc ít nhất 1 ảnh, tối đa {MAX_PROOF_IMAGES} ảnh.</p>
          {touched && errors.files && <p className="text-caption font-semibold text-sale">{errors.files}</p>}
        </div>

        {mutation.isError && (
          <p className="rounded-xl bg-sale-soft p-3 text-sm font-semibold text-sale">
            {shipperErrorMessage(mutation.error, 'Không thể cập nhật đơn. Vui lòng thử lại.')}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={mutation.isPending}>
            Huỷ
          </Button>
          <Button
            type="button"
            variant={failed ? 'danger' : 'primary'}
            fullWidth
            onClick={submit}
            loading={mutation.isPending}
            leftIcon={failed ? undefined : <Camera className="size-4" />}
          >
            {failed ? 'Báo thất bại' : 'Xác nhận đã giao'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils'
import { getErrorMessage } from '@/utils/errors'
import { MAX_TOPUP_AMOUNT, MIN_TOPUP_AMOUNT, formatVnd } from '@/services/wallet.service'
import { useCreateTopup } from '../hooks/useWalletQueries'

interface TopupDialogProps {
  open: boolean
  onClose: () => void
  /** Số tiền gợi ý (vd. số còn thiếu để ký quỹ đơn COD) */
  suggestedAmount?: number
  /** Trang PayOS quay về sau khi trả tiền. Mặc định: tab ví của shipper */
  returnPath?: string
}

const QUICK_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000]

/** Nạp tiền vào ví qua PayOS (Shipper cần số dư để ký quỹ đơn COD) */
export function TopupDialog({ open, onClose, suggestedAmount, returnPath = '/shipper?tab=wallet' }: TopupDialogProps) {
  const mutation = useCreateTopup()
  const [amountText, setAmountText] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setTouched(false)
    mutation.reset()
    const suggested = suggestedAmount ? Math.max(MIN_TOPUP_AMOUNT, Math.ceil(suggestedAmount / 1000) * 1000) : 0
    setAmountText(suggested ? String(suggested) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, suggestedAmount])

  if (!open) return null

  const amount = Number(amountText.replace(/\D/g, '')) || 0
  const error =
    amount < MIN_TOPUP_AMOUNT
      ? `Tối thiểu ${formatVnd(MIN_TOPUP_AMOUNT)}`
      : amount > MAX_TOPUP_AMOUNT
        ? `Tối đa ${formatVnd(MAX_TOPUP_AMOUNT)}`
        : null

  const submit = async () => {
    setTouched(true)
    if (error) return
    const url = `${window.location.origin}${returnPath}`
    try {
      const topup = await mutation.mutateAsync({ amount, returnUrl: url, cancelUrl: url })
      if (topup.checkoutUrl) window.location.href = topup.checkoutUrl
    } catch {
      // lỗi hiển thị bên dưới
    }
  }

  return (
    <Modal title="Nạp tiền vào ví" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-ink-muted">
          Thanh toán qua PayOS (chuyển khoản / QR). Tiền vào ví ngay khi thanh toán xong. Đơn COD cần số dư khả dụng ít nhất
          bằng số tiền thu của khách.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUICK_AMOUNTS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmountText(String(v))}
              className={cn(
                'h-11 rounded-xl border text-sm font-bold',
                amount === v ? 'border-leaf-600 bg-leaf-50 text-leaf-800' : 'border-line bg-white text-ink hover:border-leaf-600',
              )}
            >
              {formatVnd(v)}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="text-sm font-bold text-ink">Số tiền (đ)</span>
          <input
            inputMode="numeric"
            value={amount ? new Intl.NumberFormat('vi-VN').format(amount) : ''}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="Nhập số tiền"
            className="mt-1 h-11 w-full rounded-xl border border-line px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-leaf-600"
          />
        </label>
        {touched && error && <p className="text-caption font-semibold text-sale">{error}</p>}
        {mutation.isError && (
          <p className="rounded-xl bg-sale-soft p-3 text-sm font-semibold text-sale">
            {getErrorMessage(mutation.error, 'Không tạo được link nạp tiền. Vui lòng thử lại.')}
          </p>
        )}
        <div className="flex gap-3">
          <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={mutation.isPending}>
            Huỷ
          </Button>
          <Button type="button" fullWidth onClick={submit} loading={mutation.isPending}>
            Thanh toán {amount ? formatVnd(amount) : ''}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

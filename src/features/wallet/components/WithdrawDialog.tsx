import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Building2, X, Loader2, CheckCircle2 } from 'lucide-react'
import {
  MIN_WITHDRAW_AMOUNT,
  VN_BANKS,
  formatVnd,
  withdrawErrorMessage,
} from '@/services/wallet.service'
import { useMyWallet, useMyWithdrawals, useRequestWithdraw } from '../hooks/useWalletQueries'

export interface WithdrawBankDefaults {
  bankName?: string | null
  bankAccountNumber?: string | null
  bankAccountHolder?: string | null
}

interface WithdrawDialogProps {
  open: boolean
  onClose: () => void
  /** Thông tin ngân hàng điền sẵn (vd. hồ sơ shop). Không có thì lấy từ lệnh rút gần nhất */
  defaults?: WithdrawBankDefaults
  onSuccess?: (message: string) => void
}

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000]

/** Popup rút tiền dùng chung cho Shop, Shipper và Buyer */
export function WithdrawDialog({ open, onClose, defaults, onSuccess }: WithdrawDialogProps) {
  const walletQuery = useMyWallet(open)
  const historyQuery = useMyWithdrawals(open)
  const mutation = useRequestWithdraw()

  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [holder, setHolder] = useState('')
  const [amountText, setAmountText] = useState('')
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState<number | null>(null)

  const available = Math.max(0, Number(walletQuery.data?.availableBalance ?? walletQuery.data?.balance ?? 0))
  const last = historyQuery.data?.[0]

  // Mở popup: xoá trạng thái cũ
  useEffect(() => {
    if (!open) return
    setServerError(null)
    setDone(null)
    setTouched(false)
    setAmountText('')
    setNote('')
    setBankName('')
    setAccountNumber('')
    setHolder('')
  }, [open])

  // Điền sẵn thông tin ngân hàng (hồ sơ hoặc lệnh rút gần nhất) vào ô còn trống
  const prefillBank = defaults?.bankName || last?.bankName || ''
  const prefillNumber = (defaults?.bankAccountNumber || last?.bankAccountNumber || '').replace(/\s+/g, '')
  const prefillHolder = (defaults?.bankAccountHolder || last?.bankAccountHolder || '').toUpperCase()
  useEffect(() => {
    if (!open || done != null) return
    setBankName((v) => v || prefillBank)
    setAccountNumber((v) => v || prefillNumber)
    setHolder((v) => v || prefillHolder)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefillBank, prefillNumber, prefillHolder])

  const amount = Number(amountText.replace(/\D/g, '') || 0)

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (!bankName.trim()) e.bankName = 'Chọn hoặc nhập tên ngân hàng'
    if (!/^\d{6,20}$/.test(accountNumber)) e.accountNumber = 'Số tài khoản gồm 6–20 chữ số'
    if (holder.trim().length < 2) e.holder = 'Nhập tên chủ tài khoản'
    if (amount < MIN_WITHDRAW_AMOUNT) e.amount = `Tối thiểu ${formatVnd(MIN_WITHDRAW_AMOUNT)}`
    else if (amount > available) e.amount = `Vượt số dư khả dụng (${formatVnd(available)})`
    return e
  }, [bankName, accountNumber, holder, amount, available])

  if (!open) return null

  const canWithdraw = available >= MIN_WITHDRAW_AMOUNT

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    setTouched(true)
    setServerError(null)
    if (Object.keys(errors).length > 0) return
    try {
      await mutation.mutateAsync({
        bankName: bankName.trim(),
        bankAccountNumber: accountNumber,
        bankAccountHolder: holder.trim().toUpperCase(),
        amount,
        note: note.trim() || undefined,
      })
      setDone(amount)
      onSuccess?.(`Đã gửi yêu cầu rút ${formatVnd(amount)}. Admin sẽ chuyển khoản trong 1–2 ngày làm việc.`)
    } catch (err) {
      setServerError(withdrawErrorMessage(err))
    }
  }

  const fieldClass = (bad?: string) =>
    `w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-[#1c2216] outline-none focus:ring-2 focus:ring-[#326318]/30 ${
      touched && bad ? 'border-[#e2554f] bg-[#fff7f6]' : 'border-[#e3e8dd] bg-white'
    }`
  const errText = (k: string) =>
    touched && errors[k] ? <p className="mt-1 text-[11px] font-bold text-[#c5221f]">{errors[k]}</p> : null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-title"
      onClick={(e) => e.target === e.currentTarget && !mutation.isPending && onClose()}
    >
      <div className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#f1f4ed]">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-[#eef5e8] text-[#326318] flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <h2 id="withdraw-title" className="text-lg font-black text-[#1c2216]">
              Rút tiền về ngân hàng
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-full hover:bg-[#f3f6ef] flex items-center justify-center text-[#6e7767] cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {done != null ? (
          <div className="px-6 py-8 text-center space-y-3">
            <CheckCircle2 size={48} className="mx-auto text-[#326318]" />
            <p className="text-base font-black text-[#1c2216]">Đã gửi yêu cầu rút {formatVnd(done)}</p>
            <p className="text-xs text-[#6e7767]">
              Số tiền đã được trừ khỏi số dư khả dụng. Admin sẽ chuyển khoản về {bankName} · {accountNumber} trong 1–2 ngày
              làm việc. Nếu yêu cầu bị từ chối, tiền được hoàn lại vào ví.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-full bg-[#326318] text-white text-xs font-black uppercase cursor-pointer"
            >
              Xong
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-5 space-y-4" noValidate>
            <div className="rounded-2xl bg-gradient-to-br from-[#326318] to-[#1f420e] text-white p-4">
              <div className="text-[11px] opacity-80 font-bold">SỐ DƯ KHẢ DỤNG</div>
              <div className="text-2xl font-black">{walletQuery.isLoading ? '...' : formatVnd(available)}</div>
              <div className="text-[11px] opacity-80">Rút tối thiểu {formatVnd(MIN_WITHDRAW_AMOUNT)} mỗi lần, miễn phí</div>
            </div>

            {!walletQuery.isLoading && !canWithdraw && (
              <div className="rounded-2xl bg-[#fff6e5] text-[#9a6400] text-xs font-bold p-3">
                Số dư chưa đủ {formatVnd(MIN_WITHDRAW_AMOUNT)} để rút. Tiền đang tạm giữ sẽ vào số dư khi đơn hoàn tất.
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-[#4a5443] mb-1" htmlFor="wd-bank">
                Ngân hàng
              </label>
              <input
                id="wd-bank"
                list="wd-bank-list"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Vd: Vietcombank"
                className={fieldClass(errors.bankName)}
                autoComplete="off"
              />
              <datalist id="wd-bank-list">
                {VN_BANKS.map((b) => (
                  <option key={b.code} value={b.name} />
                ))}
              </datalist>
              {errText('bankName')}
            </div>

            <div>
              <label className="block text-xs font-black text-[#4a5443] mb-1" htmlFor="wd-number">
                Số tài khoản
              </label>
              <input
                id="wd-number"
                inputMode="numeric"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 20))}
                placeholder="Nhập số tài khoản"
                className={fieldClass(errors.accountNumber)}
              />
              {errText('accountNumber')}
            </div>

            <div>
              <label className="block text-xs font-black text-[#4a5443] mb-1" htmlFor="wd-holder">
                Tên chủ tài khoản
              </label>
              <input
                id="wd-holder"
                value={holder}
                onChange={(e) => setHolder(e.target.value.toUpperCase())}
                placeholder="NGUYEN VAN A"
                className={fieldClass(errors.holder)}
              />
              {errText('holder')}
            </div>

            <div>
              <label className="block text-xs font-black text-[#4a5443] mb-1" htmlFor="wd-amount">
                Số tiền rút
              </label>
              <div className="relative">
                <input
                  id="wd-amount"
                  inputMode="numeric"
                  value={amount ? amount.toLocaleString('vi-VN') : ''}
                  onChange={(e) => setAmountText(e.target.value)}
                  placeholder={`Tối thiểu ${MIN_WITHDRAW_AMOUNT.toLocaleString('vi-VN')}`}
                  className={`${fieldClass(errors.amount)} pr-10`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#7e8779]">đ</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {QUICK_AMOUNTS.filter((v) => v <= available).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmountText(String(v))}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer ${
                      amount === v ? 'bg-[#326318] text-white border-[#326318]' : 'border-[#e3e8dd] text-[#326318] hover:bg-[#f3f6ef]'
                    }`}
                  >
                    {v.toLocaleString('vi-VN')}
                  </button>
                ))}
                {available >= MIN_WITHDRAW_AMOUNT && (
                  <button
                    type="button"
                    onClick={() => setAmountText(String(Math.floor(available)))}
                    className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-[#e3e8dd] text-[#326318] hover:bg-[#f3f6ef] cursor-pointer"
                  >
                    Rút hết
                  </button>
                )}
              </div>
              {errText('amount')}
            </div>

            <div>
              <label className="block text-xs font-black text-[#4a5443] mb-1" htmlFor="wd-note">
                Ghi chú (không bắt buộc)
              </label>
              <input
                id="wd-note"
                value={note}
                maxLength={255}
                onChange={(e) => setNote(e.target.value)}
                className={fieldClass()}
              />
            </div>

            {serverError && (
              <div className="rounded-2xl bg-[#fdeeed] text-[#c5221f] text-xs font-bold p-3">{serverError}</div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-full border border-[#e3e8dd] text-xs font-black text-[#4a5443] uppercase cursor-pointer"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={mutation.isPending || !canWithdraw}
                className="flex-[2] py-3 rounded-full bg-[#326318] hover:bg-[#254b12] disabled:opacity-50 text-white text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer"
              >
                {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Gửi yêu cầu rút tiền
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

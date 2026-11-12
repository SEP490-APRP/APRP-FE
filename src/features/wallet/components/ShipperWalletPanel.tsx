import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Wallet as WalletIcon, Banknote, TrendingUp, RefreshCw, Clock, ShieldCheck, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatVnd } from '@/services/wallet.service'
import { getErrorMessage } from '@/utils/errors'
import { useConfirmTopup, useMyWallet, useMyWalletTransactions } from '../hooks/useWalletQueries'
import { WalletTransactionList } from './WalletTransactionList'
import { WithdrawDialog } from './WithdrawDialog'
import { MyWithdrawalList } from './MyWithdrawalList'
import { TopupDialog } from './TopupDialog'

/**
 * Ví Shipper: số dư, số dư khả dụng (trừ tiền đang ký quỹ COD), cước tạm giữ, nạp ví PayOS, rút tiền, lịch sử.
 * PayOS quay về /shipper?tab=wallet&orderCode=... thì tự xác nhận lệnh nạp.
 */
export function ShipperWalletPanel() {
  const walletQuery = useMyWallet()
  const txQuery = useMyWalletTransactions(0, 15)
  const confirmTopup = useConfirmTopup()
  const [searchParams, setSearchParams] = useSearchParams()
  const w = walletQuery.data
  const negative = (w?.balance ?? 0) < 0
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [topupOpen, setTopupOpen] = useState(false)
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null)
  const handledCode = useRef<string | null>(null)

  // Quay lại từ PayOS: xác nhận lệnh nạp rồi xoá tham số khỏi URL
  useEffect(() => {
    const orderCode = searchParams.get('orderCode')
    if (!orderCode || handledCode.current === orderCode) return
    handledCode.current = orderCode
    const clear = () => {
      const next = new URLSearchParams(searchParams)
      ;['orderCode', 'code', 'id', 'cancel', 'status'].forEach((k) => next.delete(k))
      setSearchParams(next, { replace: true })
    }
    confirmTopup.mutate(orderCode, {
      onSuccess: (t) =>
        setNotice(
          t.status === 'PAID'
            ? { text: `Đã nạp ${formatVnd(t.amount)} vào ví.` }
            : t.status === 'CANCELLED'
              ? { text: 'Lệnh nạp đã huỷ, ví không thay đổi.', error: true }
              : { text: 'Đang chờ PayOS xác nhận thanh toán. Bấm tải lại sau ít phút.' },
        ),
      onError: (err) => setNotice({ text: getErrorMessage(err, 'Không kiểm tra được lệnh nạp. Vui lòng thử lại.'), error: true }),
      onSettled: clear,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return (
    <div className="space-y-6 rounded-panel border border-line bg-white p-6 shadow-card md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-extrabold text-ink">Ví Shipper</h3>
          <p className="text-caption text-ink-muted">
            Đơn COD cần số dư khả dụng ≥ tiền thu của khách (ký quỹ). Cước giao về ví khi khách xác nhận đã nhận hàng (trừ phí dịch vụ 3%).
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Tải lại"
            onClick={() => {
              void walletQuery.refetch()
              void txQuery.refetch()
            }}
          >
            <RefreshCw className={`size-5 ${walletQuery.isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button type="button" variant="accent" leftIcon={<Plus className="size-4" />} onClick={() => setTopupOpen(true)}>
            Nạp ví
          </Button>
          <Button type="button" variant="secondary" onClick={() => setWithdrawOpen(true)}>
            Rút tiền
          </Button>
        </div>
      </div>

      {notice && (
        <div className={`rounded-xl p-3 text-sm font-semibold ${notice.error ? 'bg-sale-soft text-sale' : 'bg-leaf-50 text-leaf-800'}`}>
          {notice.text}
        </div>
      )}

      {walletQuery.error ? (
        <p className="text-sm font-bold text-sale">{getErrorMessage(walletQuery.error, 'Không tải được ví. Vui lòng thử lại.')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className={`rounded-card p-5 text-white ${negative ? 'bg-sale' : 'bg-leaf-700'}`}>
            <div className="flex items-center justify-between text-caption font-bold opacity-90">
              <span>SỐ DƯ KHẢ DỤNG</span>
              <WalletIcon size={18} />
            </div>
            <div className="mt-3 text-3xl font-extrabold">
              {walletQuery.isLoading ? '...' : formatVnd(w?.availableBalance ?? w?.balance)}
            </div>
            <p className="mt-1 text-caption opacity-90">
              {negative ? 'Âm vì còn tiền COD chưa nộp về sàn' : `Tổng số dư ${formatVnd(w?.balance)}`}
            </p>
          </div>
          <div className="rounded-card border border-sun-500/40 bg-sun-300/30 p-5">
            <div className="flex items-center justify-between text-caption font-bold text-leaf-900">
              <span>ĐANG KÝ QUỸ COD</span>
              <ShieldCheck size={18} />
            </div>
            <div className="mt-3 text-2xl font-extrabold text-leaf-900">{formatVnd(w?.codReserved ?? 0)}</div>
            <p className="mt-1 text-caption text-leaf-900/80">Trả lại khi giao xong hoặc giao thất bại</p>
          </div>
          <div className="rounded-card border border-leaf-200 bg-leaf-50 p-5">
            <div className="flex items-center justify-between text-caption font-bold text-leaf-700">
              <span>CƯỚC ĐANG TẠM GIỮ</span>
              <Clock size={18} />
            </div>
            <div className="mt-3 text-2xl font-extrabold text-leaf-700">{formatVnd(w?.frozenBalance ?? 0)}</div>
            <p className="mt-1 text-caption text-leaf-700/80">Vào số dư khi đơn hoàn tất</p>
          </div>
          <div className="rounded-card border border-line p-5">
            <div className="flex items-center justify-between text-caption font-bold text-ink-muted">
              <span>TỔNG THU NHẬP</span>
              <TrendingUp size={18} />
            </div>
            <div className="mt-3 text-2xl font-extrabold text-ink">{formatVnd(w?.totalRevenueAllTime)}</div>
            {(w?.codCashHolding ?? 0) > 0 && (
              <p className="mt-1 flex items-center gap-1 text-caption font-semibold text-sale">
                <Banknote size={14} /> COD cũ chưa nộp: {formatVnd(w?.codCashHolding)}
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <h4 className="mb-1 text-sm font-extrabold text-ink">Lệnh rút tiền gần đây</h4>
        <MyWithdrawalList />
      </div>

      <div>
        <h4 className="mb-2 text-sm font-extrabold text-ink">Lịch sử biến động ví</h4>
        <WalletTransactionList items={txQuery.data?.content ?? []} isLoading={txQuery.isLoading} emptyText="Chưa có giao dịch nào." />
      </div>

      <WithdrawDialog open={withdrawOpen} onClose={() => setWithdrawOpen(false)} onSuccess={(text) => setNotice({ text })} />
      <TopupDialog open={topupOpen} onClose={() => setTopupOpen(false)} />
    </div>
  )
}

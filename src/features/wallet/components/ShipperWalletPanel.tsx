import { Wallet as WalletIcon, Banknote, TrendingUp, RefreshCw, Clock } from 'lucide-react'
import { formatVnd } from '@/services/wallet.service'
import { useMyWallet, useMyWalletTransactions } from '../hooks/useWalletQueries'
import { WalletTransactionList } from './WalletTransactionList'

/** Ví Shipper: số dư (có thể âm khi đang giữ tiền COD), tiền COD chưa nộp, thu nhập, lịch sử */
export function ShipperWalletPanel() {
  const walletQuery = useMyWallet()
  const txQuery = useMyWalletTransactions(0, 15)
  const w = walletQuery.data
  const negative = (w?.balance ?? 0) < 0

  return (
    <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm p-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-gray-900">Ví Shipper</h3>
          <p className="text-xs text-gray-400 font-semibold">
            Cước giao về ví khi khách xác nhận đã nhận hàng (trừ phí dịch vụ 3%). Đơn COD: tiền mặt đang giữ bị trừ khỏi ví cho tới khi nộp về sàn.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void walletQuery.refetch()
            void txQuery.refetch()
          }}
          className="size-11 rounded-2xl bg-gray-50 text-gray-500 hover:bg-gray-100 flex items-center justify-center"
          title="Tải lại"
        >
          <RefreshCw className={`size-5 ${walletQuery.isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {walletQuery.error ? (
        <p className="text-sm font-bold text-red-600">
          Không tải được ví: {(walletQuery.error as { message?: string }).message || 'Lỗi kết nối'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className={`rounded-3xl p-6 text-white ${negative ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'}`}>
            <div className="flex items-center justify-between text-xs opacity-90">
              <span>SỐ DƯ VÍ</span>
              <WalletIcon size={18} />
            </div>
            <div className="text-3xl font-black mt-3">{walletQuery.isLoading ? '...' : formatVnd(w?.balance)}</div>
            {negative && <p className="text-[11px] opacity-90 mt-1">Âm vì đang giữ tiền COD chưa nộp về sàn</p>}
          </div>
          <div className="rounded-3xl p-6 border border-emerald-100 bg-emerald-50">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>CƯỚC ĐANG TẠM GIỮ</span>
              <Clock size={18} />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-3">{formatVnd(w?.frozenBalance ?? 0)}</div>
            <p className="text-[11px] text-emerald-700/80 mt-1">Nhận vào số dư khi đơn hoàn tất</p>
          </div>
          <div className="rounded-3xl p-6 border border-amber-100 bg-amber-50">
            <div className="flex items-center justify-between text-xs font-bold text-amber-700">
              <span>TIỀN COD CHƯA NỘP</span>
              <Banknote size={18} />
            </div>
            <div className="text-2xl font-black text-amber-700 mt-3">{formatVnd(w?.codCashHolding ?? 0)}</div>
          </div>
          <div className="rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500">
              <span>TỔNG THU NHẬP</span>
              <TrendingUp size={18} />
            </div>
            <div className="text-2xl font-black text-gray-900 mt-3">{formatVnd(w?.totalRevenueAllTime)}</div>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-black text-gray-900 mb-2">Lịch sử biến động ví</h4>
        <WalletTransactionList
          items={txQuery.data?.content ?? []}
          isLoading={txQuery.isLoading}
          emptyText="Chưa có giao dịch nào."
        />
      </div>
    </div>
  )
}

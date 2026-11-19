import { ArrowDownRight, ArrowUpRight, Clock, History } from 'lucide-react'
import {
  formatBackendDate,
  formatVnd,
  WALLET_TX_LABEL,
  type WalletTransactionResponse,
} from '@/services/wallet.service'

interface WalletTransactionListProps {
  items: WalletTransactionResponse[]
  isLoading?: boolean
  emptyText?: string
}

/** Danh sách biến động ví (dùng chung cho Shop, Shipper, Admin) */
export function WalletTransactionList({
  items,
  isLoading,
  emptyText = 'Chưa có giao dịch biến động nào. Doanh thu tiền bán nông sản sẽ tự động được ghi nhận tại đây khi đơn hoàn tất.',
}: WalletTransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-[#f3f6ef] animate-pulse" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-12 px-4 text-center rounded-2xl bg-[#fafbfa] border border-dashed border-[#e3e8dd]">
        <div className="w-12 h-12 rounded-full bg-[#f0f4ec] text-[#6b7b64] flex items-center justify-center mx-auto mb-3">
          <History size={24} />
        </div>
        <h5 className="text-sm font-bold text-[#2d3429]">Chưa có biến động số dư</h5>
        <p className="text-xs text-[#788472] mt-1.5 max-w-sm mx-auto leading-relaxed">
          {emptyText}
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#f1f4ed]">
      {items.map((tx) => {
        const isIn = tx.amount >= 0
        // Giữ chỗ ký quỹ COD hiển thị như tạm giữ: không đổi số dư, chỉ đổi số dư khả dụng
        const isHold = tx.hold === true || tx.reserve === true
        return (
          <div
            key={tx.id}
            className="py-3.5 px-2 rounded-xl flex items-center justify-between gap-3 hover:bg-[#fafbfa] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center ${
                  isHold
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : isIn
                      ? 'bg-[#eaf5e1] text-[#2b5619] border border-[#cbe5bd]'
                      : 'bg-[#fdeeed] text-[#c5221f] border border-[#fac8c6]'
                }`}
              >
                {isHold ? <Clock size={18} /> : isIn ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h5 className="text-xs font-bold text-[#1c2216]">
                    {WALLET_TX_LABEL[tx.type] ?? tx.type}
                  </h5>
                  {tx.orderId && (
                    <span className="text-[10px] font-bold bg-[#eef5e8] text-[#2b5619] px-2 py-0.5 rounded-md">
                      #{tx.orderId}
                    </span>
                  )}
                </div>
                {tx.description && (
                  <p className="text-[11px] text-[#6e7767] truncate mt-0.5" title={tx.description}>
                    {tx.description}
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-[10px] text-[#8e9888] mt-0.5">
                  <Clock size={10} />
                  <span>{formatBackendDate(tx.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div
                className={`text-sm font-black ${
                  isHold ? 'text-amber-600' : isIn ? 'text-[#2b5619]' : 'text-[#c5221f]'
                }`}
              >
                {formatVnd(tx.amount, true)}
              </div>
              <div className="text-[10px] text-[#788472] mt-0.5">
                {tx.reserve
                  ? `Số dư ví: ${formatVnd(tx.balanceAfter)}`
                  : isHold
                    ? `Tạm giữ: ${formatVnd(tx.frozenAfter ?? 0)}`
                    : `Số dư ví: ${formatVnd(tx.balanceAfter)}`}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

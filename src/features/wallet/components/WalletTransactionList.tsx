import { ArrowDownRight, ArrowUpRight, Clock } from 'lucide-react'
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
  emptyText = 'Chưa có giao dịch nào. Tiền sẽ về ví khi khách xác nhận đã nhận hàng.',
}: WalletTransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 rounded-2xl bg-[#f3f6ef] animate-pulse" />
        ))}
      </div>
    )
  }
  if (items.length === 0) {
    return <p className="py-6 text-center text-xs text-[#858f7e]">{emptyText}</p>
  }
  return (
    <div className="divide-y divide-[#f1f4ed]">
      {items.map((tx) => {
        const isIn = tx.amount >= 0
        const isHold = tx.hold === true
        return (
          <div key={tx.id} className="py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 shrink-0 rounded-2xl flex items-center justify-center ${
                  isHold ? 'bg-amber-50 text-amber-600' : isIn ? 'bg-[#eaf5e1] text-[#326318]' : 'bg-[#fdeeed] text-[#c5221f]'
                }`}
              >
                {isHold ? <Clock size={18} /> : isIn ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-[#1c2216] truncate">
                  {WALLET_TX_LABEL[tx.type] ?? tx.type}
                  {tx.orderId ? ` · Đơn #${tx.orderId}` : ''}
                </h5>
                {tx.description && (
                  <p className="text-[11px] text-[#6e7767] truncate" title={tx.description}>
                    {tx.description}
                  </p>
                )}
                <span className="text-[10px] text-[#858f7e]">{formatBackendDate(tx.createdAt)}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div
                className={`text-sm font-black ${
                  isHold ? 'text-amber-600' : isIn ? 'text-[#326318]' : 'text-[#c5221f]'
                }`}
              >
                {formatVnd(tx.amount, true)}
              </div>
              <div className="text-[10px] text-[#858f7e]">
                {isHold ? `Tạm giữ: ${formatVnd(tx.frozenAfter ?? 0)}` : `Số dư: ${formatVnd(tx.balanceAfter)}`}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

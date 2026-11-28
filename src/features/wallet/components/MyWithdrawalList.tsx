import { Building2, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatBackendDate, formatVnd, WITHDRAW_STATUS_LABEL } from '@/services/wallet.service'
import type { WithdrawStatus } from '@/services/wallet.types'
import { useMyWithdrawals } from '../hooks/useWalletQueries'

const STATUS_CONFIG: Record<WithdrawStatus, { className: string; icon: typeof Clock }> = {
  PENDING: {
    className: 'bg-[#fff6e5] text-[#9a6400] border border-[#fde4b8]',
    icon: Clock,
  },
  COMPLETED: {
    className: 'bg-[#e8f5e1] text-[#2b5619] border border-[#cbe5bd]',
    icon: CheckCircle2,
  },
  REJECTED: {
    className: 'bg-[#fdeeed] text-[#c5221f] border border-[#fac8c6]',
    icon: AlertCircle,
  },
}

/** Các lệnh rút tiền gần đây của người đang đăng nhập */
export function MyWithdrawalList({ limit = 5 }: { limit?: number }) {
  const { data, isLoading } = useMyWithdrawals()
  const items = (data ?? []).slice(0, limit)

  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-[#f3f6ef] animate-pulse" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-7 px-4 text-center rounded-2xl bg-[#fafbfa] border border-dashed border-[#e3e8dd]">
        <div className="w-10 h-10 rounded-full bg-[#f0f4ec] text-[#6b7b64] flex items-center justify-center mx-auto mb-2">
          <Building2 size={20} />
        </div>
        <h5 className="text-xs font-bold text-[#2d3429]">Chưa phát sinh lệnh rút</h5>
        <p className="text-[11px] text-[#788472] mt-1 max-w-[240px] mx-auto leading-relaxed">
          Khi tích lũy đủ số dư khả dụng từ 50.000đ, bạn có thể tạo lệnh rút tiền về ngân hàng bất kỳ lúc nào.
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-[#f1f4ed]">
      {items.map((w) => {
        const config = STATUS_CONFIG[w.status] || STATUS_CONFIG.PENDING
        const StatusIcon = config.icon

        return (
          <li
            key={w.id}
            className="flex items-center justify-between gap-3 py-3 px-2 rounded-xl hover:bg-[#fafbfa] transition-colors"
          >
            <div className="min-w-0">
              <div className="text-sm font-black text-[#1c2216]">{formatVnd(w.amount)}</div>
              <div className="text-[11px] text-[#5e6957] font-medium truncate mt-0.5">
                {w.bankName} · {w.bankAccountNumber}
              </div>
              <div className="text-[10px] text-[#8e9888] mt-0.5">
                {formatBackendDate(w.createdAt)}
              </div>
              {w.status === 'REJECTED' && w.adminNote && (
                <div className="text-[11px] font-semibold text-[#c5221f] mt-1 bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                  Lý do: {w.adminNote}
                </div>
              )}
            </div>
            <span
              className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${config.className}`}
            >
              <StatusIcon size={11} />
              {WITHDRAW_STATUS_LABEL[w.status]}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

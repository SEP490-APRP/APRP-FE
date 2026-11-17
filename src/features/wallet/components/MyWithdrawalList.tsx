import { formatBackendDate, formatVnd, WITHDRAW_STATUS_LABEL } from '@/services/wallet.service'
import type { WithdrawStatus } from '@/services/wallet.types'
import { useMyWithdrawals } from '../hooks/useWalletQueries'

const STATUS_CLASS: Record<WithdrawStatus, string> = {
  PENDING: 'bg-[#fff6e5] text-[#9a6400]',
  COMPLETED: 'bg-[#e8f5e1] text-[#326318]',
  REJECTED: 'bg-[#fdeeed] text-[#c5221f]',
}

/** Các lệnh rút tiền gần đây của người đang đăng nhập */
export function MyWithdrawalList({ limit = 5 }: { limit?: number }) {
  const { data, isLoading } = useMyWithdrawals()
  const items = (data ?? []).slice(0, limit)

  if (isLoading) return <p className="text-xs text-[#7e8779]">Đang tải lệnh rút...</p>
  if (items.length === 0) return <p className="text-xs text-[#7e8779]">Chưa có lệnh rút tiền nào.</p>

  return (
    <ul className="divide-y divide-[#f1f4ed]">
      {items.map((w) => (
        <li key={w.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <div className="text-sm font-black text-[#1c2216]">{formatVnd(w.amount)}</div>
            <div className="text-[11px] text-[#7e8779] truncate">
              {w.bankName} · {w.bankAccountNumber} · {formatBackendDate(w.createdAt)}
            </div>
            {w.status === 'REJECTED' && w.adminNote && (
              <div className="text-[11px] text-[#c5221f] truncate">Lý do: {w.adminNote}</div>
            )}
          </div>
          <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black ${STATUS_CLASS[w.status]}`}>
            {WITHDRAW_STATUS_LABEL[w.status]}
          </span>
        </li>
      ))}
    </ul>
  )
}

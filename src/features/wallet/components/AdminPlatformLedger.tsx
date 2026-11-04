import { useState } from 'react'
import { History, Undo2, Percent } from 'lucide-react'
import { formatBackendDate, formatVnd } from '@/services/wallet.service'
import { useMyWallet, usePlatformWalletTransactions, useRefundsDue } from '../hooks/useWalletQueries'
import { WalletTransactionList } from './WalletTransactionList'
import { OrderSettlementCard } from './OrderSettlementCard'

/** Admin: phí dịch vụ đã thu, sổ cái ví sàn, danh sách đơn cần hoàn tiền, tra cứu chia tiền theo đơn */
export function AdminPlatformLedger() {
  const [page, setPage] = useState(0)
  const [lookupInput, setLookupInput] = useState('')
  const [lookupId, setLookupId] = useState<number | null>(null)
  const platform = useMyWallet()
  const txQuery = usePlatformWalletTransactions(page, 10)
  const refunds = useRefundsDue()
  const txPage = txQuery.data

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            <h3 className="text-base font-bold text-gray-900">Sổ cái ví sàn</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            <Percent className="size-3" />
            Phí dịch vụ đã thu: {formatVnd(platform.data?.commissionEarned ?? 0)}
          </div>
        </div>
        <WalletTransactionList
          items={txPage?.content ?? []}
          isLoading={txQuery.isLoading}
          emptyText="Chưa có đơn nào được chia tiền."
        />
        {txPage && txPage.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 disabled:opacity-40"
            >
              Trước
            </button>
            <span className="text-xs text-gray-500">
              {page + 1}/{txPage.totalPages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= txPage.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-gray-900">Tra cứu chia tiền theo đơn</h3>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const id = Number(lookupInput.replace(/\D/g, ''))
              setLookupId(id > 0 ? id : null)
            }}
          >
            <input
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              placeholder="Mã đơn, ví dụ 126"
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary"
            />
            <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold">
              Xem
            </button>
          </form>
          {lookupId && <OrderSettlementCard key={lookupId} orderId={lookupId} viewer="ADMIN" />}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Undo2 className="size-5 text-amber-600" />
            <h3 className="text-base font-bold text-gray-900">Lịch sử đơn đã hoàn tiền cho khách</h3>
            {refunds.data && refunds.data.length > 0 && (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{refunds.data.length} đơn</span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Các đơn hàng có phát sinh hoàn tiền (trả hàng, huỷ đơn). Tiền đã được hoàn trả trực tiếp vào ví người mua.
          </p>
          {refunds.isLoading ? (
            <p className="text-xs text-gray-400">Đang tải...</p>
          ) : (refunds.data ?? []).length === 0 ? (
            <p className="text-xs text-gray-400 py-3 text-center">Chưa có đơn nào phát sinh hoàn tiền.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {(refunds.data ?? []).map((r) => (
                <div key={r.orderId} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">
                      Đơn #{r.orderId} · {r.buyerName || r.buyerEmail || `Buyer #${r.buyerId}`}
                    </p>
                    <p className="text-xs text-gray-500 truncate" title={r.refundReason}>
                      {r.refundReason}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {r.orderStatus} · {r.paymentMethod} · {formatBackendDate(r.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-gray-900">{formatVnd(r.refundAmount)}</span>
                    <span className="block text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">
                      Đã cộng ví
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

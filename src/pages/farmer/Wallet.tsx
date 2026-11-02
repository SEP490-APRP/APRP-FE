import React, { useState } from 'react'
import { Wallet as WalletIcon, Building2, History, TrendingUp, RefreshCw } from 'lucide-react'
import { useMyWallet, useMyWalletTransactions, WalletTransactionList } from '@/features/wallet'
import { useShopProfile } from '@/features/shop'
import { formatVnd } from '@/services/wallet.service'

interface WalletProps {
  onOpenWithdraw: () => void
  onInfo?: (msg: string) => void
}

const PAGE_SIZE = 10

export default function Wallet({ onOpenWithdraw }: WalletProps) {
  const [page, setPage] = useState(0)
  const walletQuery = useMyWallet()
  const txQuery = useMyWalletTransactions(page, PAGE_SIZE)
  const { data: profile } = useShopProfile()

  const wallet = walletQuery.data
  const txPage = txQuery.data
  const bankName = profile?.bankName
  const bankNumber = profile?.bankAccountNumber || profile?.bankAccount
  const bankHolder = profile?.bankAccountHolder || profile?.bankAccountName

  const refresh = () => {
    void walletQuery.refetch()
    void txQuery.refetch()
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f1f4ed]">
        <div>
          <h3 className="text-2xl font-black text-[#1c2216]">Ví Tiền &amp; Quyết Toán Nhà Vườn</h3>
          <p className="text-xs text-[#7e8779]">
            Tiền hàng về ví khi khách bấm "Đã nhận hàng" (hoặc tự động 3 ngày sau khi giao), sau khi trừ voucher shop và phí dịch vụ 10%
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="p-2.5 rounded-full border border-[#e8ece3] text-[#326318] hover:bg-[#f3f6ef] cursor-pointer"
            title="Tải lại"
          >
            <RefreshCw size={16} className={walletQuery.isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            id="tour-wallet-withdraw-btn"
            type="button"
            onClick={onOpenWithdraw}
            className="px-6 py-2.5 rounded-full bg-[#326318] hover:bg-[#254b12] text-white font-black text-xs uppercase tracking-wider shadow-sm cursor-pointer"
          >
            Rút Tiền Về Ngân Hàng
          </button>
        </div>
      </div>

      {walletQuery.error && (
        <div className="rounded-2xl bg-[#fdeeed] text-[#c5221f] text-xs font-bold p-4">
          Không tải được ví: {(walletQuery.error as { message?: string }).message || 'Lỗi kết nối'}
        </div>
      )}

      {/* Wallet Summary Cards */}
      <div id="tour-wallet-cards" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#326318] to-[#1f420e] text-white rounded-3xl p-6 shadow-md space-y-4 md:col-span-1">
          <div className="flex items-center justify-between text-xs opacity-90">
            <span>SỐ DƯ KHẢ DỤNG</span>
            <WalletIcon size={20} />
          </div>
          <div className="text-3xl font-black">
            {walletQuery.isLoading ? '...' : formatVnd(wallet?.balance)}
          </div>
          <div className="text-xs opacity-80">
            Đang tạm giữ: {formatVnd(wallet?.frozenBalance)} (nhận khi đơn hoàn tất)
          </div>
          <div className="text-xs opacity-80">Đã rút: {formatVnd(wallet?.totalWithdrawn)}</div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7c8676]">TỔNG DOANH THU VỀ VÍ</span>
            <TrendingUp size={18} className="text-[#326318]" />
          </div>
          <div className="text-2xl font-black text-[#1c2216]">
            {walletQuery.isLoading ? '...' : formatVnd(wallet?.totalRevenueAllTime)}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm space-y-4">
          <span className="text-xs font-bold text-[#7c8676]">TÀI KHOẢN THỤ HƯỞNG</span>
          <div className="flex items-center gap-3">
            <Building2 size={24} className="text-[#326318] shrink-0" />
            {bankNumber ? (
              <div className="min-w-0">
                <div className="text-sm font-black text-[#1c2216] truncate">{bankName || 'Ngân hàng'}</div>
                <div className="text-xs text-[#6e7767] truncate">
                  STK: {bankNumber}
                  {bankHolder ? ` · ${bankHolder}` : ''}
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#6e7767]">Chưa có tài khoản ngân hàng trong hồ sơ shop</div>
            )}
          </div>
        </div>
      </div>

      {/* Transactions History */}
      <div
        id="tour-wallet-history"
        className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#f1f4ed]">
          <div className="flex items-center gap-2">
            <History size={18} className="text-[#326318]" />
            <h4 className="text-base font-black text-[#1c2216]">Lịch Sử Biến Động Ví</h4>
          </div>
          {txPage && txPage.totalElements > 0 && (
            <span className="text-[11px] text-[#858f7e]">{txPage.totalElements} giao dịch</span>
          )}
        </div>

        <WalletTransactionList items={txPage?.content ?? []} isLoading={txQuery.isLoading} />

        {txPage && txPage.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[#e8ece3] disabled:opacity-40 cursor-pointer"
            >
              Trước
            </button>
            <span className="text-xs text-[#6e7767]">
              {page + 1}/{txPage.totalPages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= txPage.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[#e8ece3] disabled:opacity-40 cursor-pointer"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import {
  Building2,
  History,
  TrendingUp,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { MyWithdrawalList, useMyWallet, useMyWalletTransactions, WalletTransactionList } from '@/features/wallet'
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
    <div className="w-full space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f1f4ed]">
        <div>
          <h3 className="text-2xl font-black text-[#1c2216]">Ví Tiền &amp; Quyết Toán Nhà Vườn</h3>
          <p className="text-xs text-[#6e7767] mt-1 leading-relaxed">
            Doanh thu bán nông sản được tự động quyết toán về ví sau khi hoàn tất đơn hàng, hỗ trợ rút tiền nhanh về mọi ngân hàng.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={refresh}
            className="p-2.5 rounded-full border border-[#e8ece3] text-[#2b5619] hover:bg-[#f3f6ef] cursor-pointer transition-colors"
            title="Tải lại dữ liệu ví"
          >
            <RefreshCw size={16} className={walletQuery.isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            id="tour-wallet-withdraw-btn"
            type="button"
            onClick={onOpenWithdraw}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#2b5619] hover:bg-[#1f3f12] text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer transition-all"
          >
            <ArrowUpRight size={16} />
            <span>Rút Tiền Về Ngân Hàng</span>
          </button>
        </div>
      </div>

      {walletQuery.error && (
        <div className="rounded-2xl bg-[#fdeeed] text-[#c5221f] text-xs font-bold p-4 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>Không tải được dữ liệu ví: {(walletQuery.error as { message?: string }).message || 'Lỗi kết nối máy chủ'}</span>
        </div>
      )}

      {/* Wallet Summary 3 Cards */}
      <div id="tour-wallet-cards" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Số dư khả dụng */}
        <div className="bg-gradient-to-br from-[#234b12] via-[#2d5f17] to-[#15310b] text-white rounded-3xl p-6 shadow-md border border-white/10 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-100/90">SỐ DƯ VÍ KHẢ DỤNG</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 backdrop-blur-md text-emerald-200 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sẵn sàng rút
            </span>
          </div>

          <div>
            <div className="text-3xl lg:text-4xl font-black tracking-tight text-white my-1">
              {walletQuery.isLoading ? '...' : formatVnd(wallet?.balance)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-black/20 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-xs">
            <div>
              <div className="text-[10px] text-emerald-200/80 font-medium">Đang tạm giữ:</div>
              <div className="font-bold text-white mt-0.5 truncate">{formatVnd(wallet?.frozenBalance)}</div>
              <div className="text-[9px] text-emerald-200/60 mt-0.5">Chờ khách nhận hàng</div>
            </div>
            <div className="border-l border-white/10 pl-2">
              <div className="text-[10px] text-emerald-200/80 font-medium">Đã rút thành công:</div>
              <div className="font-bold text-white mt-0.5 truncate">{formatVnd(wallet?.totalWithdrawn)}</div>
              <div className="text-[9px] text-emerald-200/60 mt-0.5">Về tài khoản ngân hàng</div>
            </div>
          </div>
        </div>

        {/* Card 2: Tổng doanh thu về ví */}
        <div className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#626e5a]">TỔNG DOANH THU ĐÃ QUYẾT TOÁN</span>
            <div className="w-9 h-9 rounded-2xl bg-[#eaf5e1] text-[#2b5619] flex items-center justify-center shrink-0">
              <TrendingUp size={18} />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black text-[#1c2216] my-1">
              {walletQuery.isLoading ? '...' : formatVnd(wallet?.totalRevenueAllTime)}
            </div>
          </div>

          <div className="text-[11px] text-[#6e7767] leading-relaxed pt-2 border-t border-[#f1f4ed] flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[#2b5619] shrink-0" />
            <span>Doanh thu ròng thực nhận sau khấu trừ 10% phí vận hành sàn.</span>
          </div>
        </div>

        {/* Card 3: Tài khoản thụ hưởng */}
        <div className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#626e5a]">TÀI KHOẢN NHẬN TIỀN</span>
            <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Building2 size={18} />
            </div>
          </div>

          <div>
            {bankNumber ? (
              <div className="min-w-0">
                <div className="text-base font-black text-[#1c2216] truncate">{bankName || 'Ngân hàng'}</div>
                <div className="text-sm font-extrabold text-[#2b5619] tracking-wider mt-0.5">
                  STK: {bankNumber}
                </div>
                <div className="text-xs text-[#525e4c] font-medium mt-0.5 truncate">
                  Chủ TK: {bankHolder || '—'}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-bold text-[#7e8779]">Chưa cập nhật tài khoản</div>
                <div className="text-xs text-[#9aa495] mt-1">Cập nhật hồ sơ shop để liên kết tài khoản nhận tiền</div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#f1f4ed]">
            {bankNumber ? (
              <div className="text-[11px] text-[#2b5619] font-bold flex items-center gap-1">
                <CheckCircle2 size={13} className="text-[#2b5619]" />
                <span>Đã liên kết với hồ sơ gian hàng</span>
              </div>
            ) : (
              <div className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
                <AlertCircle size={13} />
                <span>Cần cập nhật để rút tiền</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid: Transactions (8 cols) & Withdrawals + Policy (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Transaction Ledger */}
        <div
          id="tour-wallet-history"
          className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#f1f4ed]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#eaf5e1] text-[#2b5619] flex items-center justify-center">
                <History size={17} />
              </div>
              <div>
                <h4 className="text-base font-black text-[#1c2216]">Lịch Sử Biến Động Ví</h4>
                <p className="text-[11px] text-[#788472]">Chi tiết các khoản cộng/trừ và doanh thu theo đơn hàng</p>
              </div>
            </div>
            {txPage && txPage.totalElements > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#f4f7f1] text-[#2b5619]">
                {txPage.totalElements} giao dịch
              </span>
            )}
          </div>

          <WalletTransactionList items={txPage?.content ?? []} isLoading={txQuery.isLoading} />

          {txPage && txPage.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f1f4ed]">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-[#e8ece3] text-[#2b5619] hover:bg-[#f3f6ef] disabled:opacity-40 cursor-pointer transition-colors"
              >
                <ChevronLeft size={14} /> Trước
              </button>
              <span className="text-xs text-[#6e7767] font-medium px-2">
                Trang {page + 1} / {txPage.totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= txPage.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-[#e8ece3] text-[#2b5619] hover:bg-[#f3f6ef] disabled:opacity-40 cursor-pointer transition-colors"
              >
                Sau <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Recent Withdrawals */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Card: Lệnh rút tiền gần đây */}
          <div className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#f1f4ed]">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Building2 size={17} />
              </div>
              <div>
                <h4 className="text-base font-black text-[#1c2216]">Lệnh Rút Tiền</h4>
                <p className="text-[11px] text-[#788472]">5 giao dịch rút tiền gần nhất</p>
              </div>
            </div>
            <MyWithdrawalList limit={5} />
          </div>
        </div>
      </div>
    </div>
  )
}

import { Banknote, Clock, Gift, Link2, RefreshCw, ShoppingBag, TrendingUp, Users, Wallet as WalletIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MyWithdrawalList,
  useMyWallet,
  useMyWalletTransactions,
  WalletTransactionList,
  WithdrawDialog,
} from '@/features/wallet'
import { formatVnd } from '@/services/wallet.service'

const PAGE_SIZE = 10

/** Các bước nhận hoa hồng, theo đặc tả "Social Commerce & Referral Wallet" */
const STEPS = [
  {
    icon: ShoppingBag,
    title: 'Mua và nhận hàng',
    text: 'Sau khi đơn hoàn tất, bạn có thể tạo link giới thiệu cho sản phẩm đã mua.',
  },
  { icon: Link2, title: 'Chia sẻ link', text: 'Gửi link sản phẩm cho bạn bè, người thân qua Zalo, Facebook...' },
  { icon: Users, title: 'Bạn bè mua qua link', text: 'Hoa hồng giới thiệu được cộng ngay vào ví này.' },
] as const

/** Ví giới thiệu của Khách Mua (GET /wallets/me trả ví loại REFERRAL) */
export default function MyWalletPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const walletQuery = useMyWallet()
  const txQuery = useMyWalletTransactions(page, PAGE_SIZE)
  const w = walletQuery.data
  const tx = txQuery.data
  const totalPages = tx?.totalPages ?? 0

  const refresh = () => {
    void walletQuery.refetch()
    void txQuery.refetch()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#1c2216] md:text-3xl">Ví của tôi</h1>
          <p className="mt-1 text-sm text-[#6e7767]">
            Nhận hoa hồng khi bạn bè mua nông sản qua link giới thiệu của bạn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8ece3] bg-white px-3 py-2 text-xs font-bold text-[#326318] hover:bg-[#f3f6ef]"
          >
            <RefreshCw size={14} className={walletQuery.isFetching ? 'animate-spin' : ''} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => setWithdrawOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#326318] px-4 py-2 text-xs font-black text-white hover:bg-[#254b12]"
          >
            <Banknote size={14} />
            Rút tiền
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-2xl bg-[#e8f5e1] p-3 text-xs font-bold text-[#326318]">{notice}</div>
      )}

      {walletQuery.isError ? (
        <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
          Không tải được ví. Vui lòng thử lại sau.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-3 rounded-3xl bg-gradient-to-br from-[#326318] to-[#1f420e] p-6 text-white shadow-md">
            <div className="flex items-center justify-between text-xs opacity-90">
              <span>VÍ GIỚI THIỆU · SỐ DƯ KHẢ DỤNG</span>
              <WalletIcon size={20} />
            </div>
            <div className="text-3xl font-black">{walletQuery.isLoading ? '...' : formatVnd(w?.balance)}</div>
            <div className="text-xs opacity-80">Đã rút: {formatVnd(w?.totalWithdrawn)}</div>
          </div>
          <div className="space-y-3 rounded-3xl border border-[#e8ece3] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#7c8676]">
              <span>TỔNG HOA HỒNG ĐÃ NHẬN</span>
              <TrendingUp size={18} className="text-[#326318]" />
            </div>
            <div className="text-2xl font-black text-[#1c2216]">
              {walletQuery.isLoading ? '...' : formatVnd(w?.totalRevenueAllTime)}
            </div>
          </div>
          <div className="space-y-3 rounded-3xl border border-amber-100 bg-amber-50 p-6">
            <div className="flex items-center justify-between text-xs font-bold text-amber-700">
              <span>ĐANG CHỜ XÁC NHẬN</span>
              <Clock size={18} />
            </div>
            <div className="text-2xl font-black text-amber-700">
              {walletQuery.isLoading ? '...' : formatVnd(w?.frozenBalance)}
            </div>
            <p className="text-[11px] text-amber-700/80">Cộng vào số dư khi đơn của bạn bè hoàn tất</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-4 rounded-3xl border border-[#e8ece3] bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-[#8a4e1d]" />
            <h2 className="text-base font-black text-[#1c2216]">Cách nhận tiền vào ví</h2>
          </div>
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf5e1] text-[#326318]">
                <Icon size={18} />
              </span>
              <div>
                <p className="text-sm font-bold text-[#1c2216]">
                  {i + 1}. {title}
                </p>
                <p className="text-xs text-[#6e7767]">{text}</p>
              </div>
            </div>
          ))}
          <div className="border-t border-[#f1f4ed] pt-3">
            <h3 className="text-sm font-black text-[#1c2216]">Lệnh rút tiền gần đây</h3>
            <MyWithdrawalList limit={3} />
          </div>
          <button
            type="button"
            onClick={() => navigate('/orders?tab=COMPLETED')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#326318] py-2.5 text-sm font-bold text-[#326318] hover:bg-[#f3f6ef]"
          >
            <ShoppingBag size={16} />
            Xem đơn đã hoàn tất
          </button>
        </div>

        <div className="rounded-3xl border border-[#e8ece3] bg-white p-6 shadow-sm lg:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-black text-[#1c2216]">Lịch sử biến động</h2>
            <span className="text-xs text-[#858f7e]">{tx?.totalElements ?? 0} giao dịch</span>
          </div>
          <WalletTransactionList
            items={tx?.content ?? []}
            isLoading={txQuery.isLoading}
            emptyText="Chưa có giao dịch. Hoa hồng giới thiệu sẽ hiện ở đây khi bạn bè mua hàng qua link của bạn."
          />
          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-[#e8ece3] px-3 py-1.5 font-bold disabled:opacity-40"
              >
                Trước
              </button>
              <span className="text-[#6e7767]">
                {page + 1}/{totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-[#e8ece3] px-3 py-1.5 font-bold disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>

      <WithdrawDialog open={withdrawOpen} onClose={() => setWithdrawOpen(false)} onSuccess={setNotice} />
    </div>
  )
}

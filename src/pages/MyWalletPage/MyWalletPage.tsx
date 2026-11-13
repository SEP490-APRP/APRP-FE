import {
  Banknote,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Gift,
  Link2,
  MousePointer,
  PackageCheck,
  RefreshCw,
  Share2,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  Users,
  Wallet as WalletIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MyWithdrawalList,
  useMyWallet,
  useMyWalletTransactions,
  WalletTransactionList,
  WithdrawDialog,
} from '@/features/wallet'
import {
  useMyReferralCommissions,
  useMyReferralLinks,
  useReferralDashboard,
} from '@/features/referral'
import { formatVnd } from '@/services/wallet.service'

const PAGE_SIZE = 10

const formatRate = (rate?: number) => {
  if (rate == null) return '2.0%'
  const pct = rate > 1 ? rate : rate * 100
  return `${pct.toFixed(1)}%`
}

const formatDateText = (dateVal?: unknown) => {
  if (!dateVal) return 'Gần đây'
  if (Array.isArray(dateVal)) {
    const [y, mo, d, h = 0, mi = 0] = dateVal
    const date = new Date(y, mo - 1, d, h, mi)
    return Number.isNaN(date.getTime()) ? 'Gần đây' : date.toLocaleDateString('vi-VN')
  }
  const date = new Date(dateVal as string | number)
  return Number.isNaN(date.getTime()) ? 'Gần đây' : date.toLocaleDateString('vi-VN')
}

/** Các bước nhận hoa hồng, theo đặc tả Social Commerce & Referral Wallet */
const STEPS = [
  {
    icon: ShoppingBag,
    title: 'Chia sẻ nông sản',
    text: 'Sao chép link tiếp thị tại trang chi tiết sản phẩm hoặc gian hàng bạn yêu thích.',
  },
  {
    icon: Link2,
    title: 'Gửi link cho bạn bè',
    text: 'Chia sẻ qua Zalo, Facebook, tin nhắn hoặc quét mã QR.',
  },
  {
    icon: Users,
    title: 'Nhận hoa hồng tự động',
    text: 'Khi bạn bè mua hàng thành công, hoa hồng 2% được tự động ghi nhận và cộng vào ví này.',
  },
] as const

export default function MyWalletPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'affiliate'>('overview')
  const [page, setPage] = useState(0)
  const [linksPage, setLinksPage] = useState(0)
  const [commissionsPage, setCommissionsPage] = useState(0)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Wallet queries
  const walletQuery = useMyWallet()
  const txQuery = useMyWalletTransactions(page, PAGE_SIZE)
  const w = walletQuery.data
  const tx = txQuery.data
  const totalPages = tx?.totalPages ?? 0

  // Referral queries
  const dashboardQuery = useReferralDashboard()
  const linksQuery = useMyReferralLinks({ page: linksPage, size: 6 })
  const commissionsQuery = useMyReferralCommissions({ page: commissionsPage, size: 8 })

  const d = dashboardQuery.data
  const links = linksQuery.data
  const commissions = commissionsQuery.data

  const refresh = () => {
    void walletQuery.refetch()
    void txQuery.refetch()
    void dashboardQuery.refetch()
    void linksQuery.refetch()
    void commissionsQuery.refetch()
  }

  const handleCopyLink = async (code: string, shareUrl: string) => {
    try {
      let finalUrl = shareUrl
      try {
        const parsed = new URL(shareUrl)
        finalUrl = `${window.location.origin}${parsed.pathname}`
      } catch {
        finalUrl = `${window.location.origin}/ref/${code}`
      }
      await navigator.clipboard.writeText(finalUrl)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#1c2216] md:text-3xl">Ví của tôi & Tiếp thị</h1>
          <p className="mt-1 text-sm text-[#6e7767]">
            Quản lý số dư, lịch sử biến động và thu nhập từ chương trình Tiếp thị liên kết CapNong.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8ece3] bg-white px-3 py-2 text-xs font-bold text-[#326318] hover:bg-[#f3f6ef]"
          >
            <RefreshCw
              size={14}
              className={walletQuery.isFetching || dashboardQuery.isFetching ? 'animate-spin' : ''}
            />
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

      {/* Primary Balance Cards */}
      {walletQuery.isError ? (
        <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
          Không tải được ví. Vui lòng thử lại sau.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-3 rounded-3xl bg-gradient-to-br from-[#326318] to-[#1f420e] p-6 text-white shadow-md">
            <div className="flex items-center justify-between text-xs opacity-90">
              <span className="font-bold tracking-wider">SỐ DƯ KHẢ DỤNG</span>
              <WalletIcon size={20} />
            </div>
            <div className="text-3xl font-black">{walletQuery.isLoading ? '...' : formatVnd(w?.balance)}</div>
            <div className="flex items-center justify-between text-xs opacity-80">
              <span>Đã rút: {formatVnd(w?.totalWithdrawn)}</span>
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">Ví Người Mua</span>
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-[#e8ece3] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#7c8676]">
              <span>TỔNG THU NHẬP ĐÃ NHẬN</span>
              <TrendingUp size={18} className="text-[#326318]" />
            </div>
            <div className="text-2xl font-black text-[#1c2216]">
              {walletQuery.isLoading ? '...' : formatVnd(w?.totalRevenueAllTime)}
            </div>
            <p className="text-[11px] text-[#6e7767]">Bao gồm hoa hồng tiếp thị và các khoản hoàn tiền</p>
          </div>

          <div className="space-y-3 rounded-3xl border border-amber-100 bg-amber-50 p-6">
            <div className="flex items-center justify-between text-xs font-bold text-amber-700">
              <span>HOA HỒNG ĐANG CHỜ DUYỆT</span>
              <Clock size={18} />
            </div>
            <div className="text-2xl font-black text-amber-700">
              {dashboardQuery.isLoading ? '...' : formatVnd(d?.pendingCommission ?? 0)}
            </div>
            <p className="text-[11px] text-amber-700/80">
              Tự động cộng vào ví sau khi đơn hàng giao thành công và hết hạn đổi trả
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#e8ece3] text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 transition ${
            activeTab === 'overview'
              ? 'border-[#326318] text-[#326318]'
              : 'border-transparent text-[#6e7767] hover:text-[#1c2216]'
          }`}
        >
          <WalletIcon size={16} />
          Tổng quan ví & Giao dịch
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('affiliate')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 transition ${
            activeTab === 'affiliate'
              ? 'border-[#326318] text-[#326318]'
              : 'border-transparent text-[#6e7767] hover:text-[#1c2216]'
          }`}
        >
          <Sparkles size={16} className="text-[#326318]" />
          Tiếp thị liên kết (Affiliate)
          {d && d.pendingCommission > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] text-white">
              Chờ duyệt
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: OVERVIEW & WALLET TRANSACTIONS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-4 rounded-3xl border border-[#e8ece3] bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-2">
              <Gift size={18} className="text-[#8a4e1d]" />
              <h2 className="text-base font-black text-[#1c2216]">Cách kiếm tiền cùng CapNong</h2>
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
              onClick={() => setActiveTab('affiliate')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#326318] py-2.5 text-sm font-bold text-[#326318] hover:bg-[#f3f6ef]"
            >
              <Share2 size={16} />
              Xem link tiếp thị của tôi
            </button>
          </div>

          <div className="rounded-3xl border border-[#e8ece3] bg-white p-6 shadow-sm lg:col-span-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-black text-[#1c2216]">Lịch sử biến động ví</h2>
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
      )}

      {/* TAB 2: AFFILIATE DASHBOARD & COMMISSIONS */}
      {activeTab === 'affiliate' && (
        <div className="space-y-6">
          {/* Performance Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-3xl border border-[#e8ece3] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7c8676]">
                <MousePointer size={16} className="text-[#326318]" />
                LƯỢT CLICK
              </div>
              <p className="mt-2 text-2xl font-black text-[#1c2216]">{d?.totalClicks ?? 0}</p>
              <p className="mt-1 text-[11px] text-[#6e7767]">Lượt truy cập qua link</p>
            </div>

            <div className="rounded-3xl border border-[#e8ece3] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7c8676]">
                <PackageCheck size={16} className="text-[#326318]" />
                ĐƠN THÀNH CÔNG
              </div>
              <p className="mt-2 text-2xl font-black text-[#1c2216]">{d?.totalOrders ?? 0}</p>
              <p className="mt-1 text-[11px] text-[#6e7767]">Đơn hàng được chốt</p>
            </div>

            <div className="rounded-3xl border border-[#e8ece3] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7c8676]">
                <TrendingUp size={16} className="text-[#326318]" />
                TỔNG HOA HỒNG
              </div>
              <p className="mt-2 text-2xl font-black text-[#326318]">{formatVnd(d?.totalEarned ?? 0)}</p>
              <p className="mt-1 text-[11px] text-[#6e7767]">Đã cộng vào ví</p>
            </div>

            <div className="rounded-3xl border border-[#e8ece3] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7c8676]">
                <Tag size={16} className="text-[#326318]" />
                TỶ LỆ HOA HỒNG
              </div>
              <p className="mt-2 text-2xl font-black text-[#1c2216]">
                {formatRate(d?.defaultCommissionRate)}
              </p>
              <p className="mt-1 text-[11px] text-[#6e7767]">
                Hiệu lực 7 ngày · Không giới hạn đơn
              </p>
            </div>
          </div>

          {/* Section: My Referral Links */}
          <div className="rounded-3xl border border-[#e8ece3] bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-[#1c2216]">Liên kết tiếp thị của tôi</h2>
                <p className="text-xs text-[#6e7767]">
                  Các sản phẩm và gian hàng bạn đã tạo link để chia sẻ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/nong-san-tuoi')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#eaf5e1] px-3 py-1.5 text-xs font-bold text-[#326318] hover:bg-[#d8edd0]"
              >
                <ShoppingBag size={14} />
                Khám phá nông sản để chia sẻ
              </button>
            </div>

            {linksQuery.isLoading ? (
              <div className="py-8 text-center text-sm text-[#6e7767]">Đang tải danh sách liên kết...</div>
            ) : !links?.content || links.content.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#e8ece3] p-8 text-center">
                <Share2 className="mx-auto h-10 w-10 text-[#858f7e]" />
                <p className="mt-2 text-sm font-bold text-[#1c2216]">Bạn chưa tạo liên kết nào</p>
                <p className="mt-1 text-xs text-[#6e7767]">
                  Vào trang chi tiết sản phẩm hoặc gian hàng bất kỳ và bấm nút Chia sẻ để nhận hoa hồng 2%.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {links.content.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#f1f4ed] bg-[#fbfcfb] p-4 transition hover:border-[#326318]"
                  >
                    <div className="flex gap-3">
                      {item.targetImageUrl ? (
                        <img
                          src={item.targetImageUrl}
                          alt={item.targetName}
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#eaf5e1] text-[#326318]">
                          {item.targetType === 'PRODUCT' ? <ShoppingBag size={24} /> : <Store size={24} />}
                        </div>
                      )}
                      <div className="flex-1 overflow-hidden">
                        <span className="rounded bg-[#e8ece3] px-1.5 py-0.5 text-[10px] font-bold text-[#326318]">
                          {item.targetType === 'PRODUCT' ? 'Sản phẩm' : 'Gian hàng'}
                        </span>
                        <h4 className="mt-1 truncate text-sm font-bold text-[#1c2216]">{item.targetName}</h4>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-[#6e7767]">
                          <span>Click: <strong className="text-[#1c2216]">{item.clicksCount}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-[#f1f4ed] pt-2">
                      <span className="font-mono text-xs font-bold text-[#326318]">{item.referralCode}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(item.referralCode, item.shareUrl)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#326318] px-2.5 py-1 text-xs font-bold text-[#326318] hover:bg-[#eaf5e1]"
                      >
                        {copiedCode === item.referralCode ? (
                          <>
                            <Check size={12} className="text-[#326318]" />
                            Đã chép
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            Sao chép link
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Detailed Commission History */}
          <div className="rounded-3xl border border-[#e8ece3] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-[#1c2216]">Lịch sử hoa hồng chi tiết</h2>
                <p className="text-xs text-[#6e7767]">
                  Theo dõi từng dòng đơn hàng đã phát sinh hoa hồng giới thiệu.
                </p>
              </div>
              <span className="text-xs text-[#858f7e]">{commissions?.totalElements ?? 0} bản ghi</span>
            </div>

            {commissionsQuery.isLoading ? (
              <div className="py-8 text-center text-sm text-[#6e7767]">Đang tải lịch sử hoa hồng...</div>
            ) : !commissions?.content || commissions.content.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6e7767]">
                Chưa có hoa hồng phát sinh. Hãy tiếp tục chia sẻ link để kiếm thêm thu nhập!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#f1f4ed] text-[11px] font-bold uppercase tracking-wider text-[#7c8676]">
                      <th className="pb-3">Mã đơn / Thời gian</th>
                      <th className="pb-3">Sản phẩm</th>
                      <th className="pb-3 text-right">Giá tính hoa hồng</th>
                      <th className="pb-3 text-right">Tỷ lệ</th>
                      <th className="pb-3 text-right">Hoa hồng</th>
                      <th className="pb-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f8faf6]">
                    {commissions.content.map((c) => (
                      <tr key={c.id} className="hover:bg-[#fafbfa]">
                        <td className="py-3 font-medium">
                          <div className="font-bold text-[#1c2216]">#{c.orderId}</div>
                          <div className="text-[10px] text-[#858f7e]">
                            {formatDateText(c.createdAt)}
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="line-clamp-1 font-bold text-[#1c2216]">{c.productName}</span>
                        </td>
                        <td className="py-3 text-right font-mono text-[#6e7767]">
                          {formatVnd(c.baseAmount)}
                        </td>
                        <td className="py-3 text-right font-medium text-[#6e7767]">
                          {formatRate(c.commissionRate)}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-[#326318]">
                          +{formatVnd(c.commissionAmount)}
                        </td>
                        <td className="py-3 text-center">
                          {c.status === 'COMPLETED' && (
                            <span className="inline-flex rounded-full bg-[#eaf5e1] px-2 py-0.5 text-[10px] font-bold text-[#326318]">
                              Đã vào ví
                            </span>
                          )}
                          {c.status === 'PENDING' && (
                            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              Chờ quyết toán
                            </span>
                          )}
                          {c.status === 'CANCELLED' && (
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              Đã hủy
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      <WithdrawDialog open={withdrawOpen} onClose={() => setWithdrawOpen(false)} onSuccess={setNotice} />
    </div>
  )
}

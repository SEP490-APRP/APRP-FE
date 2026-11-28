import { useState, useMemo } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  Clock,
  Gift,
  History,
  X,
} from 'lucide-react'
import {
  formatBackendDate,
  formatVnd,
  WALLET_TX_LABEL,
  type WalletTransactionResponse,
} from '@/services/wallet.service'

export type TransactionCategory = 'MAIN' | 'HOLD' | 'COMMISSION'

interface WalletTransactionListProps {
  items: WalletTransactionResponse[]
  isLoading?: boolean
  emptyText?: string
  mainBalance?: number
  frozenBalance?: number
  commissionBalance?: number
  showCommissionTab?: boolean
  showHoldTab?: boolean
}

/** Phân loại giao dịch theo màu và loại ví */
export function getTransactionCategory(tx: WalletTransactionResponse): TransactionCategory {
  const typeStr = tx.type as string
  if (
    typeStr === 'REFERRAL_COMMISSION' ||
    (tx.walletType as string) === 'REFERRAL' ||
    tx.description?.toLowerCase().includes('hoa hồng') ||
    tx.description?.toLowerCase().includes('tiếp thị liên kết')
  ) {
    return 'COMMISSION'
  }
  if (tx.hold === true || tx.reserve === true) {
    return 'HOLD'
  }
  return 'MAIN'
}

/** Tên hiển thị thân thiện khớp mẫu ảnh */
export function getTransactionTitle(tx: WalletTransactionResponse): string {
  const typeStr = tx.type as string
  if (typeStr === 'REFERRAL_COMMISSION' || tx.description?.toLowerCase().includes('hoa hồng')) {
    return 'Hoa hồng tiếp thị liên kết'
  }
  if (tx.type === 'BUYER_REFUND' || tx.type === 'ORDER_WALLET_REFUND') {
    return 'Hoàn tiền đơn hàng'
  }
  if (tx.type === 'TOP_UP') {
    return 'Nạp tiền vào ví'
  }
  if (tx.type === 'ORDER_WALLET_PAYMENT') {
    return 'Thanh toán đơn hàng'
  }
  if (tx.type === 'WITHDRAW_REQUESTED') {
    return 'Rút tiền về ngân hàng'
  }
  if (tx.type === 'WITHDRAW_REFUNDED') {
    return 'Hoàn tiền lệnh rút bị từ chối'
  }
  if (tx.hold || tx.type === 'SHOP_INCOME_HOLD' || tx.type === 'PLATFORM_INCOME_HOLD' || tx.type === 'SHIPPER_INCOME_HOLD') {
    if (tx.amount < 0) {
      return 'Admin điều chỉnh tạm giữ'
    }
    return 'Admin tạm giữ tiền'
  }
  if (tx.type === 'HOLD_RELEASED') {
    return 'Giải ngân tiền tạm giữ'
  }
  if (tx.type === 'SHOP_INCOME' || tx.type === 'SHIPPER_INCOME') {
    return 'Tiền được cộng vào ví'
  }
  if (tx.type === 'SHOP_RETURN_SHIPPING_DEDUCT') {
    return 'Thanh toán cước ship hoàn'
  }
  if (tx.type === 'COD_RESERVED') {
    return 'Ký quỹ nhận đơn COD'
  }
  if (tx.type === 'COD_RESERVE_RELEASED') {
    return 'Hoàn trả ký quỹ đơn COD'
  }
  if (tx.amount >= 0) {
    return 'Tiền được cộng vào ví'
  }
  return WALLET_TX_LABEL[tx.type] ?? 'Giao dịch ví'
}

export function WalletTransactionList({
  items,
  isLoading,
  emptyText = 'Chưa có giao dịch biến động nào.',
  showCommissionTab = false,
  showHoldTab = false,
}: WalletTransactionListProps) {
  const [selectedTx, setSelectedTx] = useState<WalletTransactionResponse | null>(null)
  const [filterCategory, setFilterCategory] = useState<'ALL' | TransactionCategory>('ALL')

  // Đếm số lượng theo từng loại ví
  const { mainCount, holdCount, commissionCount } = useMemo(() => {
    let main = 0
    let hold = 0
    let commission = 0
    for (const item of items) {
      const cat = getTransactionCategory(item)
      if (cat === 'HOLD') hold++
      else if (cat === 'COMMISSION') commission++
      else main++
    }
    return { mainCount: main, holdCount: hold, commissionCount: commission }
  }, [items])

  // Lọc theo tab được chọn
  const filteredItems = useMemo(() => {
    if (filterCategory === 'ALL') return items
    return items.filter((tx) => getTransactionCategory(tx) === filterCategory)
  }, [items, filterCategory])

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
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
    <div className="space-y-3">
      {/* BỘ LỌC PHÂN LOẠI THEO MÀU (PILLS) */}
      <div className="flex flex-wrap items-center gap-2 pb-2.5 border-b border-gray-100">
        {/* Tất cả */}
        <button
          type="button"
          onClick={() => setFilterCategory('ALL')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
            filterCategory === 'ALL'
              ? 'bg-[#e6f4ea] text-[#137333] border border-emerald-300 shadow-2xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
          }`}
        >
          Tất cả ({items.length})
        </button>

        {/* Ví chính (Xanh lá) */}
        <button
          type="button"
          onClick={() => setFilterCategory('MAIN')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
            filterCategory === 'MAIN'
              ? 'bg-[#e6f4ea] text-[#137333] border border-emerald-300 shadow-2xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
          }`}
        >
          Ví chính ({mainCount})
        </button>

        {/* Ví tạm giữ (Màu Cam / Hổ phách) */}
        {(showHoldTab || holdCount > 0) && (
          <button
            type="button"
            onClick={() => setFilterCategory('HOLD')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterCategory === 'HOLD'
                ? 'bg-[#fef3e6] text-[#b06000] border border-amber-300 shadow-2xs'
                : 'bg-[#fef3e6]/60 text-[#b06000] hover:bg-[#fef3e6] border border-transparent'
            }`}
          >
            Ví tạm giữ ({holdCount})
          </button>
        )}

        {/* Ví hoa hồng (Màu Xanh dương) */}
        {(showCommissionTab || commissionCount > 0) && (
          <button
            type="button"
            onClick={() => setFilterCategory('COMMISSION')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterCategory === 'COMMISSION'
                ? 'bg-[#e8f0fe] text-[#1a73e8] border border-blue-300 shadow-2xs'
                : 'bg-[#e8f0fe]/60 text-[#1a73e8] hover:bg-[#e8f0fe] border border-transparent'
            }`}
          >
            Ví hoa hồng ({commissionCount})
          </button>
        )}
      </div>

      {/* DANH SÁCH GIAO DỊCH */}
      {filteredItems.length === 0 ? (
        <div className="py-10 px-4 text-center rounded-2xl bg-[#fafbfa] border border-dashed border-[#e3e8dd]">
          <div className="w-10 h-10 rounded-full bg-[#f0f4ec] text-[#6b7b64] flex items-center justify-center mx-auto mb-2">
            <History size={20} />
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Không có giao dịch nào trong danh mục này.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredItems.map((tx) => {
            const cat = getTransactionCategory(tx)
            const isIn = tx.amount >= 0
            const isHold = cat === 'HOLD'
            const title = getTransactionTitle(tx)
            const dateStr = formatBackendDate(tx.createdAt)

            // Số dư sau của ví bị tác động
            const balanceAfter = isHold ? tx.frozenAfter ?? 0 : tx.balanceAfter

            return (
              <div key={tx.id} className="transition-colors">
                <div
                  onClick={() => setSelectedTx(tx)}
                  className="flex items-center justify-between py-3.5 hover:bg-gray-50/80 transition-colors cursor-pointer rounded-xl px-2 -mx-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Icon Circle phân biệt màu */}
                    <div
                      className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-2xs ${
                        cat === 'HOLD'
                          ? 'bg-[#fef3e6] text-[#b06000]'
                          : cat === 'COMMISSION'
                            ? 'bg-[#e8f0fe] text-[#1a73e8]'
                            : 'bg-[#e6f4ea] text-[#137333]'
                      }`}
                    >
                      {cat === 'HOLD' ? (
                        <Clock size={18} />
                      ) : cat === 'COMMISSION' ? (
                        <Gift size={18} />
                      ) : isIn ? (
                        <ArrowDownLeft size={18} />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                    </div>

                    {/* Tiêu đề, thông tin phụ & Tag phân loại */}
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{title}</p>
                      <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 truncate">
                        {tx.orderId ? `Đơn hàng #${tx.orderId} · ` : ''}
                        {dateStr}
                      </p>

                      {/* Tag pill dưới tiêu đề */}
                      <div className="mt-1">
                        {cat === 'HOLD' ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fef3e6] text-[#b06000]">
                            Ví tạm giữ
                          </span>
                        ) : cat === 'COMMISSION' ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f0fe] text-[#1a73e8]">
                            Ví hoa hồng
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f4ea] text-[#137333]">
                            Ví chính
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cột số tiền & icon mở modal */}
                  <div className="flex items-center gap-2 pl-3 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-bold whitespace-nowrap ${
                          cat === 'HOLD'
                            ? 'text-[#b06000]'
                            : cat === 'COMMISSION'
                              ? 'text-[#1a73e8]'
                              : isIn
                                ? 'text-[#137333]'
                                : 'text-gray-900'
                        }`}
                      >
                        {formatVnd(tx.amount, true)}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {cat === 'HOLD'
                          ? `Tạm giữ: ${formatVnd(balanceAfter)}`
                          : `Số dư: ${formatVnd(balanceAfter)}`}
                      </div>
                    </div>

                    <ChevronDown
                      size={16}
                      className="text-gray-400"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL CHI TIẾT GIAO DỊCH (CHUẨN 100% THEO MẪU ẢNH) */}
      {selectedTx && (() => {
        const selCat = getTransactionCategory(selectedTx)
        const selIsIn = selectedTx.amount >= 0
        const selIsHold = selCat === 'HOLD'
        const selIsCommission = selCat === 'COMMISSION'
        const selTitle = getTransactionTitle(selectedTx)
        const selBalanceAfter = selIsHold ? selectedTx.frozenAfter ?? 0 : selectedTx.balanceAfter
        const selBalanceBefore = selBalanceAfter - selectedTx.amount
        const selDateStr = formatBackendDate(selectedTx.createdAt)

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
            onClick={() => setSelectedTx(null)}
          >
            <div
              className="bg-white rounded-3xl w-full max-w-sm sm:max-w-md shadow-2xl relative overflow-hidden border border-gray-100 p-6 space-y-5 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header: Chi tiết giao dịch + Badge Thành công + Nút X */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Chi tiết giao dịch</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e6f4ea] text-[#137333]">
                    Thành công
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedTx(null)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Khối Hero Amount */}
              <div className="text-center py-2">
                <p className="text-xs text-gray-400 font-medium">Số tiền giao dịch</p>
                <div
                  className={`text-3xl sm:text-4xl font-extrabold my-1.5 ${
                    selIsHold
                      ? 'text-[#b06000]'
                      : selIsCommission
                        ? 'text-[#1a73e8]'
                        : selIsIn
                          ? 'text-[#137333]'
                          : 'text-gray-900'
                  }`}
                >
                  {formatVnd(selectedTx.amount, true)}
                </div>
                <p className="text-sm sm:text-base font-bold text-gray-900">{selTitle}</p>
                <div className="mt-2">
                  {selCat === 'HOLD' ? (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#fef3e6] text-[#b06000]">
                      Ví tạm giữ
                    </span>
                  ) : selCat === 'COMMISSION' ? (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#e8f0fe] text-[#1a73e8]">
                      Ví hoa hồng
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#e6f4ea] text-[#137333]">
                      Ví chính
                    </span>
                  )}
                </div>
              </div>

              {/* Thông tin giao dịch */}
              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                <h4 className="text-sm font-bold text-gray-900">Thông tin giao dịch</h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-gray-400 shrink-0">Nội dung</span>
                    <span className="text-gray-900 font-medium text-right break-words max-w-[240px]">
                      {selectedTx.description || selTitle}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">Mã giao dịch</span>
                    <span className="text-gray-900 font-bold">#{selectedTx.id}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">Đơn hàng</span>
                    <span className="text-gray-900 font-bold">
                      {selectedTx.orderId ? `#${selectedTx.orderId}` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">Thời gian</span>
                    <span className="text-gray-900 font-medium">{selDateStr}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">Loại giao dịch</span>
                    <span className="text-gray-900 font-bold">
                      {selIsHold ? 'Tạm giữ' : selIsIn ? 'Cộng tiền' : 'Trừ tiền'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Biến động số dư */}
              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                <h4 className="text-sm font-bold text-gray-900">Biến động số dư</h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">
                      {selIsHold ? 'Tạm giữ trước' : 'Số dư trước'}
                    </span>
                    <span className="text-gray-900 font-bold">{formatVnd(selBalanceBefore)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">Thay đổi</span>
                    <span
                      className={`font-bold ${
                        selIsHold
                          ? 'text-[#b06000]'
                          : selIsCommission
                            ? 'text-[#1a73e8]'
                            : selIsIn
                              ? 'text-[#137333]'
                              : 'text-gray-900'
                      }`}
                    >
                      {formatVnd(selectedTx.amount, true)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <span className="text-gray-900 font-bold text-sm">
                      {selIsHold ? 'Tạm giữ sau' : 'Số dư sau'}
                    </span>
                    <span className="text-gray-900 font-extrabold text-base">
                      {formatVnd(selBalanceAfter)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Giải thích */}
              <div className="pt-3 border-t border-gray-100 space-y-1.5">
                <h4 className="text-sm font-bold text-gray-900">Giải thích</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {selCat === 'HOLD'
                    ? 'Khoản tiền được tạm giữ để bảo đảm đơn hàng (trong 24 giờ sau khi giao hàng thành công). Sau thời hạn này hoặc khi đơn hoàn tất, tiền sẽ tự động chuyển sang ví số dư chính để bạn rút về tài khoản ngân hàng.'
                    : selCat === 'COMMISSION'
                      ? 'Khoản hoa hồng tiếp thị liên kết được ghi nhận vào ví hoa hồng khi người mua hoàn tất đơn hàng.'
                      : 'Khoản tiền được ghi nhận vào ví chính sau khi giao dịch hoàn thành.'}
                </p>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

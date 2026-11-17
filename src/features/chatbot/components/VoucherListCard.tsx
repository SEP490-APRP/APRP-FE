import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Ticket,
  Copy,
  Check,
  Sparkles,
  CheckCircle2,
  BookmarkPlus,
  Loader2,
  Truck,
  Store,
  Eye,
  ArrowRight,
} from 'lucide-react'
import type { VoucherItemDto } from '@/services/chatbot.types'
import type { ApiError } from '@/types'
import { voucherService } from '@/services/voucher.service'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUiStore } from '@/stores/useUiStore'
import { getErrorMessage } from '@/utils'
import { useChatbotStore } from '../stores/useChatbotStore'

/** Mã lỗi BE khi lưu voucher (ErrorCode 90xx). */
const VOUCHER_INVALID = 9003
const VOUCHER_OUT_OF_STOCK = 9004
const VOUCHER_LIMIT_REACHED = 9005

interface VoucherListCardProps {
  vouchers: VoucherItemDto[]
}

export const VoucherListCard: React.FC<VoucherListCardProps> = ({ vouchers }) => {
  const navigate = useNavigate()
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)

  const [claimedMap, setClaimedMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    vouchers.forEach((v) => {
      if (v.isCollected) {
        initial[v.code] = true
      }
    })
    return initial
  })

  const [loadingCode, setLoadingCode] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const token = useAuthStore((s) => s.token)
  const showToast = useUiStore((s) => s.showToast)

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    showToast(`Đã sao chép mã ${code}`)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleViewDetail = (voucher: VoucherItemDto) => {
    toggleOpen()
    if (voucher.shopId) {
      navigate(`/cua-hang/${voucher.shopId}/voucher`)
      return
    }

    const isFreeship =
      voucher.voucherType === 'FREE_SHIPPING' ||
      voucher.code.toUpperCase().includes('SHIP') ||
      voucher.code.toUpperCase().includes('FREESHIP')

    if (isFreeship) {
      navigate('/my-vouchers?tab=SHIPPING')
    } else {
      navigate('/my-vouchers?tab=PLATFORM')
    }
  }

  const handleCollect = async (voucher: VoucherItemDto) => {
    if (!token) {
      showToast('Vui lòng đăng nhập để lưu voucher vào ví cá nhân nhé!', 'warning')
      return
    }

    setLoadingCode(voucher.code)
    try {
      if (voucher.voucherId && voucher.voucherId > 0) {
        await voucherService.collectVoucher(voucher.voucherId)
      } else {
        await voucherService.collectByCode(voucher.code)
      }
      setClaimedMap((prev) => ({ ...prev, [voucher.code]: true }))
      showToast(`✓ Đã lưu voucher [${voucher.code}] vào kho voucher của bạn!`, 'success')
    } catch (err) {
      const code = (err as ApiError).data?.code
      if (code === VOUCHER_LIMIT_REACHED) {
        setClaimedMap((prev) => ({ ...prev, [voucher.code]: true }))
        showToast(`Bạn đã có voucher [${voucher.code}] trong ví rồi!`, 'info')
      } else if (code === VOUCHER_OUT_OF_STOCK) {
        showToast(`Voucher [${voucher.code}] đã hết lượt lưu.`, 'error')
      } else if (code === VOUCHER_INVALID) {
        showToast(`Voucher [${voucher.code}] đã hết hạn hoặc tạm ngừng.`, 'error')
      } else {
        showToast(getErrorMessage(err, 'Không thể lưu mã lúc này, bạn vui lòng thử lại sau nhé!'), 'error')
      }
    } finally {
      setLoadingCode(null)
    }
  }

  const formatPrice = (val?: number) => {
    if (!val) return '0\u00A0đ'
    return new Intl.NumberFormat('vi-VN').format(val) + '\u00A0đ'
  }

  if (!vouchers || vouchers.length === 0) {
    return (
      <div className="mt-2 text-xs text-soil-500 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
        Hiện tại chưa có mã ưu đãi phù hợp. Bạn hãy quay lại sau nhé!
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-[#254b12]">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#ffba41] animate-pulse" />
          <span>Voucher & Ưu đãi khả dụng:</span>
        </div>
        <button
          type="button"
          onClick={() => {
            toggleOpen()
            navigate('/my-vouchers')
          }}
          className="text-[11px] text-[#2f5c1b] hover:text-[#1e3b0e] hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
          title="Mở Kho Voucher"
        >
          <span>Kho voucher</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1 no-scrollbar">
        {vouchers.map((v) => {
          const isClaimed = !!claimedMap[v.code]
          const isOutOfStock = !!v.isOutOfStock && !isClaimed
          const isFreeship =
            v.voucherType === 'FREE_SHIPPING' ||
            v.code.toUpperCase().includes('SHIP') ||
            v.code.toUpperCase().includes('FREESHIP')
          const isShopOwned = v.voucherScope === 'SHOP' || (!!v.shopId && !!v.shopName)

          // ── 1. ĐÃ LƯU (ĐÃ TRONG VÍ) ──────────────────────────
          if (isClaimed) {
            return (
              <div
                key={v.code}
                className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-50/70 via-white to-slate-50/60 border border-emerald-200/90 shadow-2xs transition-all"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                        {v.code}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        ✓ Đã trong ví
                      </span>
                      {isShopOwned && (
                        <button
                          type="button"
                          onClick={() => {
                            toggleOpen()
                            if (v.shopId) navigate(`/cua-hang/${v.shopId}/voucher`)
                          }}
                          className="text-[10px] text-soil-500 hover:text-emerald-800 flex items-center gap-0.5 truncate max-w-[120px] hover:underline cursor-pointer"
                          title="Xem trang voucher của shop"
                        >
                          <Store className="w-2.5 h-2.5 text-soil-400" />
                          {v.shopName}
                        </button>
                      )}
                    </div>
                    <h5 className="text-xs font-semibold text-soil-800 mt-1 truncate">
                      {v.title}
                    </h5>
                    <div className="flex items-center gap-2 text-[10px] text-soil-500 mt-0.5">
                      {v.minOrderValue && v.minOrderValue > 0 ? (
                        <span>Đơn từ {formatPrice(v.minOrderValue)}</span>
                      ) : (
                        <span>Mọi đơn hàng</span>
                      )}
                      <span>•</span>
                      <span>HSD: {v.expiryDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-center gap-1.5 flex-shrink-0 ml-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold opacity-90 cursor-default"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã lưu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(v.code)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-soil-500 hover:text-soil-700 active:scale-95 transition-all cursor-pointer"
                      title="Sao chép mã"
                    >
                      {copiedCode === v.code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleViewDetail(v)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/70 hover:bg-emerald-200/90 text-emerald-900 border border-emerald-200 text-[11px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    title="Xem chi tiết voucher"
                  >
                    <Eye className="w-3 h-3 text-emerald-700" />
                    <span>Xem chi tiết</span>
                  </button>
                </div>
              </div>
            )
          }

          // ── 2. HẾT LƯỢT LƯU ───────────────────────────────────
          if (isOutOfStock) {
            return (
              <div
                key={v.code}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 opacity-75 shadow-2xs"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="p-2 rounded-lg bg-slate-200 text-slate-500 flex-shrink-0">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                        {v.code}
                      </span>
                      <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-semibold">
                        Hết lượt lưu
                      </span>
                    </div>
                    <h5 className="text-xs font-medium text-slate-600 mt-1 truncate">
                      {v.title}
                    </h5>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-center gap-1.5 flex-shrink-0 ml-2">
                  <button
                    type="button"
                    disabled
                    className="px-2.5 py-1.5 rounded-lg bg-slate-200 text-slate-500 text-xs font-semibold cursor-not-allowed"
                  >
                    Hết mã
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewDetail(v)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-semibold active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    title="Xem chi tiết voucher"
                  >
                    <Eye className="w-3 h-3 text-slate-500" />
                    <span>Xem chi tiết</span>
                  </button>
                </div>
              </div>
            )
          }

          // ── 3. CHƯA LƯU (CÓ THỂ LƯU MÃ TRỰC TIẾP) ───────────────
          const borderStyle = isFreeship
            ? 'border-sky-300 hover:border-sky-500 bg-gradient-to-r from-sky-50/70 via-white to-cyan-50/30'
            : isShopOwned
            ? 'border-amber-300 hover:border-amber-500 bg-gradient-to-r from-amber-50/70 via-white to-orange-50/30'
            : 'border-[#cfe6c4] hover:border-[#326318] bg-gradient-to-r from-emerald-50/50 via-white to-lime-50/30'

          const iconStyle = isFreeship
            ? 'bg-sky-500 text-white'
            : isShopOwned
            ? 'bg-amber-500 text-white'
            : 'bg-[#2f5c1b] text-white'

          const scopeBadge = isFreeship ? (
            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 flex items-center gap-0.5">
              <Truck className="w-2.5 h-2.5 text-sky-600" />
              Freeship
            </span>
          ) : isShopOwned ? (
            <button
              type="button"
              onClick={() => {
                toggleOpen()
                if (v.shopId) navigate(`/cua-hang/${v.shopId}/voucher`)
              }}
              className="text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5 truncate max-w-[130px] transition-colors cursor-pointer"
              title="Xem trang voucher của shop"
            >
              <Store className="w-2.5 h-2.5 text-amber-600" />
              {v.shopName}
            </button>
          ) : (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              🌿 Toàn sàn
            </span>
          )

          const isLoadingThis = loadingCode === v.code

          return (
            <div
              key={v.code}
              className={`flex items-center justify-between p-2.5 rounded-xl border shadow-2xs hover:shadow-xs transition-all ${borderStyle}`}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div className={`p-2 rounded-lg flex-shrink-0 shadow-2xs ${iconStyle}`}>
                  {isFreeship ? <Truck className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-soil-900 bg-white/90 px-1.5 py-0.5 rounded border border-slate-300 shadow-2xs">
                      {v.code}
                    </span>
                    {scopeBadge}
                  </div>
                  <h5 className="text-xs font-bold text-soil-900 mt-1 truncate">
                    {v.title}
                  </h5>
                  <div className="flex items-center gap-2 text-[10px] text-soil-600 mt-0.5">
                    {v.minOrderValue && v.minOrderValue > 0 ? (
                      <span>Đơn tối thiểu: {formatPrice(v.minOrderValue)}</span>
                    ) : (
                      <span>Áp dụng mọi đơn</span>
                    )}
                    <span>•</span>
                    <span className="text-soil-400">HSD: {v.expiryDate}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col items-end justify-center gap-1.5 flex-shrink-0 ml-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isLoadingThis}
                    onClick={() => handleCollect(v)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2f5c1b] hover:bg-[#254b12] text-white text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                    title="Lưu voucher vào ví"
                  >
                    {isLoadingThis ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5 text-[#ffba41]" />
                        <span>Lưu mã</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(v.code)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-soil-600 hover:text-soil-900 active:scale-95 transition-all cursor-pointer shadow-2xs"
                    title="Sao chép mã"
                  >
                    {copiedCode === v.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleViewDetail(v)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/95 hover:bg-emerald-50 text-[#2f5c1b] border border-emerald-300 hover:border-emerald-500 text-[11px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  title="Xem chi tiết voucher trên trang"
                >
                  <Eye className="w-3 h-3 text-[#2f5c1b]" />
                  <span>Xem chi tiết</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Nút điều hướng nhanh đến Kho Voucher */}
      <button
        type="button"
        onClick={() => {
          toggleOpen()
          navigate('/my-vouchers')
        }}
        className="w-full mt-2 py-2 px-3 rounded-xl bg-white hover:bg-emerald-50/80 border border-emerald-200 active:scale-[0.98] text-[#2f5c1b] text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
      >
        <Ticket className="w-3.5 h-3.5 text-[#ffba41]" />
        <span>Xem tất cả tại Kho Voucher Của Tôi</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#2f5c1b]" />
      </button>
    </div>
  )
}

export default VoucherListCard

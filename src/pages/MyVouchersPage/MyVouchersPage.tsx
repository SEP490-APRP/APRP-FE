import React, { useState, useEffect } from 'react'
import {
  Ticket,
  Truck,
  Store,
  Clock,
  ArrowRight,
  Search,
  Sparkles,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMyVouchers } from '@/features/voucher'
import { voucherService, type VoucherResponse } from '@/services'
import { globalShowAlert } from '@/components/common/Popup'
import { useAuth } from '@/stores'
import { getErrorMessage } from '@/utils'

type TabType = 'ALL' | 'SHIPPING' | 'PLATFORM' | 'SHOP'

const formatMoney = (value?: number) => `${Number(value ?? 0).toLocaleString('vi-VN')}đ`

const formatDate = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN')
}

const MyVouchersPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { data: myVouchers = [], isLoading, refetch } = useMyVouchers(isAuthenticated)
  const [publicVouchers, setPublicVouchers] = useState<VoucherResponse[]>([])
  const [savingCode, setSavingCode] = useState<string | null>(null)

  const loadPublicVouchers = async () => {
    try {
      const list = await voucherService.getPublicVouchers()
      setPublicVouchers(list || [])
    } catch (e) {
      console.error('Lỗi tải voucher công khai:', e)
    }
  }

  useEffect(() => {
    loadPublicVouchers()
  }, [])

  // Gộp voucher trong ví cá nhân và voucher toàn sàn công khai (loại bỏ hoàn toàn các voucher đã dùng hết lượt)
  const vouchers = React.useMemo(() => {
    const map = new Map<string, VoucherResponse>()
    // 1. Thêm voucher công khai sàn (CHỈ thêm những voucher user CHƯA dùng hết lượt: !v.isUsed)
    ;(publicVouchers || []).forEach((v) => {
      if (v?.voucherCode && !v.isUsed) {
        map.set(v.voucherCode.toUpperCase(), { ...v, isCollected: Boolean(v.isCollected) })
      }
    })
    // 2. Đè bằng voucher còn hiệu lực trong ví cá nhân
    ;(myVouchers || []).forEach((v) => {
      if (v?.voucherCode && !v.isUsed) {
        map.set(v.voucherCode.toUpperCase(), { ...v, isCollected: true })
      }
    })
    return Array.from(map.values())
  }, [publicVouchers, myVouchers])

  const [activeTab, setActiveTab] = useState<TabType>('ALL')
  const [inputCode, setInputCode] = useState('')
  const [submittingCode, setSubmittingCode] = useState(false)

  const handleCollectQuick = async (code: string) => {
    if (!isAuthenticated) {
      globalShowAlert('Vui lòng đăng nhập để lưu mã voucher vào kho.', 'Yêu cầu đăng nhập', 'warning')
      navigate('/login')
      return
    }
    try {
      setSavingCode(code)
      await voucherService.collectByCode(code)
      globalShowAlert(`Đã lưu thành công mã "${code}" vào Kho voucher!`, 'Thành công', 'success')
      await Promise.all([refetch(), loadPublicVouchers()])
    } catch (err) {
      globalShowAlert(getErrorMessage(err, 'Không thể lưu mã voucher này.'), 'Lỗi', 'error')
    } finally {
      setSavingCode(null)
    }
  }

  const handleSaveCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = inputCode.trim().toUpperCase()
    if (!code) {
      globalShowAlert('Vui lòng nhập mã voucher cần lưu.', 'Thông báo', 'warning')
      return
    }

    if (!isAuthenticated) {
      globalShowAlert('Vui lòng đăng nhập để lưu mã voucher vào kho.', 'Yêu cầu đăng nhập', 'warning')
      navigate('/login')
      return
    }

    try {
      setSubmittingCode(true)
      await voucherService.collectByCode(code)
      globalShowAlert(`Đã lưu thành công mã "${code}" vào Kho voucher của bạn!`, 'Thành công', 'success')
      setInputCode('')
      await refetch()
    } catch (err) {
      globalShowAlert(
        getErrorMessage(err, 'Mã voucher không hợp lệ, đã hết lượt hoặc đã hết hạn.'),
        'Không thể lưu mã',
        'error',
      )
    } finally {
      setSubmittingCode(false)
    }
  }

  // Lọc theo tabs
  const filteredVouchers = vouchers.filter((v) => {
    const isShipping = v.voucherTarget === 'SHIPPING'
    const isPlatform = v.voucherScope === 'PLATFORM' || v.creatorRole === 'ADMIN'
    const isShop = v.voucherScope === 'SHOP' || (Boolean(v.shopId) && !isPlatform)

    if (activeTab === 'SHIPPING') return isShipping
    if (activeTab === 'PLATFORM') return isPlatform && !isShipping
    if (activeTab === 'SHOP') return isShop && !isShipping
    return true
  })

  const countShipping = vouchers.filter((v) => v.voucherTarget === 'SHIPPING').length
  const countPlatform = vouchers.filter(
    (v) => (v.voucherScope === 'PLATFORM' || v.creatorRole === 'ADMIN') && v.voucherTarget !== 'SHIPPING',
  ).length
  const countShop = vouchers.filter(
    (v) =>
      (v.voucherScope === 'SHOP' || (Boolean(v.shopId) && v.creatorRole !== 'ADMIN')) &&
      v.voucherTarget !== 'SHIPPING',
  ).length

  return (
    <div className="min-h-screen bg-[#fcfbfa] py-8 pb-24 text-gray-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb / Tiêu đề chính */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              <span>Tài khoản</span>
              <span>/</span>
              <span className="text-emerald-700">Ví ưu đãi</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 font-display flex items-center gap-3">
              <span className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl shadow-sm">
                <Ticket className="size-7" />
              </span>
              Kho Voucher Của Tôi
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Quản lý tất cả mã giảm giá Toàn Sàn và mã Cửa Hàng mà bạn đang sở hữu.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/orders')}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 bg-white shadow-sm"
            >
              <ShoppingBag className="size-4 text-emerald-600" />
              Đơn hàng của tôi
            </button>
          </div>
        </div>

        {/* Thanh nhập mã voucher (Cả sàn và shop) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="max-w-lg">
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                Nhập mã Voucher nhận thêm ưu đãi
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Nhập mã ưu đãi từ Sàn hoặc mã do Shop gửi tặng riêng để lưu vào kho trước khi mua hàng.
              </p>
            </div>

            <form onSubmit={handleSaveCode} className="w-full md:w-auto flex-1 flex gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã voucher (VD: CAPNONG10K, SHOP...)"
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-bold uppercase rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 placeholder:normal-case placeholder:font-normal"
                />
              </div>
              <button
                type="submit"
                disabled={submittingCode || !inputCode.trim()}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-sm whitespace-nowrap transition-all shadow-sm flex items-center gap-2"
              >
                {submittingCode && <Loader2 className="size-4 animate-spin" />}
                Lưu vào kho
              </button>
            </form>
          </div>
        </div>

        {/* Bộ lọc Tabs chuẩn Shopee */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'ALL'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Tất cả
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'ALL' ? 'bg-emerald-700 text-emerald-100' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {vouchers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SHIPPING')}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'SHIPPING'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Truck className="size-4 text-sky-500" />
            Freeship / Vận chuyển
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'SHIPPING' ? 'bg-emerald-700 text-emerald-100' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {countShipping}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PLATFORM')}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'PLATFORM'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Sparkles className="size-4 text-emerald-500" />
            Voucher Toàn Sàn
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'PLATFORM' ? 'bg-emerald-700 text-emerald-100' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {countPlatform}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SHOP')}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'SHOP'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Store className="size-4 text-amber-500" />
            Voucher Của Shop
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'SHOP' ? 'bg-emerald-700 text-emerald-100' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {countShop}
            </span>
          </button>
        </div>

        {/* Danh sách voucher */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-10 animate-spin text-emerald-700" />
            <p className="text-sm font-bold text-gray-500">Đang tải kho voucher của bạn...</p>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm max-w-lg mx-auto">
            <div className="size-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Ticket className="size-10" />
            </div>
            <h3 className="text-lg font-black text-gray-800">Kho voucher đang trống</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
              {activeTab === 'ALL'
                ? 'Bạn chưa lưu voucher nào. Hãy thu thập voucher trên trang gian hàng hoặc nhập mã ưu đãi phía trên.'
                : 'Không có mã nào phù hợp với bộ lọc này.'}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/nong-san-tuoi')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm transition-all"
              >
                Khám phá nông sản tươi
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVouchers.map((voucher) => {
              const isShipping = voucher.voucherTarget === 'SHIPPING'
              const isShop =
                voucher.voucherScope === 'SHOP' ||
                (Boolean(voucher.shopId) && voucher.creatorRole !== 'ADMIN' && !isShipping)

              const discountLabel =
                voucher.voucherType === 'PERCENTAGE'
                  ? `Giảm ${voucher.discountValue}%`
                  : voucher.voucherType === 'FIXED_AMOUNT'
                    ? `Giảm ${formatMoney(Number(voucher.discountValue))}`
                    : 'Miễn phí vận chuyển'

              return (
                <div
                  key={voucher.voucherId || voucher.voucherCode}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex relative"
                >
                  {/* Left coupon stub */}
                  <div
                    className={`w-28 flex flex-col items-center justify-center p-3 text-center border-r border-dashed border-gray-200 shrink-0 ${
                      isShipping
                        ? 'bg-sky-50 text-sky-800'
                        : isShop
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    {isShipping ? (
                      <Truck className="size-8 mb-1.5 text-sky-600" />
                    ) : isShop ? (
                      <Store className="size-8 mb-1.5 text-amber-600" />
                    ) : (
                      <Ticket className="size-8 mb-1.5 text-emerald-600" />
                    )}
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      {isShipping ? 'Freeship' : isShop ? 'Shop' : 'Toàn Sàn'}
                    </span>
                  </div>

                  {/* Right coupon content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              isShipping
                                ? 'bg-sky-100 text-sky-800'
                                : isShop
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isShipping
                              ? 'Vận Chuyển'
                              : isShop
                                ? `Gian Hàng #${voucher.shopId}`
                                : 'Toàn Sàn CapNong'}
                          </span>
                          <span className="text-xs font-black text-gray-900 tracking-wide">
                            {voucher.voucherCode}
                          </span>
                        </div>

                        {voucher.isCollected ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-emerald-600" /> Đã lưu
                          </span>
                        ) : !voucher.isCollected && voucher.claimLimit != null && (voucher.claimedCount || 0) >= voucher.claimLimit ? (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                            Đã hết lượt lưu
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            {isShop ? 'Ưu đãi Shop' : 'Ưu đãi Sàn'}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-black text-gray-900 leading-tight">
                        {discountLabel}
                      </h3>

                      <p className="text-xs font-medium text-gray-500 mt-1">
                        {voucher.minOrderValue && Number(voucher.minOrderValue) > 0
                          ? `Đơn tối thiểu ${formatMoney(Number(voucher.minOrderValue))}`
                          : 'Cho mọi giá trị đơn hàng'}
                        {voucher.maxDiscount && Number(voucher.maxDiscount) > 0 && (
                          <span> · Tối đa {formatMoney(Number(voucher.maxDiscount))}</span>
                        )}
                        {!voucher.isCollected && voucher.claimLimit && (
                          <span className="block text-[11px] text-amber-800 font-semibold mt-0.5">
                            Đã thu thập: {voucher.claimedCount || 0} / {voucher.claimLimit} lượt
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                        <Clock className="size-3 text-gray-400" />
                        <span>HSD: {formatDate(voucher.expiryDate)}</span>
                      </div>

                      {voucher.isCollected ? (
                        <button
                          onClick={() => {
                            if (isShop && voucher.shopId) {
                              navigate(`/cua-hang/${voucher.shopId}`)
                            } else {
                              navigate('/nong-san-tuoi')
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <span>Dùng ngay</span>
                          <ArrowRight className="size-3" />
                        </button>
                      ) : !voucher.isCollected && voucher.claimLimit != null && (voucher.claimedCount || 0) >= voucher.claimLimit ? (
                        <button
                          disabled
                          className="px-3.5 py-1.5 rounded-xl bg-gray-200 text-gray-400 text-xs font-black cursor-not-allowed"
                        >
                          <span>Đã hết lượt</span>
                        </button>
                      ) : (
                        <button
                          disabled={savingCode === voucher.voucherCode}
                          onClick={() => handleCollectQuick(voucher.voucherCode)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-sm flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {savingCode === voucher.voucherCode && <Loader2 className="size-3 animate-spin" />}
                          <span>Lưu vào ví</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Giải thích hướng dẫn */}
        <div className="mt-12 bg-white rounded-2xl p-6 border border-gray-200">
          <h4 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-3">
            <HelpCircle className="size-4 text-emerald-600" />
            Quy định sử dụng voucher tại CapNong
          </h4>
          <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside">
            <li>
              <strong>Mã voucher của Shop:</strong> Chỉ áp dụng được khi bạn mua hàng tại chính Gian hàng đó.
            </li>
            <li>
              <strong>Mã voucher Toàn Sàn:</strong> Áp dụng được cho tất cả các đơn hàng đủ điều kiện giá trị tối thiểu trên CapNong.
            </li>
            <li>
              <strong>Cơ chế cộng gộp (Shopee style):</strong> Trong mỗi đơn hàng, bạn có thể áp dụng đồng thời <strong>01 Voucher Freeship</strong> và <strong>01 Voucher Giảm Giá</strong> (của Shop hoặc Toàn Sàn).
            </li>
            <li>
              <strong>Nhận mã:</strong> Bạn có thể thu thập trực tiếp tại trang chi tiết gian hàng của nhà vườn, hoặc gõ mã code vào ô phía trên để lưu vào kho cá nhân.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default MyVouchersPage

import React, { useState } from 'react'
import { ArrowLeft, Clock, Gift, Loader2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useReceiveVoucher, useShopVouchers } from '@/features/voucher'
import { globalShowAlert } from '@/components/common/Popup'
import { useAuth } from '@/stores'
import { getErrorMessage } from '@/utils'
import { CapNongLoading } from '@/components/ui/Loading'

const PAGE_SIZE = 10

const formatMoney = (value?: number) => `${Number(value ?? 0).toLocaleString('vi-VN')}đ`

const formatDate = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN')
}

interface ShopVouchersProps {
  shopId?: string | number
  onBack?: () => void
}

const ShopVouchers: React.FC<ShopVouchersProps> = ({ shopId: propShopId, onBack: propOnBack }) => {
  const params = useParams<{ shopId?: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const shopId = propShopId ? String(propShopId) : params.shopId
  const shopIdNum = Number(shopId)
  const [page, setPage] = useState(0)
  const vouchersQuery = useShopVouchers(shopIdNum, page, PAGE_SIZE, isAuthenticated)
  const receive = useReceiveVoucher()

  const vouchers = vouchersQuery.data?.vouchers ?? []
  const totalPages = vouchersQuery.data?.totalPages ?? 0
  const canReceiveMap = vouchersQuery.data?.canReceive ?? {}
  const loading = vouchersQuery.isPending
  const receivingCode = receive.isPending ? receive.variables : null

  const [inputCode, setInputCode] = useState('')
  const [submittingCode, setSubmittingCode] = useState(false)

  const handleReceive = async (voucherCode: string) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    try {
      await receive.mutateAsync(voucherCode)
      globalShowAlert('Đã lưu voucher vào kho của bạn.', 'Thành công', 'success')
    } catch (err) {
      globalShowAlert(getErrorMessage(err, 'Không thể nhận voucher.'), 'Lỗi', 'error')
    }
  }

  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = inputCode.trim().toUpperCase()
    if (!code) return
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    try {
      setSubmittingCode(true)
      await receive.mutateAsync(code)
      globalShowAlert(`Đã lưu mã "${code}" vào kho voucher của bạn!`, 'Thành công', 'success')
      setInputCode('')
      vouchersQuery.refetch()
    } catch (err) {
      globalShowAlert(getErrorMessage(err, 'Mã không hợp lệ hoặc đã hết lượt.'), 'Lỗi', 'error')
    } finally {
      setSubmittingCode(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 pb-24">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={propOnBack || (() => navigate(-1))}
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="size-4" />
          Quay lại cửa hàng
        </button>

        <button
          onClick={() => navigate('/my-vouchers')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-bold hover:bg-emerald-100 transition-all shadow-sm"
        >
          <Gift className="size-4 text-emerald-600" />
          Xem Kho Voucher Của Tôi
        </button>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900 font-display flex items-center gap-3">
            <Gift className="size-8 text-primary" />
            Voucher của shop #{shopId}
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Lưu voucher về kho để tự động áp dụng khi đặt hàng tại gian hàng này.
          </p>
        </div>

        {/* Ô nhập mã voucher riêng */}
        <form onSubmit={handleManualCodeSubmit} className="flex gap-2 max-w-sm w-full">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã voucher riêng..."
            className="flex-1 px-3.5 py-2 text-sm font-bold uppercase rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 placeholder:normal-case placeholder:font-normal"
          />
          <button
            type="submit"
            disabled={submittingCode || !inputCode.trim()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 text-white font-bold text-sm rounded-xl whitespace-nowrap shadow-sm"
          >
            {submittingCode ? 'Đang lưu...' : 'Lưu mã'}
          </button>
        </form>
      </div>

      {loading ? (
        <CapNongLoading
          className="!min-h-[320px]"
          message="Đang tải ưu đãi của gian hàng..."
          subMessage="Khám phá các voucher giảm giá và ưu đãi vận chuyển"
          size="md"
        />
      ) : vouchers.length === 0 ? (
        <div className="rounded-[32px] border border-gray-100 bg-white p-16 text-center shadow-sm">
          <Gift className="mx-auto mb-4 size-14 text-gray-200" />
          <p className="font-black text-gray-700">Shop chưa có voucher công khai nào.</p>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Bạn có thể nhập mã voucher riêng do shop cung cấp vào ô phía trên, hoặc xem các voucher ưu đãi Toàn Sàn trong Kho voucher của bạn.
          </p>
          <button
            onClick={() => navigate('/my-vouchers')}
            className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 shadow-sm transition-all"
          >
            Đến Kho Voucher Của Tôi
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vouchers.map((voucher) => {
            const canReceive = canReceiveMap[voucher.voucherCode] !== false
            const scopeLabel = voucher.voucherScope === 'PLATFORM' ? 'Toàn sàn' : 'Shop'
            const discountLabel =
              voucher.voucherType === 'PERCENTAGE'
                ? `Giảm ${voucher.discountValue}%`
                : voucher.voucherType === 'FIXED_AMOUNT'
                  ? `Giảm ${formatMoney(Number(voucher.discountValue))}`
                  : 'Miễn phí vận chuyển'
            return (
              <div
                key={voucher.voucherCode}
                className="rounded-[28px] border border-dashed border-primary/30 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-black uppercase tracking-widest text-primary">
                        {voucher.voucherCode}
                      </p>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                        {scopeLabel}
                      </span>
                    </div>
                    <h3 className="mt-1 text-2xl font-black text-gray-900">{discountLabel}</h3>
                    <p className="mt-1 text-sm font-bold text-gray-500">
                      Tối đa {formatMoney(Number(voucher.maxDiscount || 0))} · Đơn từ{' '}
                      {formatMoney(Number(voucher.minOrderValue || 0))}
                    </p>
                  </div>
                  <button
                    disabled={
                      receivingCode === voucher.voucherCode || (isAuthenticated && !canReceive)
                    }
                    onClick={() => handleReceive(voucher.voucherCode)}
                    className="rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white hover:bg-primary-dark disabled:bg-gray-200 disabled:text-gray-500"
                  >
                    {receivingCode === voucher.voucherCode
                      ? 'Đang lưu...'
                      : isAuthenticated && !canReceive
                        ? 'Đã nhận'
                        : 'Nhận'}
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" />
                    HSD {formatDate(voucher.expiryDate)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-sm font-bold text-gray-500">
            Trang {page + 1}/{totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  )
}

export default ShopVouchers

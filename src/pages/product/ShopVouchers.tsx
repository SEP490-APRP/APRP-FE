import React, { useState } from 'react'
import { ArrowLeft, Clock, Gift, Loader2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useReceiveVoucher, useShopVouchers } from '@/features/voucher'
import { globalShowAlert } from '@/components/common/Popup'
import { useAuth } from '@/stores'
import { getErrorMessage } from '@/utils'

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 pb-24">
      <button
        onClick={propOnBack || (() => navigate(-1))}
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="size-4" />
        Quay lại cửa hàng
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 font-display flex items-center gap-3">
          <Gift className="size-9 text-primary" />
          Voucher của shop
        </h1>
        <p className="mt-2 text-sm font-medium text-gray-500">
          Lưu voucher về kho để dùng khi đặt hàng.
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <Loader2 className="size-10 animate-spin text-primary" />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="rounded-[32px] border border-gray-100 bg-white p-16 text-center shadow-sm">
          <Gift className="mx-auto mb-4 size-14 text-gray-200" />
          <p className="font-black text-gray-700">Shop chưa có voucher nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vouchers.map((voucher) => {
            const canReceive = canReceiveMap[voucher.voucherCode] !== false
            return (
              <div
                key={voucher.voucherCode}
                className="rounded-[28px] border border-dashed border-primary/30 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-primary">
                      {voucher.voucherCode}
                    </p>
                    <h3 className="mt-1 text-2xl font-black text-gray-900">
                      Giảm {voucher.discountValue}%
                    </h3>
                    <p className="mt-1 text-sm font-bold text-gray-500">
                      Tối đa {formatMoney(Number(voucher.maxDiscount))} · Đơn từ{' '}
                      {formatMoney(Number(voucher.minOrderValue))}
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

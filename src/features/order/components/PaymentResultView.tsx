import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, ShoppingBag, ArrowRight, Loader2, Store } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { OrderStatusBadge } from './OrderStatusBadge'
import { useConfirmPayment, useOrderDetails } from '../hooks/useBuyerOrder'
import type { OrderStatus } from '@/types/order.types'
import type { PaymentResponse } from '@/types/payment.types'

export const PaymentResultView: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const orderCode = searchParams.get('orderCode')
  const orderIdParam = searchParams.get('orderId')
  const methodParam = searchParams.get('method')
  const statusParam = searchParams.get('status')

  const confirmMutation = useConfirmPayment()
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const parsedOrderId = orderIdParam ? parseInt(orderIdParam, 10) : 0
  const { data: orderDetail } = useOrderDetails(parsedOrderId)

  useEffect(() => {
    if (orderCode) {
      setIsVerifying(true)
      confirmMutation
        .mutateAsync(orderCode)
        .then((res) => {
          setPaymentResult(res)
        })
        .catch((err) => {
          console.error('Lỗi xác thực thanh toán:', err)
        })
        .finally(() => {
          setIsVerifying(false)
        })
    }
  }, [orderCode])

  const isPaid = paymentResult?.status === 'PAID' || statusParam === 'PAID' || orderDetail?.status === 'PAID'
  const isPending = !isPaid

  if (isVerifying) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <Loader2 size={48} className="animate-spin text-emerald-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-ink mb-2">Đang xác thực giao dịch...</h2>
        <p className="text-sm text-ink-muted">
          Hệ thống đang kết nối với cổng thanh toán PayOS để cập nhật trạng thái đơn hàng của bạn.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl border border-line p-8 shadow-sm text-center">
        {/* Biểu tượng trạng thái */}
        <div className="mb-6 inline-flex p-4 rounded-full bg-emerald-50 text-emerald-600">
          {isPaid ? (
            <CheckCircle2 size={56} className="text-emerald-600" />
          ) : (
            <Clock size={56} className="text-amber-600" />
          )}
        </div>

        {/* Tiêu đề */}
        <h1 className="text-2xl font-black text-ink mb-2">
          {isPaid ? 'Thanh toán thành công!' : 'Đặt hàng thành công!'}
        </h1>

        {/* Badge trạng thái */}
        <div className="flex justify-center mb-4">
          <OrderStatusBadge
            status={(isPaid ? 'PAID' : 'PENDING') as OrderStatus}
            paymentMethod={methodParam || (isPaid ? 'PAYOS' : 'COD')}
          />
        </div>

        {/* Thông điệp */}
        <p className="text-sm text-ink-muted leading-relaxed mb-6">
          {isPaid
            ? 'Đơn hàng của bạn đã được thanh toán trực tuyến qua cổng PayOS. Nhà vườn sẽ tiến hành kiểm tra và chuẩn bị nông sản để giao cho bạn.'
            : 'Đơn hàng (COD) của bạn đã được tiếp nhận thành công. Nhà vườn sẽ kiểm tra đơn và gửi hàng sớm nhất.'}
        </p>

        {/* Tóm tắt mã đơn */}
        <div className="bg-gray-50 rounded-2xl p-4 text-left border border-line mb-6 space-y-2 text-sm">
          {orderCode && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-muted">Mã giao dịch PayOS:</span>
              <span className="font-mono font-bold text-ink">{orderCode}</span>
            </div>
          )}
          {parsedOrderId > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-muted">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-ink">#{parsedOrderId}</span>
            </div>
          )}
          {orderDetail && (
            <div className="flex justify-between items-center text-xs pt-2 border-t border-line">
              <span className="text-ink-muted">Nhà vườn:</span>
              <span className="font-semibold text-ink flex items-center gap-1">
                <Store size={12} className="text-emerald-600" />
                {orderDetail.shopName}
              </span>
            </div>
          )}
          {(paymentResult?.amount || orderDetail?.totalAmount) && (
            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-ink-muted">Tổng tiền:</span>
              <span className="font-bold text-emerald-700">
                {(paymentResult?.amount || orderDetail?.totalAmount)?.toLocaleString('vi-VN')} đ
              </span>
            </div>
          )}
        </div>

        {/* Nút hành động */}
        <div className="space-y-3">
          <Button
            variant="primary"
            onClick={() => navigate('/nong-san-tuoi')}
            className="w-full justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
          >
            <ShoppingBag size={16} />
            Tiếp tục mua sắm
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate('/cart')}
            className="w-full justify-center gap-2 py-3 rounded-xl"
          >
            Xem giỏ hàng
          </Button>
        </div>
      </div>
    </div>
  )
}

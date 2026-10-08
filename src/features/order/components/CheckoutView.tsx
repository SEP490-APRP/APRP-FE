import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  MapPin,
  CreditCard,
  Banknote,
  ArrowRight,
  ShieldCheck,
  Store,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Truck,
  ShoppingBag,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  useCheckoutPreview,
  useCreateOrder,
  useCreatePayment,
} from '../hooks/useBuyerOrder'
import { useMyCart } from '@/features/cart/hooks/useCartQueries'
import { PaymentQrModal } from './PaymentQrModal'
import type { OrderItemRequest } from '@/types/order.types'
import type { PaymentResponse } from '@/types/payment.types'

interface CheckoutFormValues {
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  note?: string
  paymentMethod: 'COD' | 'PAYOS'
}

export const CheckoutView: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedCartItemIds = (location.state as { selectedCartItemIds?: number[] })?.selectedCartItemIds

  const { data: cart, isLoading: isCartLoading } = useMyCart()
  const previewMutation = useCheckoutPreview()
  const createOrderMutation = useCreateOrder()
  const createPaymentMutation = useCreatePayment()

  // Modal QR PayOS state
  const [qrModalData, setQrModalData] = useState<PaymentResponse | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [createdOrderCode, setCreatedOrderCode] = useState<string>('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    defaultValues: {
      recipientName: '',
      recipientPhone: '',
      shippingAddress: '',
      note: '',
      paymentMethod: 'PAYOS',
    },
  })

  const selectedPaymentMethod = watch('paymentMethod')
  const shippingAddress = watch('shippingAddress')

  // Lọc danh sách items cần checkout từ giỏ hàng theo từng shop
  const checkoutShops = React.useMemo(() => {
    if (!cart?.shopCarts) return []
    return cart.shopCarts
      .map((shop) => {
        const filteredItems = shop.items.filter((item) => {
          const isSelected = !selectedCartItemIds || selectedCartItemIds.includes(item.cartItemId)
          return isSelected && item.available !== false
        })
        return {
          ...shop,
          items: filteredItems,
        }
      })
      .filter((shop) => shop.items.length > 0)
  }, [cart, selectedCartItemIds])

  const checkoutItems = React.useMemo(() => {
    return checkoutShops.flatMap((shop) =>
      shop.items.map((item) => ({
        itemReq: {
          productId: item.productId || (item.itemType === 'PRODUCT' ? item.itemId : undefined),
          mysteryBoxId: item.mysteryBoxId || (item.itemType === 'MYSTERY_BOX' ? item.itemId : undefined),
          buildComboId: item.buildComboId || (item.itemType === 'BUILD_COMBO' ? item.itemId : undefined),
          quantity: item.quantity,
        },
        cartItemId: item.cartItemId,
        shopId: shop.shopId,
        shopName: shop.shopName,
        itemName: item.itemName || item.name || '',
        imageUrl: item.imageUrl,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        itemType: item.itemType,
      }))
    )
  }, [checkoutShops])

  const totalItemsCount = React.useMemo(() => {
    return checkoutItems.reduce((sum, it) => sum + it.quantity, 0)
  }, [checkoutItems])

  // Tự động gọi preview khi có items và địa chỉ
  useEffect(() => {
    if (checkoutItems.length > 0) {
      previewMutation.mutate({
        shippingAddress: shippingAddress || 'Thành phố Hồ Chí Minh',
        items: checkoutItems.map((i) => i.itemReq),
        cartItemIds: checkoutItems.map((i) => i.cartItemId),
      })
    }
  }, [checkoutItems.length, shippingAddress])

  const onSubmit = async (values: CheckoutFormValues) => {
    if (checkoutItems.length === 0) return

    try {
      const orders = await createOrderMutation.mutateAsync({
        recipientName: values.recipientName,
        recipientPhone: values.recipientPhone,
        shippingAddress: values.shippingAddress,
        note: values.note,
        paymentMethod: values.paymentMethod,
        items: checkoutItems.map((i) => i.itemReq),
        cartItemIds: checkoutItems.map((i) => i.cartItemId),
      })

      if (!orders || orders.length === 0) return

      const firstOrder = orders[0]
      const batchId = firstOrder.batchId || undefined
      const orderId = firstOrder.orderId

      // 1. Nếu là COD: Đơn ở trạng thái PENDING -> Chuyển thẳng trang kết quả
      if (values.paymentMethod === 'COD') {
        navigate(`/payment/result?orderId=${orderId}&status=PENDING&method=COD`)
        return
      }

      // 2. Nếu là PAYOS (Chuyển khoản QR): Khởi tạo payment link
      const paymentRes = await createPaymentMutation.mutateAsync({
        batchId: batchId,
        orderId: batchId ? undefined : orderId,
        returnUrl: `${window.location.origin}/payment/result`,
        cancelUrl: `${window.location.origin}/payment/result`,
      })

      if (paymentRes.checkoutUrl) {
        // Nếu có mã QR, mở modal QR hoặc chuyển hướng sang checkoutUrl
        setQrModalData(paymentRes)
        setCreatedOrderCode(paymentRes.payosOrderCode)
        setIsQrModalOpen(true)
      } else {
        navigate(`/payment/result?orderCode=${paymentRes.payosOrderCode}`)
      }
    } catch (err: any) {
      console.error('Lỗi khi đặt hàng:', err)
    }
  }

  const handleQrModalConfirmed = () => {
    setIsQrModalOpen(false)
    if (createdOrderCode) {
      navigate(`/payment/result?orderCode=${createdOrderCode}`)
    }
  }

  if (isCartLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle size={48} className="text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-ink">Không có sản phẩm nào để thanh toán</h2>
        <p className="text-sm text-ink-muted">
          Vui lòng chọn lại các mặt hàng trong giỏ hàng trước khi tiến hành thanh toán.
        </p>
        <Button variant="primary" onClick={() => navigate('/cart')}>
          Quay lại giỏ hàng
        </Button>
      </div>
    )
  }

  const previewData = previewMutation.data
  const goodsAmount = previewData?.totalGoodsAmount ?? previewData?.subtotal ?? 0
  const shippingFee = previewData?.totalShippingFee ?? previewData?.shippingFee ?? 0
  const discount = previewData?.totalVoucherDiscount ?? previewData?.discount ?? 0
  const finalTotal = previewData?.finalTotalAmount ?? previewData?.totalAmount ?? (goodsAmount + shippingFee - discount)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header quay lại */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/cart')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-line hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-ink">Xác nhận đặt hàng & Thanh toán</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cột trái: Thông tin giao hàng & phương thức thanh toán */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin người nhận */}
            <div className="bg-white rounded-2xl border border-line p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-line text-sm font-bold text-ink">
                <MapPin size={18} className="text-emerald-600" />
                Địa chỉ nhận hàng
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                    Họ và tên người nhận <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Nguyễn Văn A"
                    {...register('recipientName', { required: 'Vui lòng nhập tên người nhận' })}
                    error={errors.recipientName?.message}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="0912 345 678"
                    {...register('recipientPhone', {
                      required: 'Vui lòng nhập số điện thoại',
                      pattern: {
                        value: /^[0-9]{9,11}$/,
                        message: 'Số điện thoại không hợp lệ',
                      },
                    })}
                    error={errors.recipientPhone?.message}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                  Địa chỉ giao hàng chi tiết <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  {...register('shippingAddress', { required: 'Vui lòng nhập địa chỉ giao hàng' })}
                  error={errors.shippingAddress?.message}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                  Ghi chú cho người bán / shipper
                </label>
                <Input placeholder="Giao vào giờ hành chính, gọi trước khi đến..." {...register('note')} />
              </div>
            </div>

            {/* Chọn phương thức thanh toán */}
            <div className="bg-white rounded-2xl border border-line p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-line text-sm font-bold text-ink">
                <CreditCard size={18} className="text-emerald-600" />
                Phương thức thanh toán
              </div>

              <div className="space-y-3">
                {/* Lựa chọn 1: PAYOS QR */}
                <label
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedPaymentMethod === 'PAYOS'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-line hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    value="PAYOS"
                    {...register('paymentMethod')}
                    className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold text-sm text-ink">
                      <span>Chuyển khoản VietQR / Quét mã PayOS</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Khuyên dùng
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      Quét mã QR từ ứng dụng ngân hàng hoặc ví điện tử bất kỳ. Hệ thống tự động xác nhận ngay tức thì.
                    </p>
                  </div>
                </label>

                {/* Lựa chọn 2: COD */}
                <label
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedPaymentMethod === 'COD'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-line hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    value="COD"
                    {...register('paymentMethod')}
                    className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold text-sm text-ink">
                      <Banknote size={16} className="text-amber-600" />
                      <span>Thanh toán khi nhận hàng (COD)</span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      Thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng khi nhận được nông sản.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Danh sách các mặt hàng theo từng Shop chuẩn sàn TMĐT */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <ShoppingBag size={20} className="text-emerald-600" />
                  Danh sách mặt hàng đặt mua ({totalItemsCount} sản phẩm)
                </h3>
                <span className="text-xs text-ink-muted">
                  Phân chia theo {checkoutShops.length} nhà vườn / đối tác
                </span>
              </div>

              {checkoutShops.map((shop) => {
                const shopPreview = previewMutation.data?.shopOrders?.find(
                  (so) => so.shopId === shop.shopId,
                )
                const shopGoodsTotal = shop.items.reduce(
                  (sum, it) => sum + it.unitPrice * it.quantity,
                  0,
                )
                const shopShippingFee = shopPreview?.shippingFee ?? 15000
                const shopFinalTotal =
                  shopPreview?.totalAmount ?? shopGoodsTotal + shopShippingFee

                return (
                  <div
                    key={shop.shopId}
                    className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden"
                  >
                    {/* Header Nhà vườn / Shop */}
                    <div className="bg-[#f8faf6] px-5 py-3 border-b border-line flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {shop.shopAvatar ? (
                            <img
                              src={shop.shopAvatar}
                              alt={shop.shopName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store size={16} />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-ink">{shop.shopName}</span>
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Nhà vườn đối tác
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-ink-muted">
                        {shop.items.length} mặt hàng
                      </span>
                    </div>

                    {/* Danh sách mặt hàng của Shop */}
                    <div className="divide-y divide-gray-100">
                      {shop.items.map((item) => (
                        <div
                          key={item.cartItemId}
                          className="p-4 flex items-center gap-4 hover:bg-stone-50/50 transition-colors"
                        >
                          {/* Ảnh sản phẩm */}
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 border border-line shrink-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.itemName || item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <ShoppingBag size={22} />
                              </div>
                            )}
                          </div>

                          {/* Chi tiết sản phẩm */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-ink line-clamp-1">
                              {item.itemName || item.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] text-ink-muted bg-stone-100 px-2 py-0.5 rounded-md font-medium">
                                {item.itemType === 'MYSTERY_BOX'
                                  ? 'Túi mù nông sản'
                                  : item.itemType === 'BUILD_COMBO'
                                  ? 'Combo nông sản'
                                  : 'Nông sản tuyển chọn'}
                              </span>
                            </div>
                          </div>

                          {/* Đơn giá & Số lượng */}
                          <div className="text-right shrink-0">
                            <div className="text-xs text-ink-muted">
                              {item.unitPrice.toLocaleString('vi-VN')} đ
                            </div>
                            <div className="text-xs font-semibold text-ink mt-0.5">
                              x{item.quantity}
                            </div>
                          </div>

                          {/* Thành tiền */}
                          <div className="text-right shrink-0 min-w-[95px]">
                            <span className="text-sm font-bold text-emerald-700">
                              {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Vận chuyển & Tạm tính của Shop */}
                    <div className="bg-[#fafbf9] px-5 py-3 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                      <div className="flex items-center gap-2 text-ink-muted">
                        <Truck size={15} className="text-emerald-600 shrink-0" />
                        <span>
                          Vận chuyển:{' '}
                          <strong className="text-ink font-medium">
                            Giao tiêu chuẩn (Xe lạnh bảo quản tươi)
                          </strong>
                        </span>
                        <span className="text-emerald-700 font-semibold ml-1">
                          +{shopShippingFee.toLocaleString('vi-VN')} đ
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 text-ink">
                        <span>Tạm tính shop:</span>
                        <strong className="text-sm font-bold text-emerald-700">
                          {shopFinalTotal.toLocaleString('vi-VN')} đ
                        </strong>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cột phải: Tóm tắt chi phí & Submit */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-line p-5 shadow-xs sticky top-20 space-y-4">
              <h3 className="font-bold text-base text-ink pb-3 border-b border-line">
                Chi tiết thanh toán
              </h3>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-ink-muted">
                  <span>Tiền hàng:</span>
                  <span className="font-semibold text-ink">
                    {goodsAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="flex justify-between text-ink-muted">
                  <span>Phí vận chuyển:</span>
                  <span className="font-semibold text-ink">
                    {previewMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin inline" />
                    ) : (
                      `${shippingFee.toLocaleString('vi-VN')} đ`
                    )}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Giảm giá voucher:</span>
                    <span className="font-semibold">-{discount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-line flex justify-between items-baseline">
                <span className="font-bold text-ink">Tổng thanh toán:</span>
                <span className="text-xl font-black text-emerald-700">
                  {finalTotal.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={createOrderMutation.isPending || createPaymentMutation.isPending}
                className="w-full justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
              >
                {createOrderMutation.isPending || createPaymentMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang xử lý đặt hàng...
                  </>
                ) : (
                  <>
                    {selectedPaymentMethod === 'PAYOS' ? 'Thanh toán qua PayOS' : 'Đặt hàng (COD)'}
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2 text-[11px] text-gray-500 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>Nông sản chất lượng, cam kết hoàn tiền 100% nếu phát hiện dập nát, hư hỏng.</span>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Modal hiển thị mã VietQR nếu chọn PayOS */}
      {qrModalData && (
        <PaymentQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          onConfirmed={handleQrModalConfirmed}
          qrCodeUrl={qrModalData.qrCodeUrl}
          checkoutUrl={qrModalData.checkoutUrl}
          amount={qrModalData.amount}
          orderCode={qrModalData.payosOrderCode}
        />
      )}
    </div>
  )
}

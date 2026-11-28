import React from 'react'
import { Truck, MapPin, Phone, ExternalLink, Store, Clock, CreditCard, CheckCircle2, XCircle, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { OrderTrackingDto } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface OrderTrackingCardProps {
  tracking: OrderTrackingDto
}

export const OrderTrackingCard: React.FC<OrderTrackingCardProps> = ({ tracking }) => {
  const navigate = useNavigate()
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)

  const formatPrice = (val?: number) => {
    if (!val) return '0\u00A0đ'
    return new Intl.NumberFormat('vi-VN').format(val) + '\u00A0đ'
  }

  // Xác định tab phù hợp trên trang /orders theo đúng trạng thái đơn
  const getTargetTabAndAction = (status?: string) => {
    switch (status) {
      case 'SHIPPING':
      case 'PICKED_UP':
        return {
          tab: 'SHIPPING',
          label: 'Theo dõi hành trình Shipper',
          icon: Truck,
        }
      case 'PENDING':
        return {
          tab: 'PENDING',
          label: 'Xem đơn hàng chờ xác nhận',
          icon: Clock,
        }
      case 'CONFIRMED':
      case 'READY':
        return {
          tab: 'PENDING',
          label: 'Xem đơn hàng đang đóng gói',
          icon: FileText,
        }
      case 'AWAITING_PAYMENT':
        return {
          tab: 'AWAITING_PAYMENT',
          label: 'Thanh toán đơn hàng ngay',
          icon: CreditCard,
        }
      case 'COMPLETED':
      case 'DELIVERED':
        return {
          tab: 'COMPLETED',
          label: 'Xem chi tiết đơn đã giao',
          icon: CheckCircle2,
        }
      case 'CANCELLED':
        return {
          tab: 'CANCELLED',
          label: 'Xem chi tiết đơn đã hủy',
          icon: XCircle,
        }
      default:
        return {
          tab: 'ALL',
          label: 'Xem chi tiết đơn hàng',
          icon: ExternalLink,
        }
    }
  }

  const { tab: targetTab, label: actionLabel, icon: ActionIcon } = getTargetTabAndAction(tracking.orderStatus)

  const handleOpenTracking = () => {
    toggleOpen()
    // Điều hướng chuẩn tới trang Quản lý đơn hàng /orders kèm tab và mã đơn hàng
    if (tracking.trackingUrl && tracking.trackingUrl.startsWith('/orders')) {
      navigate(tracking.trackingUrl)
    } else {
      navigate(`/orders?tab=${targetTab}&orderId=${tracking.orderId}`)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'SHIPPING':
      case 'PICKED_UP':
        return 'bg-[#fff7cc] text-[#8a4e1d] border-[#ffba41]/50'
      case 'COMPLETED':
      case 'DELIVERED':
        return 'bg-[#e3f1da] text-[#326318] border-[#cfe6c4]'
      case 'CANCELLED':
        return 'bg-[#fdecea] text-[#d32f2f] border-[#d32f2f]/30'
      default:
        return 'bg-[#f1f8ec] text-[#254b12] border-[#cfe6c4]'
    }
  }

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-white border border-[#e2e6dc] shadow-xs space-y-3 text-[#1c2216]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5e2da] pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#f1f8ec] text-[#326318]">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1c2216]">
              Đơn hàng #{tracking.orderId}
            </h4>
            <div className="text-[10px] text-[#5f6b57] flex items-center gap-1 mt-0.5">
              <Store className="w-3 h-3 text-[#5f6b57]" />
              <span>{tracking.shopName || 'Nhà vườn CapNong'}</span>
            </div>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(
            tracking.orderStatus
          )}`}
        >
          {tracking.statusDescription}
        </span>
      </div>

      {/* Shipper & Delivery Details */}
      <div className="space-y-2 text-xs text-[#1c2216]">
        <div className="flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#d32f2f] flex-shrink-0 mt-0.5" />
          <span className="truncate text-[#5f6b57]">{tracking.shippingAddress || 'Địa chỉ nhận hàng'}</span>
        </div>

        <div className="flex items-center justify-between pt-1 text-[11px] bg-[#f8faf6] p-2 rounded-lg border border-[#e5e2da]">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#1c2216]">Tài xế:</span>
            <span className="text-[#326318] font-medium">
              {tracking.shipperName || 'Đang điều phối tài xế'}
            </span>
          </div>
          {tracking.shipperPhone && (
            <a
              href={`tel:${tracking.shipperPhone}`}
              className="flex items-center gap-1 text-[#326318] font-bold hover:underline"
            >
              <Phone className="w-3 h-3" />
              <span>{tracking.shipperPhone}</span>
            </a>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-[#e5e2da] gap-2">
          <span className="text-[11px] text-[#5f6b57] whitespace-nowrap">Tổng thanh toán:</span>
          <span className="text-sm font-bold text-[#326318] whitespace-nowrap shrink-0">
            {formatPrice(tracking.totalAmount)}
          </span>
        </div>
      </div>

      {/* Action Button: Điều hướng chuẩn /orders theo từng trạng thái */}
      <button
        type="button"
        onClick={handleOpenTracking}
        className="w-full py-2.5 px-3 rounded-xl bg-[#326318] hover:bg-[#254b12] active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
      >
        <ActionIcon className="w-4 h-4 text-[#ffea79]" />
        <span>{actionLabel}</span>
      </button>
    </div>
  )
}

export default OrderTrackingCard

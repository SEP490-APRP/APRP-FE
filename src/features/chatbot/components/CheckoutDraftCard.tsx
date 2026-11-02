import React from 'react'
import { CreditCard, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AiCheckoutDraft } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface CheckoutDraftCardProps {
  checkout: AiCheckoutDraft
}

export const CheckoutDraftCard: React.FC<CheckoutDraftCardProps> = ({ checkout }) => {
  const navigate = useNavigate()
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)

  const formatPrice = (val?: number) => {
    if (!val) return '0 đ'
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ'
  }

  const handleCheckout = () => {
    toggleOpen()
    navigate(checkout.checkoutUrl || '/checkout')
  }

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold tracking-wide">
            Đơn hàng đã sẵn sàng
          </span>
        </div>
        <span className="text-sm font-bold text-emerald-100">
          {formatPrice(checkout.totalAmount)}
        </span>
      </div>

      <p className="text-xs text-emerald-50 leading-relaxed">
        Bạn có thể áp dụng mã giảm giá và chọn địa chỉ giao nhận hàng ở bước thanh toán.
      </p>

      <button
        type="button"
        onClick={handleCheckout}
        className="w-full py-2 px-3 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 font-semibold text-xs flex items-center justify-center gap-1.5 shadow active:scale-[0.98] transition-all"
      >
        <span>Tiến hành đặt hàng ngay</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

import React from 'react'
import { Store, Lightbulb, ShoppingBag, Ticket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ShippingTipDto } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface ShippingTipsCardProps {
  tips: ShippingTipDto
}

export const ShippingTipsCard: React.FC<ShippingTipsCardProps> = ({ tips }) => {
  const navigate = useNavigate()
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)

  const handleOpenCart = () => {
    toggleOpen()
    navigate('/cart')
  }

  const handleOpenVouchers = () => {
    toggleOpen()
    navigate('/my-vouchers?tab=SHIPPING')
  }

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/90 shadow-2xs space-y-3 text-soil-800">
      <div className="flex items-center gap-2 text-blue-900 text-xs font-bold">
        <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span>Mẹo Tối Ưu Phí Giao Hàng</span>
      </div>

      <p className="text-xs leading-relaxed text-soil-800">
        {tips.tipMessage}
      </p>

      {tips.hasMultiShops && (tips.shopNames || []).length > 0 && (
        <div className="p-2.5 rounded-lg bg-white/95 border border-blue-100 text-[11px] space-y-1.5 shadow-2xs">
          <span className="font-semibold text-soil-700">Các nhà vườn trong giỏ của bạn ({tips.shopCount}):</span>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {(tips.shopNames || []).map((name, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-medium border border-blue-200"
              >
                <Store className="w-3 h-3 text-blue-600" />
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={handleOpenCart}
          className="py-2 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Xem giỏ hàng</span>
        </button>

        <button
          type="button"
          onClick={handleOpenVouchers}
          className="py-2 px-2.5 rounded-lg bg-white hover:bg-blue-50 active:scale-[0.98] text-blue-700 border border-blue-300 text-xs font-semibold flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
          title="Xem các mã freeship hiện có"
        >
          <Ticket className="w-3.5 h-3.5 text-amber-500" />
          <span>Mã Freeship</span>
        </button>
      </div>
    </div>
  )
}

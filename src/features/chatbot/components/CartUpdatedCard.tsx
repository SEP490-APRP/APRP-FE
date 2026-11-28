import React from 'react'
import { ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AiCartPreview, AiItemOption } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'
import { queryClient } from '@/app/providers/queryClient'
import { cartKeys } from '@/features/cart/hooks/useCartQueries'

interface CartUpdatedCardProps {
  cart?: AiCartPreview
  selectedProduct?: AiItemOption
}

export const CartUpdatedCard: React.FC<CartUpdatedCardProps> = ({
  cart,
  selectedProduct,
}) => {
  const navigate = useNavigate()
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)

  const formatPrice = (val?: number) => {
    if (!val) return '0\u00A0đ'
    return new Intl.NumberFormat('vi-VN').format(val) + '\u00A0đ'
  }

  const handleOpenCart = () => {
    queryClient.invalidateQueries({ queryKey: cartKeys.all })
    toggleOpen()
    navigate('/cart')
  }

  const handleGoToCheckout = () => {
    queryClient.invalidateQueries({ queryKey: cartKeys.all })
    toggleOpen()
    navigate('/checkout')
  }

  return (
    <div className="mt-3 p-3 rounded-xl bg-[#f1f8ec] border border-[#cfe6c4] shadow-xs space-y-2.5">
      <div className="flex items-center gap-2 text-[#254b12] text-xs font-bold">
        <CheckCircle2 className="w-4 h-4 text-[#326318] flex-shrink-0" />
        <span>Cập nhật giỏ hàng thành công</span>
      </div>

      {selectedProduct && (
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-[#e2e6dc] text-xs">
          {selectedProduct.imageUrl ? (
            <img
              src={selectedProduct.imageUrl}
              alt={selectedProduct.name}
              className="w-10 h-10 rounded-md object-cover flex-shrink-0 border border-[#e5e2da]"
            />
          ) : (
            <div className="w-10 h-10 rounded-md bg-[#e3f1da] flex items-center justify-center text-sm">
              🥬
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#1c2216] truncate">
              {selectedProduct.name}
            </p>
            <p className="text-[#326318] font-bold">
              {formatPrice(selectedProduct.salePrice || selectedProduct.price)}
            </p>
          </div>
        </div>
      )}

      {cart && (
        <div className="pt-2 border-t border-[#cfe6c4] flex items-center justify-between text-xs">
          <span className="text-[#5f6b57] font-medium">
            Tổng giá trị giỏ hàng:
          </span>
          <span className="text-sm font-bold text-[#326318]">
            {formatPrice(cart.totalAmount)}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleOpenCart}
          className="flex-1 py-2 px-3 rounded-lg border border-[#326318] text-[#326318] hover:bg-[#e3f1da] active:scale-95 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Xem giỏ hàng</span>
        </button>
        <button
          type="button"
          onClick={handleGoToCheckout}
          className="flex-1 py-2 px-3 rounded-lg bg-[#326318] hover:bg-[#254b12] text-white active:scale-95 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <span>Thanh toán</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default CartUpdatedCard

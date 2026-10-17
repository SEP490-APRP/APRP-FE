import React from 'react'
import { Trash2 } from 'lucide-react'
import type { CartItemResponse } from '@/types/cart.types'

interface CartDeleteModalProps {
  item: CartItemResponse | null
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const CartDeleteModal: React.FC<CartDeleteModalProps> = ({
  item,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  if (!item) return null

  return (
    <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-stone-200 animate-scaleUp text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
          <Trash2 size={22} />
        </div>
        <h4 className="font-bold text-sm text-[#191f14]">Bỏ sản phẩm này?</h4>
        <p className="text-xs text-[#6e7766] mt-1 mb-4 leading-relaxed">
          Bạn có chắc muốn bỏ <strong>{item.itemName || item.name}</strong> khỏi giỏ nông sản?
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-2 px-3 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer transition-colors disabled:opacity-50"
          >
            Giữ lại
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Đang xóa...' : 'Xóa bỏ'}
          </button>
        </div>
      </div>
    </div>
  )
}

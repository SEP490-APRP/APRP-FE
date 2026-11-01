import React from 'react'
import { Minus, Plus, ShoppingBasket, Trash2, Loader2 } from 'lucide-react'
import { money } from '@/mocks/catalog'
import type { CartItemResponse } from '@/types/cart.types'

interface CartItemRowProps {
  item: CartItemResponse
  isSelected: boolean
  isUpdating: boolean
  editingQuantity?: string
  compact?: boolean
  onToggleSelect: (cartItemId: number) => void
  onQuantityChange: (item: CartItemResponse, delta: number) => void
  onDirectQuantityChange: (item: CartItemResponse, val: string) => void
  onCommitQuantity: (item: CartItemResponse) => void
  onRemove: (item: CartItemResponse) => void
}

export const CartItemRow: React.FC<CartItemRowProps> = React.memo(({
  item,
  isSelected,
  isUpdating,
  editingQuantity,
  compact = true,
  onToggleSelect,
  onQuantityChange,
  onDirectQuantityChange,
  onCommitQuantity,
  onRemove,
}) => {
  const isAvailable = item.available !== false && (item as any).isAvailable !== false
  const maxStock = item.stockQuantity

  return (
    <div
      className={`flex items-center gap-3 transition-opacity ${
        compact ? 'py-2.5 first:pt-1 last:pb-1 text-xs' : 'py-3 px-1 text-xs sm:text-sm'
      } ${isUpdating ? 'opacity-60' : ''}`}
    >
      {/* Checkbox item */}
      <input
        type="checkbox"
        className="w-4 h-4 rounded text-[#326318] border-stone-300 focus:ring-[#326318] cursor-pointer disabled:opacity-40 shrink-0"
        checked={isSelected}
        disabled={!isAvailable}
        onChange={() => onToggleSelect(item.cartItemId)}
        aria-label={`Chọn sản phẩm ${item.itemName || item.name}`}
      />

      {/* Ảnh sản phẩm */}
      <div
        className={`rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-[#e8ece3] ${
          compact ? 'w-14 h-14' : 'w-13 h-13 sm:w-14 sm:h-14'
        }`}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.itemName || item.name || 'Sản phẩm'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400">
            <ShoppingBasket size={compact ? 18 : 22} />
          </div>
        )}
      </div>

      {/* Thông tin sản phẩm */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-[#1c2e17] leading-snug line-clamp-2">
          {item.itemName || item.name}
        </h4>
        <div className="text-[#6e6656] text-[11px] mt-0.5">
          {money(item.unitPrice)}
        </div>
        {!isAvailable && (
          <span className="inline-block text-[10px] text-red-500 font-medium mt-0.5">
            Tạm hết hàng
          </span>
        )}

        {/* Bộ tăng giảm số lượng + ô nhập số trực tiếp */}
        <div className="mt-1.5 flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-[#ded7c8] bg-[#f9f7f2] p-0.5">
            <button
              type="button"
              className="w-6 h-6 flex items-center justify-center text-[#555d4d] hover:text-black rounded hover:bg-[#eae5d8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Giảm"
              disabled={isUpdating}
              onClick={() => onQuantityChange(item, -1)}
            >
              <Minus size={11} />
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-8 text-center bg-transparent text-xs font-bold text-[#1f2818] outline-none border-0 p-0 focus:ring-0"
              value={editingQuantity ?? item.quantity}
              onChange={(e) => onDirectQuantityChange(item, e.target.value)}
              onBlur={() => onCommitQuantity(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCommitQuantity(item)
              }}
              aria-label={`Số lượng của ${item.itemName || item.name}`}
            />
            <button
              type="button"
              className="w-6 h-6 flex items-center justify-center text-[#555d4d] hover:text-black rounded hover:bg-[#eae5d8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Tăng"
              disabled={
                isUpdating || (maxStock !== undefined && item.quantity >= maxStock)
              }
              onClick={() => onQuantityChange(item, 1)}
            >
              {isUpdating ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
            </button>
          </div>
        </div>
      </div>

      {/* Thành tiền & Nút xóa */}
      <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
        <strong className="text-xs text-[#326318] font-bold">
          {money(item.unitPrice * item.quantity)}
        </strong>
        <button
          type="button"
          className="text-stone-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 cursor-pointer"
          aria-label={`Xóa ${item.itemName || item.name}`}
          onClick={() => onRemove(item)}
          title="Xóa món"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
})

CartItemRow.displayName = 'CartItemRow'

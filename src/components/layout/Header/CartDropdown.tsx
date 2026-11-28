import React, { useRef, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShoppingBasket, Store, ArrowRight, X, PackageOpen, Minus, Plus, Loader2 } from 'lucide-react'
import { useAuth, useCartStore, cartCount, cartTotal } from '@/stores'
import { useCartOperations } from '@/features/cart/hooks/useCartOperations'
import { formatCurrency as money } from '@/utils'

interface CartDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export const CartDropdown: React.FC<CartDropdownProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const { user } = useAuth()

  // Guest cart from local store
  const localCart = useCartStore((s) => s.items)
  const changeLocalQuantity = useCartStore((s) => s.changeQuantity)
  const removeLocalItem = useCartStore((s) => s.remove)
  const localCount = cartCount(localCart)
  const localTotal = cartTotal(localCart)

  // DB cart operations (logged-in user)
  const {
    cart: dbCart,
    handleQuantityChange,
    isItemUpdating,
  } = useCartOperations()

  // Handle escape & outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Flattened items list
  const { items, totalCount, totalPrice, totalShops } = useMemo(() => {
    if (user) {
      const allShopCarts = dbCart?.shopCarts ?? []
      const flat = allShopCarts.flatMap((s) =>
        s.items.map((i) => ({
          id: i.cartItemId,
          rawItem: i,
          name: i.itemName || i.name || 'Nông sản',
          image: i.imageUrl,
          price: i.unitPrice,
          quantity: i.quantity,
          stock: i.stockQuantity ?? 999,
          shopName: s.shopName,
          shopId: s.shopId,
          unit: (i as any).unit || (i.itemType === 'BUILD_COMBO' || i.itemType === 'MYSTERY_BOX' ? 'combo' : 'kg'),
        }))
      )
      const count = flat.reduce((sum, i) => sum + i.quantity, 0)
      const total = flat.reduce((sum, i) => sum + i.price * i.quantity, 0)
      return {
        items: flat,
        totalCount: count,
        totalPrice: total,
        totalShops: allShopCarts.length,
      }
    }

    // Guest (chưa đăng nhập)
    return {
      items: [],
      totalCount: 0,
      totalPrice: 0,
      totalShops: 0,
    }
  }, [user, dbCart])

  if (!isOpen) return null

  const handleGoToCart = () => {
    onClose()
    navigate('/cart')
  }

  // Tăng/giảm số lượng nhanh từ Dropdown
  const handleUpdateItemQuantity = (item: (typeof items)[0], delta: number) => {
    if (user && item.rawItem) {
      handleQuantityChange(item.rawItem, delta)
    } else {
      if (item.quantity + delta <= 0) {
        removeLocalItem(String(item.id))
      } else {
        changeLocalQuantity(String(item.id), delta)
      }
    }
  }

  // Hiển thị tối đa 4 món gần nhất
  const visibleItems = items.slice(0, 4)
  const remainingCount = items.length - visibleItems.length

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] sm:w-96 max-w-[390px] bg-white rounded-2xl shadow-2xl border border-[#e2e7dd] overflow-hidden z-50 animate-fadeIn"
      role="dialog"
      aria-label="Giỏ nông sản xem nhanh"
    >
      {/* Header */}
      <div className="flex items-center justify-between py-3 px-4 border-b border-[#f1f4ed] bg-[#fafcf9]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#eef6ea] text-[#2b5619] flex items-center justify-center">
            <ShoppingBasket size={15} />
          </div>
          <h4 className="font-black text-xs text-[#1c2216]">Giỏ nông sản</h4>
          {totalCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#eef6ea] text-[#2b5619] font-bold text-[10px] border border-[#cbe3c3]">
              {totalCount} món
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full hover:bg-[#f0f4ed] text-[#717b6c] hover:text-[#1c2216] flex items-center justify-center transition-colors cursor-pointer"
          title="Đóng giỏ hàng xem nhanh"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body: Item List or Empty State */}
      <div className="max-h-[320px] overflow-y-auto divide-y divide-[#f5f8f2] p-2">
        {totalCount === 0 ? (
          <div className="py-8 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#f4f7f1] text-[#7c8b74] flex items-center justify-center mx-auto mb-2.5">
              <PackageOpen size={24} />
            </div>
            <h5 className="text-xs font-bold text-[#1c2216]">Giỏ hàng của bạn đang trống</h5>
            <p className="text-[11px] text-[#7e8779] mt-1 max-w-[220px] mx-auto leading-relaxed">
              Khám phá các loại rau củ, trái cây sạch chuẩn VietGAP mới thu hoạch hôm nay.
            </p>
            <Link
              to="/nong-san-tuoi"
              onClick={onClose}
              className="mt-3 inline-block px-4 py-1.5 rounded-full bg-[#2b5619] hover:bg-[#1e3f12] text-white text-[11px] font-bold transition-colors shadow-xs"
            >
              Dạo vườn nông sản
            </Link>
          </div>
        ) : (
          <>
            {visibleItems.map((item) => {
              const updating = user ? isItemUpdating(Number(item.id)) : false
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#fafbfa] transition-colors ${
                    updating ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl bg-[#f4f7f1] border border-[#e8ece3] overflow-hidden shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBasket size={18} className="text-[#8e9888]" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-[#1c2216] truncate" title={item.name}>
                      {item.name}
                    </h5>
                    <div className="text-[10px] text-[#6e7868] truncate flex items-center gap-1 mt-0.5">
                      <Store size={10} className="text-[#2b5619] shrink-0" />
                      <span className="truncate">{item.shopName}</span>
                    </div>
                    <div className="text-[11px] font-bold text-[#2b5619] mt-0.5 flex items-center gap-1">
                      <span>{money(item.price)}</span>
                      <span className="text-[#8e9888] font-normal">/ {item.unit}</span>
                    </div>
                  </div>

                  {/* Stepper + Subtotal */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="text-xs font-black text-[#1c2216]">
                      {money(item.price * item.quantity)}
                    </div>

                    {/* Bộ nút Tăng / Giảm (+) (-) trực tiếp trên Dropdown */}
                    <div className="inline-flex items-center rounded-lg border border-[#ded7c8] bg-[#f9f7f2] p-0.5 shadow-2xs">
                      <button
                        type="button"
                        disabled={updating}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpdateItemQuantity(item, -1)
                        }}
                        className="w-5 h-5 flex items-center justify-center text-[#555d4d] hover:text-black hover:bg-white rounded transition-colors disabled:opacity-40 cursor-pointer"
                        title="Giảm số lượng"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="w-6 text-center text-[11px] font-extrabold text-[#1f2818]">
                        {updating ? (
                          <Loader2 size={10} className="animate-spin mx-auto text-[#2b5619]" />
                        ) : (
                          item.quantity
                        )}
                      </span>
                      <button
                        type="button"
                        disabled={updating || item.quantity >= item.stock}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpdateItemQuantity(item, 1)
                        }}
                        className="w-5 h-5 flex items-center justify-center text-[#555d4d] hover:text-black hover:bg-white rounded transition-colors disabled:opacity-30 cursor-pointer"
                        title="Tăng số lượng"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {remainingCount > 0 && (
              <div className="py-2 text-center text-[11px] text-[#6e7868] font-medium bg-[#fafcfa] rounded-xl border border-dashed border-[#e2e7dd] mt-1">
                + {remainingCount} sản phẩm khác trong giỏ
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer (Chỉ hiện khi có sản phẩm) */}
      {totalCount > 0 && (
        <div className="p-3.5 bg-[#fafcf9] border-t border-[#f1f4ed] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6e7868]">
              Tạm tính ({totalCount} món từ {totalShops} vườn):
            </span>
            <strong className="text-sm font-black text-[#2b5619]">
              {money(totalPrice)}
            </strong>
          </div>

          <button
            type="button"
            onClick={handleGoToCart}
            className="w-full py-2.5 px-4 rounded-xl bg-[#2b5619] hover:bg-[#1e3f12] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <span>Vào Giỏ Hàng &amp; Thanh Toán</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

export default CartDropdown

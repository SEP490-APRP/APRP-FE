import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Minus,
  Plus,
  ShoppingBasket,
  Trash2,
  Store,
  ArrowRight,
  Loader2,
  LogIn,
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { allProducts, money } from '@/mocks/catalog'
import { LegacyProduceImage } from '@/features/product'
import {
  useMyCart,
  useUpdateCartItem,
  useRemoveCartItems,
} from '../hooks/useCartQueries'
import type { CartItemResponse } from '@/types/cart.types'
import { cartCount, cartTotal, useAuth, useCartStore, useUiStore } from '@/stores'

export function CartModal() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const closeCart = useUiStore((s) => s.closeCart)

  // Local mock store (fallback khi khách chưa đăng nhập)
  const localCart = useCartStore((s) => s.items)
  const changeLocalQuantity = useCartStore((s) => s.changeQuantity)
  const removeLocalItem = useCartStore((s) => s.remove)
  const localCount = cartCount(localCart)
  const localTotal = cartTotal(localCart)

  // DB Cart (khi đã đăng nhập)
  const { data: dbCart, isLoading: isCartLoading } = useMyCart()
  const updateMutation = useUpdateCartItem()
  const removeMutation = useRemoveCartItems()

  // Danh sách các cartItemId được chọn
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set())

  // Mặc định chọn tất cả các món khả dụng khi giỏ hàng tải xong
  useEffect(() => {
    if (dbCart?.shopCarts) {
      const allIds = new Set<number>()
      dbCart.shopCarts.forEach((shop) => {
        shop.items.forEach((item) => {
          if (item.available !== false) {
            allIds.add(item.cartItemId)
          }
        })
      })
      setSelectedItemIds(allIds)
    }
  }, [dbCart])

  const toggleSelect = (cartItemId: number) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev)
      if (next.has(cartItemId)) next.delete(cartItemId)
      else next.add(cartItemId)
      return next
    })
  }

  const toggleSelectShop = (shopItems: CartItemResponse[]) => {
    const availableItems = shopItems.filter((i) => i.available !== false)
    const isAllSelected = availableItems.every((i) => selectedItemIds.has(i.cartItemId))

    setSelectedItemIds((prev) => {
      const next = new Set(prev)
      availableItems.forEach((i) => {
        if (isAllSelected) next.delete(i.cartItemId)
        else next.add(i.cartItemId)
      })
      return next
    })
  }

  const handleQuantityChange = (item: CartItemResponse, delta: number) => {
    const newQty = item.quantity + delta
    if (newQty <= 0) {
      removeMutation.mutate({ cartItemIds: [item.cartItemId] })
    } else {
      updateMutation.mutate({ cartItemId: item.cartItemId, quantity: newQty })
    }
  }

  const handleRemove = (cartItemId: number) => {
    removeMutation.mutate({ cartItemIds: [cartItemId] })
    setSelectedItemIds((prev) => {
      const next = new Set(prev)
      next.delete(cartItemId)
      return next
    })
  }

  // Tính tổng tiền cho DB cart
  const { totalAmount, totalSelectedCount, totalAllCount } = useMemo(() => {
    if (!dbCart?.shopCarts) return { totalAmount: 0, totalSelectedCount: 0, totalAllCount: 0 }
    let sum = 0
    let selCount = 0
    let allCount = 0

    dbCart.shopCarts.forEach((shop) => {
      shop.items.forEach((item) => {
        allCount += item.quantity
        if (selectedItemIds.has(item.cartItemId)) {
          sum += item.unitPrice * item.quantity
          selCount += item.quantity
        }
      })
    })

    return { totalAmount: sum, totalSelectedCount: selCount, totalAllCount: allCount }
  }, [dbCart, selectedItemIds])

  const handleProceedToCheckout = () => {
    if (!user) {
      closeCart()
      navigate('/dang-nhap', { state: { from: { pathname: '/checkout' } } })
      return
    }

    if (selectedItemIds.size === 0) return

    closeCart()
    navigate('/checkout', {
      state: { selectedCartItemIds: Array.from(selectedItemIds) },
    })
  }

  // Render trường hợp người dùng CHƯA đăng nhập
  if (!user) {
    return (
      <Modal title="Giỏ nông sản của bạn" onClose={closeCart} wide>
        {localCount > 0 ? (
          <>
            <div className="cart-items">
              {allProducts
                .filter((p) => localCart[p.id])
                .map((p) => (
                  <div className="cart-item" key={p.id}>
                    <LegacyProduceImage src={p.image} alt={p.name} />
                    <div className="cart-item-info">
                      <h3>{p.name}</h3>
                      <p>
                        {money(p.price)}/{p.unit}
                      </p>
                      <div className="quantity-control">
                        <button
                          aria-label={`Giảm ${p.name}`}
                          onClick={() => changeLocalQuantity(p.id, -1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span>{localCart[p.id]}</span>
                        <button
                          disabled={localCart[p.id] >= p.stock}
                          aria-label={`Tăng ${p.name}`}
                          onClick={() => changeLocalQuantity(p.id, 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="cart-item-end">
                      <strong>{money(p.price * localCart[p.id])}</strong>
                      <button
                        aria-label={`Xóa ${p.name}`}
                        className="icon-button"
                        onClick={() => removeLocalItem(p.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="cart-total">
              <span>Tạm tính</span>
              <strong>{money(localTotal)}</strong>
            </div>

            <div className="mt-4 p-3 bg-[#f2f7ec] rounded-xl text-xs text-[#2b5619] flex items-center gap-2">
              <LogIn size={16} className="flex-shrink-0" />
              <span>Đăng nhập để đồng bộ giỏ hàng và đặt giao nông sản tươi tận nơi.</span>
            </div>

            <button
              onClick={() => {
                closeCart()
                navigate('/dang-nhap')
              }}
              className="btn btn-green w-full mt-3 flex items-center justify-center gap-2"
            >
              <span>Đăng nhập để thanh toán</span>
              <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <div className="empty-state">
            <ShoppingBasket size={44} />
            <h3>Giỏ của bạn đang trống</h3>
            <p>Chọn những nông sản ngon lành cho bữa ăn hôm nay.</p>
            <div className="flex gap-2 justify-center mt-3">
              <Link className="btn btn-green" to="/nong-san-tuoi" onClick={closeCart}>
                Khám phá nông sản
              </Link>
              <Link className="btn border border-[#cbd5bf]" to="/dang-nhap" onClick={closeCart}>
                Đăng nhập
              </Link>
            </div>
          </div>
        )}
      </Modal>
    )
  }

  // Render trường hợp người dùng ĐÃ đăng nhập
  return (
    <Modal title="Giỏ nông sản của bạn" onClose={closeCart} wide>
      {isCartLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-500">
          <Loader2 className="animate-spin text-[#4a7c2f]" size={36} />
          <span className="text-sm">Đang tải giỏ nông sản...</span>
        </div>
      ) : totalAllCount > 0 ? (
        <div className="space-y-4">
          {/* Danh sách các nhóm theo Shop */}
          <div className="cart-shops-container space-y-3 max-h-[58vh] overflow-y-auto pr-1">
            {dbCart?.shopCarts?.map((shop) => {
              const availableItems = shop.items.filter((i) => i.available !== false)
              const isShopAllSelected =
                availableItems.length > 0 &&
                availableItems.every((i) => selectedItemIds.has(i.cartItemId))

              const shopSubtotal = shop.items.reduce(
                (sum, i) =>
                  selectedItemIds.has(i.cartItemId) ? sum + i.unitPrice * i.quantity : sum,
                0,
              )

              return (
                <div
                  key={shop.shopId}
                  className="border border-[#e8ece3] rounded-2xl bg-white overflow-hidden shadow-xs"
                >
                  {/* Shop Header */}
                  <div className="bg-[#f7f9f5] px-3.5 py-2.5 flex items-center justify-between border-b border-[#e8ece3]">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-[#4a7c2f] border-gray-300 focus:ring-[#4a7c2f] cursor-pointer"
                        checked={isShopAllSelected}
                        onChange={() => toggleSelectShop(shop.items)}
                      />
                      <div className="flex items-center gap-1.5">
                        <Store size={15} className="text-[#4a7c2f]" />
                        <span className="font-semibold text-xs text-[#1c2e17]">
                          {shop.shopName}
                        </span>
                      </div>
                    </label>
                    <span className="text-[11px] text-[#6e6656] font-medium">
                      {shop.items.length} món
                    </span>
                  </div>

                  {/* Danh sách items của shop */}
                  <div className="p-3 divide-y divide-[#f2f5ec]">
                    {shop.items.map((item) => {
                      const isSelected = selectedItemIds.has(item.cartItemId)
                      const isAvailable = item.available !== false

                      return (
                        <div
                          key={item.cartItemId}
                          className="py-2.5 first:pt-1 last:pb-1 flex items-center gap-3 text-xs"
                        >
                          {/* Checkbox item */}
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded text-[#4a7c2f] border-gray-300 focus:ring-[#4a7c2f] cursor-pointer disabled:opacity-40"
                            checked={isSelected}
                            disabled={!isAvailable}
                            onChange={() => toggleSelect(item.cartItemId)}
                          />

                          {/* Ảnh sản phẩm */}
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0 border border-[#e8ece3]">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.itemName || item.name || 'Sản phẩm'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <ShoppingBasket size={18} />
                              </div>
                            )}
                          </div>

                          {/* Thông tin sản phẩm */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-[#1c2e17] text-xs leading-tight line-clamp-1">
                              {item.itemName || item.name}
                            </h4>
                            <div className="text-[#6e6656] text-[11px] mt-0.5">
                              {money(item.unitPrice)}
                            </div>
                            {!isAvailable && (
                              <span className="inline-block text-[10px] text-red-500 font-medium mt-0.5">
                                Hết hàng hoặc tạm ngưng
                              </span>
                            )}
                          </div>

                          {/* Bộ tăng giảm số lượng */}
                          <div className="quantity-control flex-shrink-0" style={{ marginTop: 0 }}>
                            <button
                              aria-label="Giảm"
                              disabled={updateMutation.isPending || removeMutation.isPending}
                              onClick={() => handleQuantityChange(item, -1)}
                            >
                              <Minus size={12} />
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              aria-label="Tăng"
                              disabled={
                                updateMutation.isPending ||
                                (item.stockQuantity !== undefined &&
                                  item.quantity >= item.stockQuantity)
                              }
                              onClick={() => handleQuantityChange(item, 1)}
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          {/* Thành tiền & Nút xóa */}
                          <div className="text-right flex flex-col items-end gap-1 min-w-[70px]">
                            <strong className="text-xs text-[#326318] font-bold">
                              {money(item.unitPrice * item.quantity)}
                            </strong>
                            <button
                              className="text-stone-400 hover:text-red-500 transition-colors p-1"
                              aria-label={`Xóa ${item.itemName || item.name}`}
                              onClick={() => handleRemove(item.cartItemId)}
                              title="Xóa món"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Subtotal shop */}
                  {shopSubtotal > 0 && (
                    <div className="bg-[#fcfdfa] px-3.5 py-1.5 border-t border-[#f0f3ea] flex justify-between items-center text-[11px]">
                      <span className="text-[#6e6656]">Tạm tính shop:</span>
                      <strong className="text-[#2b5619] font-semibold">{money(shopSubtotal)}</strong>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Tổng tiền & Nút thanh toán */}
          <div className="pt-2 border-t border-[#ebe6da]">
            <div className="cart-total" style={{ marginTop: 4 }}>
              <div className="flex flex-col">
                <span className="text-xs text-[#6e6656]">
                  Đã chọn {totalSelectedCount} món
                </span>
                <span className="font-medium text-sm text-[#1c2e17]">Tổng tạm tính</span>
              </div>
              <strong className="text-xl text-[#326318] font-bold">{money(totalAmount)}</strong>
            </div>

            <p className="subtle text-[11px] text-[#6e6656] mt-1">
              Phí giao hàng và mã giảm giá sẽ được áp dụng tại bước thanh toán.
            </p>

            <button
              disabled={selectedItemIds.size === 0}
              onClick={handleProceedToCheckout}
              className="btn btn-green w-full mt-3 flex items-center justify-center gap-2 font-bold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Tiến hành thanh toán</span>
              <ArrowRight size={16} />
            </button>

            <div className="text-center mt-2">
              <Link
                to="/cart"
                onClick={closeCart}
                className="text-xs text-[#4a7c2f] hover:underline font-medium"
              >
                Xem trang giỏ hàng chi tiết &rarr;
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state py-8">
          <ShoppingBasket size={44} className="mx-auto text-stone-300 mb-2" />
          <h3 className="text-base font-bold text-[#1c2e17]">Giỏ nông sản của bạn đang trống</h3>
          <p className="text-xs text-[#6e6656] mt-1">
            Chọn những nông sản xanh tươi cho bữa ăn hôm nay nhé.
          </p>
          <div className="mt-4">
            <Link className="btn btn-green text-xs" to="/nong-san-tuoi" onClick={closeCart}>
              Khám phá nông sản
            </Link>
          </div>
        </div>
      )}
    </Modal>
  )
}

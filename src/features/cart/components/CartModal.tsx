import React, { useState, useEffect, useMemo, useRef } from 'react'
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
  X,
  Sparkles,
} from 'lucide-react'
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
  const drawerRef = useRef<HTMLDivElement>(null)

  // Khóa scroll body và bắt phím Escape khi drawer mở
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCart()
      }
    }
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeCart])

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

  // Lấy danh sách tất cả các ID khả dụng
  const allAvailableItemIds = useMemo(() => {
    if (!dbCart?.shopCarts) return []
    const ids: number[] = []
    dbCart.shopCarts.forEach((shop) => {
      shop.items.forEach((item) => {
        if (item.available !== false) {
          ids.push(item.cartItemId)
        }
      })
    })
    return ids
  }, [dbCart])

  const isAllMasterSelected =
    allAvailableItemIds.length > 0 &&
    allAvailableItemIds.every((id) => selectedItemIds.has(id))

  const toggleSelectAll = () => {
    if (isAllMasterSelected) {
      setSelectedItemIds(new Set())
    } else {
      setSelectedItemIds(new Set(allAvailableItemIds))
    }
  }

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
    const isAllSelected =
      availableItems.length > 0 &&
      availableItems.every((i) => selectedItemIds.has(i.cartItemId))

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* 1. Backdrop làm mờ có animation */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity animate-fadeIn"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* 2. Slide-over Drawer Panel */}
      <div
        ref={drawerRef}
        className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10"
      >
        <div className="w-screen max-w-[460px] bg-[#fbf9f4] shadow-2xl flex flex-col border-l border-[#ebe5d6] animate-slideInRight">
          
          {/* ==================================================== */}
          {/* HEADER CỐ ĐỊNH (Sticky Top Header)                  */}
          {/* ==================================================== */}
          <div className="shrink-0 bg-white border-b border-[#e9e3d5] px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#eaf4e0] text-[#326318] flex items-center justify-center">
                  <ShoppingBasket size={20} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#1a2315] leading-tight">
                    Giỏ nông sản
                  </h2>
                  <p className="text-xs text-[#6e7766]">
                    {user
                      ? totalAllCount > 0
                        ? `${totalAllCount} sản phẩm trong giỏ`
                        : 'Chưa có sản phẩm'
                      : localCount > 0
                        ? `${localCount} món tạm tính`
                        : 'Chưa có sản phẩm'}
                  </p>
                </div>
              </div>

              {/* Nút đóng X */}
              <button
                type="button"
                onClick={closeCart}
                className="w-8 h-8 rounded-full bg-[#f4f0e6] hover:bg-[#e7e0d2] text-[#4f5746] flex items-center justify-center transition-colors"
                aria-label="Đóng giỏ hàng"
              >
                <X size={18} />
              </button>
            </div>


            {/* Master Select All Checkbox (chỉ hiện khi đã đăng nhập và có sản phẩm) */}
            {user && totalAllCount > 0 && (
              <div className="mt-3 pt-2.5 border-t border-[#f0ebe0] flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-[#293520]">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-[#326318] focus:ring-[#326318] border-stone-300 cursor-pointer"
                    checked={isAllMasterSelected}
                    onChange={toggleSelectAll}
                  />
                  <span>Chọn tất cả ({totalAllCount} món)</span>
                </label>

                {selectedItemIds.size > 0 && (
                  <span className="text-[11px] text-[#326318] font-bold bg-[#e8f3de] px-2 py-0.5 rounded-full">
                    Đã chọn {totalSelectedCount} món
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ==================================================== */}
          {/* BODY CUỘN ĐỘC LẬP (Scrollable Middle Body)          */}
          {/* ==================================================== */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3.5 overscroll-contain">
            {/* Trường hợp: Khách CHƯA đăng nhập */}
            {!user ? (
              localCount > 0 ? (
                <>
                  <div className="bg-white rounded-2xl border border-[#e8e2d4] p-3 divide-y divide-[#f2ece0] shadow-xs">
                    {allProducts
                      .filter((p) => localCart[p.id])
                      .map((p) => (
                        <div key={p.id} className="py-3 first:pt-1 last:pb-1 flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-[#eee8dc]">
                            <LegacyProduceImage src={p.image} alt={p.name} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-xs text-[#1c2e17] truncate">{p.name}</h4>
                            <p className="text-[11px] text-[#6d7567] mt-0.5">
                              {money(p.price)} / {p.unit}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="inline-flex items-center rounded-lg border border-[#ded7c8] bg-[#f9f7f2] px-1 py-0.5">
                                <button
                                  type="button"
                                  className="w-5 h-5 flex items-center justify-center text-[#555d4d] hover:text-black"
                                  onClick={() => changeLocalQuantity(p.id, -1)}
                                  aria-label="Giảm"
                                >
                                  <Minus size={11} />
                                </button>
                                <span className="px-2 text-xs font-bold text-[#1f2818]">
                                  {localCart[p.id]}
                                </span>
                                <button
                                  type="button"
                                  className="w-5 h-5 flex items-center justify-center text-[#555d4d] hover:text-black disabled:opacity-40"
                                  disabled={localCart[p.id] >= p.stock}
                                  onClick={() => changeLocalQuantity(p.id, 1)}
                                  aria-label="Tăng"
                                >
                                  <Plus size={11} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                            <strong className="text-xs font-extrabold text-[#326318]">
                              {money(p.price * localCart[p.id])}
                            </strong>
                            <button
                              type="button"
                              className="text-stone-400 hover:text-red-500 p-1 transition-colors"
                              onClick={() => removeLocalItem(p.id)}
                              aria-label={`Xóa ${p.name}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Card gợi ý đăng nhập */}
                  <div className="p-3.5 bg-[#f0f6eb] rounded-2xl border border-[#dce8d2] text-xs text-[#2c5b14] flex items-start gap-2.5">
                    <LogIn size={18} className="shrink-0 mt-0.5 text-[#326318]" />
                    <div>
                      <strong className="font-bold block mb-0.5">Đăng nhập tài khoản</strong>
                      <span className="text-[11px] leading-relaxed text-[#40682b]">
                        Đăng nhập để tự động lưu giỏ hàng, áp mã ưu đãi và đặt giao nông sản tận nhà.
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#efe9dc] text-stone-400 mx-auto flex items-center justify-center mb-3">
                    <ShoppingBasket size={32} />
                  </div>
                  <h3 className="font-bold text-sm text-[#1e2717]">Giỏ hàng của bạn đang trống</h3>
                  <p className="text-xs text-[#6e7766] max-w-xs mx-auto mt-1">
                    Hãy dạo quanh vườn nông sản xanh tươi và chọn những món ngon cho gia đình nhé.
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-2">
                    <Link
                      to="/nong-san-tuoi"
                      onClick={closeCart}
                      className="px-4 py-2 rounded-xl bg-[#326318] text-white font-bold text-xs hover:bg-[#254b12] shadow-sm transition-all"
                    >
                      Khám phá nông sản
                    </Link>
                    <Link
                      to="/dang-nhap"
                      onClick={closeCart}
                      className="px-4 py-2 rounded-xl border border-[#d6cfbe] bg-white text-[#2a3520] font-bold text-xs hover:bg-[#f6f2e8] transition-all"
                    >
                      Đăng nhập
                    </Link>
                  </div>
                </div>
              )
            ) : isCartLoading ? (
              /* Loading Spinner khi tải DB cart */
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-500">
                <Loader2 className="animate-spin text-[#326318]" size={36} />
                <span className="text-xs font-medium text-[#4f5846]">Đang tải giỏ nông sản của bạn...</span>
              </div>
            ) : totalAllCount > 0 ? (
              /* Danh sách sản phẩm gom nhóm theo từng Shop */
              dbCart?.shopCarts?.map((shop) => {
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
                    className="border border-[#e6e0d2] rounded-2xl bg-white overflow-hidden shadow-xs"
                  >
                    {/* Header Nhà Vườn */}
                    <div className="bg-[#f7f5ed] px-3.5 py-2.5 flex items-center justify-between border-b border-[#e9e3d5]">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-[#326318] border-stone-300 focus:ring-[#326318] cursor-pointer"
                          checked={isShopAllSelected}
                          onChange={() => toggleSelectShop(shop.items)}
                        />
                        <div className="flex items-center gap-1.5">
                          <Store size={14} className="text-[#326318]" />
                          <span className="font-bold text-xs text-[#1c2e17]">
                            {shop.shopName}
                          </span>
                        </div>
                      </label>
                      <span className="text-[11px] text-[#717869] font-medium">
                        {shop.items.length} món
                      </span>
                    </div>

                    {/* Danh sách items của shop */}
                    <div className="p-3 divide-y divide-[#f5f1e8]">
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
                              className="w-4 h-4 rounded text-[#326318] border-stone-300 focus:ring-[#326318] cursor-pointer disabled:opacity-40 shrink-0"
                              checked={isSelected}
                              disabled={!isAvailable}
                              onChange={() => toggleSelect(item.cartItemId)}
                            />

                            {/* Ảnh sản phẩm */}
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-[#e8ece3]">
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

                            {/* Thông tin món */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-[#1c2e17] text-xs leading-snug line-clamp-2">
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

                              {/* Bộ tăng giảm số lượng */}
                              <div className="mt-1.5 flex items-center gap-2">
                                <div className="inline-flex items-center rounded-lg border border-[#ded7c8] bg-[#f9f7f2] px-1 py-0.5">
                                  <button
                                    type="button"
                                    className="w-5 h-5 flex items-center justify-center text-[#555d4d] hover:text-black disabled:opacity-40"
                                    aria-label="Giảm"
                                    disabled={updateMutation.isPending || removeMutation.isPending}
                                    onClick={() => handleQuantityChange(item, -1)}
                                  >
                                    <Minus size={11} />
                                  </button>
                                  <span className="px-2 text-xs font-bold text-[#1f2818]">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    className="w-5 h-5 flex items-center justify-center text-[#555d4d] hover:text-black disabled:opacity-40"
                                    aria-label="Tăng"
                                    disabled={
                                      updateMutation.isPending ||
                                      (item.stockQuantity !== undefined &&
                                        item.quantity >= item.stockQuantity)
                                    }
                                    onClick={() => handleQuantityChange(item, 1)}
                                  >
                                    <Plus size={11} />
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

                    {/* Subtotal riêng của shop */}
                    {shopSubtotal > 0 && (
                      <div className="bg-[#fcfbf7] px-3.5 py-1.5 border-t border-[#f1ebe0] flex justify-between items-center text-[11px]">
                        <span className="text-[#6e6656]">Tạm tính shop:</span>
                        <strong className="text-[#326318] font-bold">{money(shopSubtotal)}</strong>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              /* Empty state cho user đã đăng nhập */
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#efe9dc] text-stone-400 mx-auto flex items-center justify-center mb-3">
                  <ShoppingBasket size={32} />
                </div>
                <h3 className="font-bold text-sm text-[#1e2717]">Giỏ nông sản của bạn đang trống</h3>
                <p className="text-xs text-[#6e7766] max-w-xs mx-auto mt-1">
                  Chọn những nông sản xanh tươi cho bữa ăn hôm nay nhé.
                </p>
                <div className="mt-5">
                  <Link
                    to="/nong-san-tuoi"
                    onClick={closeCart}
                    className="inline-block px-5 py-2.5 rounded-xl bg-[#326318] text-white font-bold text-xs hover:bg-[#254b12] shadow-sm transition-all"
                  >
                    Khám phá nông sản
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ==================================================== */}
          {/* FOOTER CỐ ĐỊNH (Sticky Bottom Checkout Footer)      */}
          {/* ==================================================== */}
          {(!user ? localCount > 0 : totalAllCount > 0) && (
            <div className="shrink-0 bg-white border-t border-[#e9e3d5] p-4 sm:p-5 shadow-[0_-8px_24px_rgba(0,0,0,0.05)]">
              {/* Tóm tắt tiền */}
              <div className="flex items-end justify-between mb-2">
                <div>
                  <span className="text-[11px] text-[#6e7766] block">
                    {!user
                      ? `Tổng cộng ${localCount} món`
                      : `Đã chọn ${totalSelectedCount} / ${totalAllCount} món`}
                  </span>
                  <span className="font-bold text-sm text-[#1a2315]">Tổng tạm tính</span>
                </div>
                <strong className="text-xl font-extrabold text-[#326318] tracking-tight">
                  {money(!user ? localTotal : totalAmount)}
                </strong>
              </div>

              <p className="text-[11px] text-[#788070] mb-3 leading-tight">
                Phí giao hàng & voucher ưu đãi sẽ được áp dụng tại bước thanh toán.
              </p>

              {/* Nút bấm thanh toán chính */}
              {!user ? (
                <button
                  type="button"
                  onClick={() => {
                    closeCart()
                    navigate('/dang-nhap')
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <LogIn size={16} />
                  <span>Đăng nhập để thanh toán</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={selectedItemIds.size === 0}
                  onClick={handleProceedToCheckout}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Tiến hành thanh toán ({money(totalAmount)})</span>
                  <ArrowRight size={16} />
                </button>
              )}

              {/* Link xem giỏ hàng chi tiết */}
              <div className="text-center mt-2.5">
                <Link
                  to="/cart"
                  onClick={closeCart}
                  className="text-xs text-[#4a7c2f] hover:text-[#2a5015] hover:underline font-semibold inline-flex items-center gap-1"
                >
                  <span>Xem trang giỏ hàng chi tiết</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export const CartDrawer = CartModal

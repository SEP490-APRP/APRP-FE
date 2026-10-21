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
  ChevronLeft,
  Minimize2,
} from 'lucide-react'
import { allProducts, money, type Product } from '@/mocks/catalog'
import { LegacyProduceImage } from '@/features/product'
import { useAddToCart } from '../hooks/useAddToCart'
import { useCartOperations } from '../hooks/useCartOperations'
import { CartItemRow } from './CartItemRow'
import { CartDeleteModal } from './CartDeleteModal'
import { cartCount, cartTotal, useAuth, useCartStore, useUiStore } from '@/stores'

const DETAIL_IDS: Record<string, number> = {
  carrot: 702,
  tomato: 704,
  pomelo: 703,
  potato: 701,
  cabbage: 702,
  spinach: 702,
  pumpkin: 705,
}

export function CartModal() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const closeCart = useUiStore((s) => s.closeCart)
  const drawerRef = useRef<HTMLDivElement>(null)

  // Bắt phím Escape để đóng giỏ hàng (Không khóa scroll của body để người dùng thoải mái lướt trang web bên cạnh)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCart()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeCart])

  // Trạng thái thu nhỏ giỏ hàng thành Pill nổi ở góc màn hình khi lướt web
  const [isMinimized, setIsMinimized] = useState(false)
  const addToCartMutation = useAddToCart()
  const [addingSuggestId, setAddingSuggestId] = useState<string | null>(null)

  // Local mock store (fallback khi khách chưa đăng nhập)
  const localCart = useCartStore((s) => s.items)
  const changeLocalQuantity = useCartStore((s) => s.changeQuantity)
  const removeLocalItem = useCartStore((s) => s.remove)
  const localCount = cartCount(localCart)
  const localTotal = cartTotal(localCart)

  // Hook vận hành giỏ hàng (khi đã đăng nhập)
  const {
    cart: dbCart,
    isLoading: isCartLoading,
    selectedItemIds,
    toggleSelect,
    toggleSelectShop,
    toggleSelectAll,
    isAllMasterSelected,
    totalAmount,
    totalSelectedCount,
    totalAllCount,
    editingQuantities,
    isItemUpdating,
    handleQuantityChange,
    handleDirectQuantityChange,
    handleCommitQuantity,
    commitAllPendingQuantities,
    handleRemove,
    deletingItem,
    setDeletingItem,
    confirmDeleteItem,
    isRemoving,
    isUpdating,
  } = useCartOperations()

  // Danh sách các nông sản gợi ý mua thêm chưa có trong giỏ hàng
  const suggestedProducts = useMemo(() => {
    const currentItemNames = new Set(
      dbCart?.shopCarts?.flatMap((s) =>
        s.items.map((i) => (i.itemName || i.name || '').toLowerCase()),
      ) ?? [],
    )
    return allProducts
      .filter((p) => !currentItemNames.has(p.name.toLowerCase()))
      .slice(0, 4)
  }, [dbCart])

  const handleQuickAdd = async (p: Product) => {
    setAddingSuggestId(p.id)
    try {
      if (user) {
        const targetId = DETAIL_IDS[p.id] ?? 702
        await addToCartMutation.mutateAsync({
          productId: targetId,
          itemId: targetId,
          itemType: 'PRODUCT',
          quantity: 1,
        })
        useUiStore.getState().showToast(`Đã thêm ${p.name} vào giỏ hàng!`)
      } else {
        changeLocalQuantity(p.id, 1)
        useUiStore.getState().showToast(`Đã thêm ${p.name} vào giỏ hàng!`)
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.response?.data?.message || err?.message || 'Không thể thêm sản phẩm.'
      useUiStore.getState().showToast(msg)
    } finally {
      setAddingSuggestId(null)
    }
  }

  const handleProceedToCheckout = () => {
    commitAllPendingQuantities()
    if (!user) {
      closeCart()
      navigate('/dang-nhap', { state: { from: { pathname: '/checkout' } } })
      return
    }

    if (isUpdating || isRemoving) return
    if (selectedItemIds.size === 0) return

    closeCart()
    navigate('/checkout', {
      state: { selectedCartItemIds: Array.from(selectedItemIds) },
    })
  }

  // Khi đang ở chế độ thu nhỏ: hiển thị Floating Pill ở góc dưới bên phải màn hình
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 px-4 py-3 bg-[#1e3e14] hover:bg-[#254b17] text-white rounded-2xl shadow-2xl border border-white/20 hover:scale-105 active:scale-95 transition-all duration-200 group cursor-pointer"
        >
          <div className="relative">
            <ShoppingBasket size={22} className="text-[#a5e075]" />
            {(user ? totalAllCount : localCount) > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-[#1e3e14]">
                {user ? totalAllCount : localCount}
              </span>
            )}
          </div>
          <div className="text-left pr-1">
            <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
              <span>Giỏ nông sản</span>
              <span className="text-[10px] text-[#a5e075] bg-white/10 px-1.5 py-0.5 rounded-full">
                {user ? `${totalSelectedCount} món` : `${localCount} món`}
              </span>
            </div>
            <div className="text-sm font-extrabold text-[#d2f59e] leading-tight">
              {money(user ? totalAmount : localTotal)}
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/80 group-hover:bg-white/20 transition-colors">
            <ChevronLeft size={16} />
          </div>
        </button>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 pointer-events-none flex justify-end"
      role="region"
      aria-label="Giỏ hàng nông sản"
    >
      {/* Slide-over Drawer Panel (không có backdrop làm mờ, cho phép lướt trang bên cạnh) */}
      <div
        ref={drawerRef}
        className="w-screen max-w-[420px] h-full bg-[#fbf9f4] shadow-[-16px_0_40px_rgba(0,0,0,0.14)] flex flex-col border-l border-[#e4ded0] pointer-events-auto animate-slideInRight"
      >
        {/* ==================================================== */}
        {/* HEADER CỐ ĐỊNH (Sticky Top Header)                  */}
        {/* ==================================================== */}
        <div className="shrink-0 bg-white border-b border-[#e9e3d5] px-4 sm:px-5 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#eaf4e0] text-[#326318] flex items-center justify-center shrink-0">
                <ShoppingBasket size={20} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#1a2315] leading-tight">
                  Giỏ nông sản
                </h2>
                <p className="text-xs text-[#6e7766] mt-0.5">
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

            {/* Cụm nút hành động header: Thu nhỏ & Đóng */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="w-8 h-8 rounded-full bg-[#f4f0e6] hover:bg-[#e7e0d2] text-[#4f5746] flex items-center justify-center transition-colors cursor-pointer"
                title="Thu nhỏ giỏ hàng để lướt xem toàn trang"
                aria-label="Thu nhỏ giỏ hàng"
              >
                <Minimize2 size={14} />
              </button>
              <button
                type="button"
                onClick={closeCart}
                className="w-8 h-8 rounded-full bg-[#f4f0e6] hover:bg-[#e7e0d2] text-[#4f5746] flex items-center justify-center transition-colors cursor-pointer"
                title="Đóng giỏ hàng"
                aria-label="Đóng giỏ hàng"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Master Select All Checkbox (khi đã đăng nhập và có sản phẩm) */}
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
          {/* 1. Trường hợp: Khách CHƯA đăng nhập */}
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
                                className="w-5 h-5 flex items-center justify-center text-[#555d4d] hover:text-black cursor-pointer"
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
                                className="w-5 h-5 flex items-center justify-center text-[#555d4d] hover:text-black disabled:opacity-40 cursor-pointer"
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
                            className="text-stone-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                            onClick={() => removeLocalItem(p.id)}
                            aria-label={`Xóa ${p.name}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

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
            /* 2. Loading Spinner */
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-500">
              <Loader2 className="animate-spin text-[#326318]" size={36} />
              <span className="text-xs font-medium text-[#4f5846]">Đang tải giỏ nông sản của bạn...</span>
            </div>
          ) : totalAllCount > 0 ? (
            /* 3. Danh sách sản phẩm gom nhóm theo Nhà Vườn */
            <>
              {dbCart?.shopCarts?.map((shop) => {
                const availableItems = shop.items.filter(
                  (i) => i.available !== false && (i as any).isAvailable !== false,
                )
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
                      {shop.items.map((item) => (
                        <CartItemRow
                          key={item.cartItemId}
                          item={item}
                          compact={true}
                          isSelected={selectedItemIds.has(item.cartItemId)}
                          isUpdating={isItemUpdating(item.cartItemId)}
                          editingQuantity={editingQuantities[item.cartItemId]}
                          onToggleSelect={toggleSelect}
                          onQuantityChange={handleQuantityChange}
                          onDirectQuantityChange={handleDirectQuantityChange}
                          onCommitQuantity={handleCommitQuantity}
                          onRemove={handleRemove}
                        />
                      ))}
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
              })}

              {/* Gợi ý mua thêm nông sản đang vào mùa */}
              {suggestedProducts.length > 0 && (
                <div className="pt-2 pb-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-[#1a2315] flex items-center gap-1.5">
                      <span>Gợi ý nông sản mua kèm</span>
                    </h4>
                    <span className="text-[10px] text-[#6e7766]">Đang vào mùa</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {suggestedProducts.map((p) => {
                      const isAdding = addingSuggestId === p.id
                      return (
                        <div
                          key={p.id}
                          className="p-2 rounded-xl bg-white border border-[#e8e2d4] hover:border-[#326318]/40 transition-all flex flex-col justify-between shadow-2xs"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-[#eee8dc]">
                              <LegacyProduceImage src={p.image} alt={p.name} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="font-semibold text-[11px] text-[#1c2e17] truncate leading-tight">
                                {p.name}
                              </h5>
                              <span className="text-[10px] font-bold text-[#326318] block mt-0.5">
                                {money(p.price)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isAdding}
                            onClick={() => handleQuickAdd(p)}
                            className="w-full py-1.5 rounded-lg bg-[#f0f6eb] hover:bg-[#326318] text-[#326318] hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isAdding ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Plus size={12} />
                            )}
                            <span>{isAdding ? 'Đang thêm...' : 'Thêm nhanh'}</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* 4. Empty state cho user đã đăng nhập */
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

            {!user ? (
              <button
                type="button"
                onClick={() => {
                  closeCart()
                  navigate('/dang-nhap')
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <LogIn size={16} />
                <span>Đăng nhập để thanh toán</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={selectedItemIds.size === 0 || isUpdating || isRemoving}
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Tiến hành thanh toán ({money(totalAmount)})</span>
                <ArrowRight size={16} />
              </button>
            )}

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

      {/* Modal xác nhận xóa sản phẩm khỏi giỏ hàng */}
      <CartDeleteModal
        item={deletingItem}
        isDeleting={isRemoving}
        onConfirm={confirmDeleteItem}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  )
}

export const CartDrawer = CartModal

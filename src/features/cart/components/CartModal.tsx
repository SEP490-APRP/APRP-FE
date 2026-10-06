import { Minus, Plus, ShoppingBasket, Trash2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { allProducts, money } from '@/mocks/catalog'
import { LegacyProduceImage } from '@/features/product'
import { cartCount, cartTotal, useCartStore, useUiStore } from '@/stores'

/** Giỏ hàng dạng modal (tách nguyên văn từ App.tsx). */
export function CartModal() {
  const cart = useCartStore((s) => s.items)
  const changeQuantity = useCartStore((s) => s.changeQuantity)
  const remove = useCartStore((s) => s.remove)
  const closeCart = useUiStore((s) => s.closeCart)
  const showInfo = useUiStore((s) => s.showInfo)
  const count = cartCount(cart)
  const total = cartTotal(cart)

  return (
    <Modal title="Giỏ nông sản của bạn" onClose={closeCart} wide>
      {count ? (
        <>
          <div className="cart-items">
            {allProducts
              .filter((p) => cart[p.id])
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
                        onClick={() => changeQuantity(p.id, -1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span>{cart[p.id]}</span>
                      <button
                        disabled={cart[p.id] >= p.stock}
                        aria-label={`Tăng ${p.name}`}
                        onClick={() => changeQuantity(p.id, 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-end">
                    <strong>{money(p.price * cart[p.id])}</strong>
                    <button
                      aria-label={`Xóa ${p.name}`}
                      className="icon-button"
                      onClick={() => remove(p.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
          <div className="cart-total">
            <span>Tạm tính</span>
            <strong>{money(total)}</strong>
          </div>
          <p className="subtle">
            Phí giao hàng chưa được tính. Đây là giỏ hàng trải nghiệm, chưa tạo đơn thực tế.
          </p>
          <button className="btn btn-green w-full mt-4" onClick={() => showInfo('Thanh toán')}>
            Tiếp tục thanh toán
          </button>
        </>
      ) : (
        <div className="empty-state">
          <ShoppingBasket size={44} />
          <h3>Giỏ của bạn đang trống</h3>
          <p>Chọn những nông sản ngon lành cho bữa ăn hôm nay.</p>
          <a className="btn btn-green" href="#/nong-san-tuoi" onClick={closeCart}>
            Khám phá nông sản
          </a>
        </div>
      )}
    </Modal>
  )
}

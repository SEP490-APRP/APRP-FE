import { useState } from 'react'
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { CheckCircle2, Info } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Modal from '@/components/ui/Modal'
import { allProducts, type Cart } from '@/mocks/catalog'
import { CartModal } from '@/features/cart'
import { cartCount, useAuth, useCartStore, useUiStore } from '@/stores'

export type StorefrontContext = {
  cart: Cart
  query: string
  setQuery: (query: string) => void
  /** Thêm 1 đơn vị sản phẩm catalog vào giỏ, báo toast. */
  onAdd: (id: string) => void
  onInfo: (title: string) => void
}

export const useStorefront = () => useOutletContext<StorefrontContext>()

/** Mục menu đang active trên Header (giữ đúng quy tắc của App.tsx cũ). */
function headerRoute(pathname: string): string {
  if (/^\/cua-hang\/[^/]+\/voucher/.test(pathname)) return pathname
  if (/^\/(nong-san-tuoi|san-pham|cua-hang)/.test(pathname)) return '/nong-san-tuoi'
  if (pathname.startsWith('/combo-tui-mu')) return '/combo-tui-mu'
  if (pathname.startsWith('/cong-nghe-ai')) return '/cong-nghe-ai'
  if (pathname.startsWith('/cau-chuyen-nong-dan')) return '/cau-chuyen-nong-dan'
  if (/^\/(dang-nhap|dang-ky)/.test(pathname)) return '/dang-nhap'
  return pathname
}

export default function StorefrontLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const cart = useCartStore((s) => s.items)
  const changeQuantity = useCartStore((s) => s.changeQuantity)
  const { toast, info, cartOpen, showToast, hideToast, showInfo, hideInfo, openCart } = useUiStore()
  const [query, setQuery] = useState('')

  const onAdd = (id: string) => {
    const product = allProducts.find((p) => p.id === id)
    if (!product) {
      showToast('Sản phẩm này chưa mở bán trực tuyến.')
      return
    }
    if ((cart[id] ?? 0) >= product.stock) {
      showToast(`Bạn đã chọn tối đa ${product.stock} ${product.unit} ${product.name}.`)
      return
    }
    changeQuantity(id, 1)
    showToast(`Đã thêm ${product.name} vào giỏ`)
  }

  const handleLogout = () => {
    logout()
    showToast('Bạn đã đăng xuất khỏi hệ thống CapNong.')
    navigate('/')
  }

  const isFresh = pathname.startsWith('/nong-san-tuoi')
  const context: StorefrontContext = { cart, query, setQuery, onAdd, onInfo: showInfo }

  return (
    <>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Đến nội dung chính
      </a>

      <Header
        route={headerRoute(pathname)}
        count={cartCount(cart)}
        user={user}
        onLogout={handleLogout}
        onSearch={(s) => {
          setQuery(s)
          if (isFresh) document.getElementById('san-pham')?.scrollIntoView()
          else navigate('/nong-san-tuoi/san-pham')
        }}
        onCart={openCart}
        onInfo={showInfo}
      />

      <main id="main-content" tabIndex={-1}>
        <Outlet context={context} />
      </main>

      <Footer onInfo={showInfo} />

      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          <span>{toast}</span>
          <button
            onClick={() => {
              hideToast()
              openCart()
            }}
          >
            Xem giỏ
          </button>
        </div>
      )}

      {cartOpen && <CartModal />}

      {info && (
        <Modal title={info} onClose={hideInfo}>
          <div className="info-content">
            <Info size={32} />
            <p>
              Đây là giao diện trải nghiệm CapNong. Tính năng <strong>{info.toLowerCase()}</strong>{' '}
              chưa kết nối dịch vụ thực tế.
            </p>
            <p>
              Bạn có thể thử tìm kiếm, lọc nông sản, chọn combo, đăng ký vai trò
              Buyer/Shop/Shipper/Admin và quản lý giỏ hàng ngay trên website.
            </p>
            <button className="btn btn-green" onClick={hideInfo}>
              Đã hiểu
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

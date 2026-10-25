import { useState, useEffect, Suspense } from 'react'
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { CheckCircle2, Info } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Modal from '@/components/ui/Modal'
import { allProducts, type Cart } from '@/mocks/catalog'
import { CartModal, useAddToCart, useMyCart } from '@/features/cart'
import { cartCount, useAuth, useCartStore, useUiStore } from '@/stores'
import { authService } from '@/services'
import { PageLoading } from './RootLayout'
import { FloatingChatWidget } from '@/components/chat/FloatingChatWidget'

export type StorefrontContext = {
  cart: Cart
  query: string
  setQuery: (query: string) => void
  /** Thêm 1 đơn vị sản phẩm/combo/túi mù vào giỏ, báo toast. */
  onAdd: (id: string | number, itemType?: string) => void
  onInfo: (title: string) => void
}

export const useStorefront = () => useOutletContext<StorefrontContext>()

/** Mục menu đang active trên Header (giữ đúng quy tắc của App.tsx cũ). */
function headerRoute(pathname: string): string {
  if (/^\/cua-hang\/[^/]+\/voucher/.test(pathname)) return pathname
  if (/^\/(nong-san-tuoi|san-pham|cua-hang)/.test(pathname)) return '/nong-san-tuoi'
  if (pathname.startsWith('/combo-tui-mu')) return '/combo-tui-mu'
  if (pathname.startsWith('/cong-nghe-ai')) return '/cong-nghe-ai'
  if (pathname.startsWith('/ke-hoach-an-uong')) return '/ke-hoach-an-uong'
  if (pathname.startsWith('/cau-chuyen-nong-dan')) return '/cau-chuyen-nong-dan'
  if (/^\/(dang-nhap|dang-ky)/.test(pathname)) return '/dang-nhap'
  return pathname
}

export default function StorefrontLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout, setUser } = useAuth()

  // Đồng bộ ảnh đại diện từ backend nếu session chưa có avatar
  useEffect(() => {
    if (user && !user.avatar) {
      authService
        .getMyInfo()
        .then((res) => {
          const avatar = res.result?.logoUrl || res.result?.avatar
          if (avatar && avatar !== user.avatar) {
            setUser({
              ...user,
              avatar,
            })
          }
        })
        .catch(() => {})
    }
  }, [user?.id])
  const cart = useCartStore((s) => s.items)
  const changeQuantity = useCartStore((s) => s.changeQuantity)
  const { toast, info, cartOpen, showToast, hideToast, showInfo, hideInfo, openCart } = useUiStore()
  const [query, setQuery] = useState('')

  const myCartQuery = useMyCart()
  const addToCartMutation = useAddToCart()

  const dbCartCount =
    myCartQuery.data?.shopCarts?.reduce(
      (acc: number, sc) => acc + (sc.items?.reduce((sum: number, item) => sum + item.quantity, 0) ?? 0),
      0,
    ) ?? 0

  const currentCount = user ? dbCartCount : cartCount(cart)

  const onAdd = (id: string | number, itemType: string = 'PRODUCT') => {
    const idNum = Number(id)
    if (!isNaN(idNum) && idNum > 0) {
      if (!user) {
        navigate('/dang-nhap', { state: { from: { pathname } } })
        showToast('Vui lòng đăng nhập để thêm vào giỏ hàng.')
        return
      }
      addToCartMutation.mutate(
        { itemType, itemId: idNum, quantity: 1 },
        {
          onSuccess: () => {
            showToast('Đã thêm vào giỏ hàng thành công!')
          },
          onError: (err: any) => {
            const msg = err?.data?.message || err?.response?.data?.message || err?.message || 'Không thể thêm vào giỏ. Vui lòng thử lại.'
            showToast(msg)
          },
        },
      )
      return
    }

    if (user) {
      showToast('Mục xem trước này chưa liên kết với nhà vườn cụ thể. Vui lòng chọn nông sản từ danh sách nhà vườn.')
      return
    }

    const strId = String(id)
    const product = allProducts.find((p) => String(p.id) === strId)
    if (!product) {
      showToast('Sản phẩm này chưa mở bán trực tuyến.')
      return
    }
    if ((cart[strId] ?? 0) >= product.stock) {
      showToast(`Bạn đã chọn tối đa ${product.stock} ${product.unit} ${product.name}.`)
      return
    }
    changeQuantity(strId, 1)
    showToast(`Đã thêm ${product.name} vào giỏ`)
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {
      // Ignore network errors on logout
    }
    logout()
    showToast('Bạn đã đăng xuất khỏi hệ thống CapNong.')
    navigate('/')
  }

  const isFresh = pathname.startsWith('/nong-san-tuoi')
  const context: StorefrontContext = { cart, query, setQuery, onAdd, onInfo: showInfo }

  return (
    <div className="min-h-screen flex flex-col bg-paper-warm">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-leaf-700 focus:text-white focus:rounded-xl focus:shadow-xl focus:font-bold focus:outline-none"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Đến nội dung chính
      </a>

      <Header
        route={headerRoute(pathname)}
        count={currentCount}
        user={user}
        onLogout={handleLogout}
        onSearch={(s) => {
          setQuery(s)
          if (isFresh) document.getElementById('san-pham')?.scrollIntoView()
          else navigate('/nong-san-tuoi/san-pham')
        }}
        onCart={() => openCart()}
        onInfo={showInfo}
      />

      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col">
        <Suspense fallback={<PageLoading />}>
          <Outlet context={context} />
          <Footer onInfo={showInfo} />
        </Suspense>
      </main>

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
      <FloatingChatWidget />

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
    </div>
  )
}

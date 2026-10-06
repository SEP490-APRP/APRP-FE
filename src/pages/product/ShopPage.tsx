import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@/features/user'
import { useAuth } from '@/stores'
import ShopProducts from './ShopProducts'

const DEFAULT_TITLE = 'XẤU MÃ - Nông Sản Mộc Mạc, Giá Trị Thật'
const DEFAULT_IMG = 'https://nongsanxauma.vn/logo.png'

const setMeta = (property: string, content: string) => {
  let el = document.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

interface ShopPageProps {
  shopId?: string | number
  onBack?: () => void
}

const ShopPage: React.FC<ShopPageProps> = ({ shopId: propShopId, onBack: propOnBack }) => {
  const params = useParams<{ shopId?: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const shopId = propShopId ? String(propShopId) : params.shopId
  const shopIdNum = Number(shopId)
  const validShopId = Boolean(shopIdNum) && !isNaN(shopIdNum)
  // Cùng query key với ShopProducts nên chỉ gọi API một lần.
  const shop = useUser(validShopId ? shopIdNum : undefined).data

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // OG tags cho chia sẻ mạng xã hội
  useEffect(() => {
    if (!shop) return
    const name = shop.shopName || shop.fullName || `Cửa hàng #${shopIdNum}`
    const desc = shop.description
      ? shop.description.slice(0, 100)
      : `Cửa hàng nông sản sạch, uy tín tại Nông Sản Xấu Mã`

    document.title = `${name} | Nông Sản Xấu Mã`
    setMeta('og:title', name)
    setMeta('og:description', desc)
    setMeta('og:image', shop.logoUrl || DEFAULT_IMG)
    setMeta('og:url', window.location.href)
    setMeta('og:type', 'profile')
    setMeta('og:site_name', 'Nông Sản Xấu Mã')

    return () => {
      document.title = DEFAULT_TITLE
      setMeta('og:title', DEFAULT_TITLE)
      setMeta('og:description', 'Nền tảng nông sản sạch, tươi ngon, giao hàng tận nhà.')
      setMeta('og:image', DEFAULT_IMG)
      setMeta('og:url', 'https://nongsanxauma.vn')
      setMeta('og:type', 'website')
      setMeta('og:site_name', 'Nông Sản Xấu Mã')
    }
  }, [shop, shopIdNum])

  if (!shopId || isNaN(shopIdNum)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-bold">Không tìm thấy cửa hàng.</p>
      </div>
    )
  }

  return (
    <ShopProducts
      shopId={shopIdNum}
      onBack={propOnBack || (() => navigate('/'))}
      isAuthenticated={isAuthenticated}
      onOpenLogin={() => navigate('/login')}
    />
  )
}

export default ShopPage

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  ChevronLeft,
  Share2,
  Package,
  ShoppingBasket,
  Zap,
  ShieldCheck,
  Leaf,
  Clock,
  HelpCircle,
  Sparkles,
  Gift,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
} from 'lucide-react'

import { useAddToCart } from '@/features/cart'
import { useShopReviews } from '@/features/review'
import { useUser } from '@/features/user'
import { comboService, mysteryBoxService, type BuildCombo, type MysteryBox } from '@/services'
import { useAuth } from '@/stores'
import { CapNongLoading } from '@/components/ui/Loading'
import { ProductShopCard } from '@/pages/product/components/ProductShopCard'
import { ProductSharePopover } from '@/pages/product/components/ProductSharePopover'

const PERKS = [
  { icon: Leaf, title: 'Thu hoạch trong ngày', desc: 'Nông sản hái tươi tại vườn sáng sớm' },
  { icon: Clock, title: 'Giao nhanh 2–4 giờ', desc: 'Đóng thùng giữ nhiệt giao tận bếp' },
  { icon: ShieldCheck, title: 'Đổi trả miễn phí 24h', desc: 'Đền bù ngay nếu dập nát, hư hỏng' },
]

export default function ComboDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  // Xác định xem đang xem BUILD_COMBO hay MYSTERY_BOX qua đường dẫn
  const isMystery = location.pathname.includes('/mystery-box') || location.pathname.includes('/tui-mu')
  const kind = isMystery ? 'MYSTERY_BOX' : 'BUILD_COMBO'
  const numericId = Number(id) || 0

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comboData, setComboData] = useState<BuildCombo | null>(null)
  const [mysteryData, setMysteryData] = useState<MysteryBox | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'policy'>('info')

  const addToCart = useAddToCart()

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const fetchData = async () => {
      try {
        if (isMystery) {
          const res = await mysteryBoxService.getById(numericId)
          if (isMounted) setMysteryData(res)
        } else {
          const res = await comboService.getComboById(numericId)
          if (isMounted) setComboData(res)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(isMystery ? 'Không tìm thấy túi mù này hoặc túi mù đã ngừng bán.' : 'Không tìm thấy gói combo này hoặc combo đã ngừng bán.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (numericId > 0) {
      fetchData()
    } else {
      setError('Mã sản phẩm không hợp lệ')
      setLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [numericId, isMystery])

  // Trích xuất thông tin chung
  const title = isMystery ? (mysteryData?.boxType || 'Túi Mù Nông Sản') : (comboData?.comboName || 'Combo Nông Sản')
  const price = Number(isMystery ? (mysteryData?.price || 0) : (comboData?.price || 0))
  const originalPrice = isMystery ? Math.round(price * 1.35) : (price > 0 ? Math.round(price * 1.3) : 0)
  const savings = originalPrice > price ? originalPrice - price : 0
  const imageUrl = isMystery ? (mysteryData?.imageUrl || '/assets/combo-mystery.jpg') : (comboData?.imageUrl || '/assets/combo-green.jpg')
  const description = isMystery ? (mysteryData?.description || 'Nông sản tươi ngon ngẫu nhiên thu hoạch trực tiếp tại vườn trong ngày.') : (comboData?.description || 'Gói nông sản dinh dưỡng tiện lợi cho bữa ăn gia đình.')
  const portion = isMystery ? (mysteryData?.note || 'Khẩu phần 2–4 người') : 'Khẩu phần gia đình'
  const cookingSuggestion = !isMystery ? comboData?.cookingSuggestion : null
  const soldQuantity = Number(isMystery ? (mysteryData?.soldQuantity || 120) : (comboData?.soldQuantity || 85))
  const stock = Number(isMystery ? (mysteryData?.totalQuantity || 30) : (comboData?.totalQuantity || 25))

  // Shop thông tin
  const shopId = isMystery ? mysteryData?.shopId : (comboData?.shop?.id || (comboData as any)?.shopId)
  const farmName = isMystery ? (mysteryData?.shopName || 'Nhà vườn CapNong') : (comboData?.shop?.shopName || 'Nhà vườn CapNong')
  const shopReviews = useShopReviews(shopId).data ?? []
  const shopOwner = useUser(shopId, { enabled: isAuthenticated && !!shopId }).data ?? null

  const handleAddToCart = (buyNow = false) => {
    if (numericId <= 0) return
    addToCart.mutate(
      {
        itemId: numericId,
        itemType: kind,
        quantity,
      },
      {
        onSuccess: () => {
          if (buyNow) {
            navigate('/cart')
          }
        },
      }
    )
  }

  if (loading) {
    return <CapNongLoading message="Đang tải thông tin gói nông sản..." />
  }

  if (error || (!comboData && !mysteryData)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy thông tin</h2>
        <p className="text-sm text-gray-500 mb-6">{error || 'Gói nông sản không tồn tại.'}</p>
        <button
          type="button"
          onClick={() => navigate('/combo-tui-mu')}
          className="px-6 py-2.5 rounded-xl bg-leaf-700 hover:bg-leaf-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          Quay lại danh sách Combo & Túi mù
        </button>
      </div>
    )
  }

  const items = !isMystery ? (comboData?.items || []) : (mysteryData?.items || [])

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-16">
      {/* 1. Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 py-3">
        <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <Link to="/" className="hover:text-leaf-800 transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <Link to="/combo-tui-mu" className="hover:text-leaf-800 transition-colors">
            Combo & Túi mù
          </Link>
          <span>/</span>
          <span className="text-gray-900 truncate max-w-xs">{title}</span>
        </nav>
      </div>

      {/* 2. Main Hero Section */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cột trái: Hình ảnh & Cam kết (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200/80 shadow-inner group">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Badge giảm giá */}
                <div className="absolute top-3 left-3 bg-[#d92228] text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-md">
                  Giảm 30%
                </div>

                {/* Badge phân loại */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur-md ${
                      isMystery ? 'bg-purple-600/90 text-white' : 'bg-leaf-700/90 text-white'
                    }`}
                  >
                    {isMystery ? <Gift size={13} /> : <Package size={13} />}
                    <span>{isMystery ? 'Túi Mù May Mắn' : 'Combo Nông Sản'}</span>
                  </span>
                </div>
              </div>

              {/* Cam kết sàn CapNong */}
              <div className="rounded-2xl bg-[#f7f9f5] border border-[#e4ecde] p-4 flex flex-col gap-2.5">
                <p className="text-xs font-bold text-leaf-800 uppercase tracking-wider">
                  Cam kết chất lượng CapNong
                </p>
                {PERKS.map((perk, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <perk.icon size={16} className="text-leaf-700 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-gray-800">{perk.title}</p>
                      <p className="text-[11px] text-gray-500">{perk.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột phải: Thông tin & Đặt hàng (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Header: Tag + Nút Chia sẻ Tiếp thị */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-leaf-800 bg-[#eef8ea] px-3 py-1 rounded-full border border-[#d2ecc9]">
                  {portion}
                </span>

                {/* NÚT CHIA SẺ TIẾP THỊ LIÊN KẾT */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowShareMenu((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-leaf-600 hover:text-leaf-700 text-gray-700 text-xs font-bold transition-all bg-white shadow-2xs cursor-pointer"
                  >
                    <Share2 size={14} />
                    <span>Chia sẻ tiếp thị</span>
                    <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-leaf-100 text-[10px] font-extrabold text-leaf-800">
                      <Sparkles size={10} />
                      2%
                    </span>
                  </button>

                  <ProductSharePopover
                    isOpen={showShareMenu}
                    onClose={() => setShowShareMenu(false)}
                    productUrl={window.location.href}
                    shopUrl={shopId ? `${window.location.origin}/cua-hang/${shopId}` : null}
                    shopId={shopId ? Number(shopId) : undefined}
                    targetType={kind}
                    targetId={numericId}
                    type="product"
                    align="right"
                  />
                </div>
              </div>

              {/* Tên gói */}
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-snug">
                {title}
              </h1>

              {/* Giá & Tiết kiệm */}
              <div className="flex flex-wrap items-baseline gap-3 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100">
                <span className="text-2xl sm:text-3xl font-black text-[#2b5619]">
                  {price.toLocaleString('vi-VN')}&nbsp;đ
                </span>
                {originalPrice > price && (
                  <>
                    <del className="text-sm font-semibold text-gray-400">
                      {originalPrice.toLocaleString('vi-VN')}&nbsp;đ
                    </del>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      Tiết kiệm {savings.toLocaleString('vi-VN')}&nbsp;đ
                    </span>
                  </>
                )}
              </div>

              {/* Thanh tiến độ số lượng */}
              <div className="flex flex-col gap-1.5">
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#4a7c2f] h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((soldQuantity / (soldQuantity + stock)) * 100))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                  <span>Đã bán {soldQuantity} gói mùa này</span>
                  <span className="text-leaf-700 font-bold">Còn sẵn {stock} gói</span>
                </div>
              </div>

              {/* THÀNH PHẦN NÔNG SẢN BÊN TRONG */}
              <div className="rounded-2xl border border-gray-200 bg-[#fbfbf9] p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                    {isMystery ? <Gift size={14} className="text-purple-600" /> : <Package size={14} className="text-leaf-700" />}
                    <span>{isMystery ? 'Nông sản bí ẩn bên trong túi' : `Gói combo bao gồm (${items.length} loại nông sản)`}</span>
                  </p>
                </div>

                {isMystery ? (
                  <div className="rounded-xl bg-purple-50/70 border border-purple-200/60 p-3 text-xs leading-relaxed text-purple-900 flex items-start gap-2.5">
                    <HelpCircle size={18} className="text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold mb-0.5">Thu hoạch ngẫu nhiên tại vườn:</p>
                      <p>
                        Các loại rau củ hoặc trái cây được nông dân tuyển chọn tươi mới nhất sáng nay. Bạn sẽ mở túi và khám phá niềm vui bất ngờ khi nhận hàng!
                      </p>
                      {items.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-purple-200/50">
                          <p className="font-bold text-[11px] text-purple-800 mb-1">
                            Có thể xuất hiện các loại:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {items.map((it: any, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-white border border-purple-200 text-purple-800 text-[11px] font-semibold"
                              >
                                {it.productName || it.name || 'Rau củ mùa vụ'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : items.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">Nhà vườn đang cập nhật chi tiết thành phần.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {items.map((it: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-gray-100 shadow-2xs"
                      >
                        <CheckCircle2 size={15} className="text-leaf-600 shrink-0" />
                        <span className="text-xs font-bold text-gray-800 flex-1 truncate">
                          {it.productName || it.name || `Nông sản #${idx + 1}`}
                        </span>
                        <span className="text-xs font-semibold text-gray-500">
                          {it.quantity} {it.unit || 'phần'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bộ chọn số lượng & Nút hành động */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-40 cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-gray-800">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                    disabled={quantity >= stock}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddToCart(false)}
                  disabled={addToCart.isPending || stock <= 0}
                  className="flex-1 w-full py-3 px-5 rounded-xl border-2 border-leaf-700 text-leaf-800 hover:bg-leaf-50 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <ShoppingBasket size={18} />
                  <span>{addToCart.isPending ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddToCart(true)}
                  disabled={addToCart.isPending || stock <= 0}
                  className="flex-1 w-full py-3 px-5 rounded-xl bg-leaf-700 hover:bg-leaf-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  <Zap size={18} />
                  <span>Mua ngay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Thẻ Nhà Vườn */}
      {shopId && (
        <ProductShopCard
          farmName={farmName}
          shopOwner={shopOwner}
          resolvedShopId={Number(shopId)}
          shopReviews={shopReviews}
          shopUrl={`${window.location.origin}/cua-hang/${shopId}`}
          isAuthenticated={isAuthenticated}
          onNavigateToShop={() => navigate(`/cua-hang/${shopId}`)}
          onStartChat={() => {}}
        />
      )}

      {/* 4. Tabs: Mô tả & Hướng dẫn nấu ăn */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <div className="flex border-b border-gray-100 mb-6 gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'info'
                  ? 'border-leaf-700 text-leaf-800'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Mô tả chi tiết & Gợi ý nấu ăn
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('policy')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'policy'
                  ? 'border-leaf-700 text-leaf-800'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Chính sách giao hàng & Bảo quản
            </button>
          </div>

          {activeTab === 'info' ? (
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <div>
                <h3 className="font-bold text-base text-gray-900 mb-2">Giới thiệu gói</h3>
                <p>{description}</p>
              </div>

              {cookingSuggestion && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <h4 className="font-bold text-amber-900 mb-1 flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-600" />
                    Gợi ý thực đơn & Cách chế biến:
                  </h4>
                  <p className="text-amber-800 text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                    {cookingSuggestion}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>
                <strong>Đóng gói:</strong> Nông sản được đóng thùng carton hoặc túi sinh học giữ ẩm chuyên dụng, có lót giấy rơm chống va đập.
              </p>
              <p>
                <strong>Bảo quản:</strong> Khách hàng nên bỏ túi bọc và cho vào ngăn mát tủ lạnh ngay khi nhận để giữ rau củ tươi ngon suốt 5–7 ngày.
              </p>
              <p>
                <strong>Chính sách đổi trả:</strong> Trong vòng 24 giờ kể từ khi shipper giao hàng, nếu phát hiện nông sản bị thối, dập nát quá 20%, CapNong hỗ trợ đổi trả hoặc hoàn tiền 100% phần hư hỏng.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

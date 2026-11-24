import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Search,
  X,
  Package,
  ShoppingCart,
  PlusCircle,
  Layers,
  Gift,
  BarChart3,
  Wallet,
  Flame,
  AlertTriangle,
  Tag,
  ArrowRight,
} from 'lucide-react'
import type { FarmerProduct } from './types'
import type { OrderResponse } from '@/types/order.types'
import { getOrderStatusConfig } from '@/features/shop'

interface ShopQuickSearchProps {
  products: FarmerProduct[]
  orders: OrderResponse[]
  onSelectProduct: (productName: string) => void
  onSelectOrder: (orderId: string) => void
  onNavigateTab: (tabId: string) => void
  onOpenAddProduct: () => void
  onOpenComboBuilder: () => void
  onOpenBlindBoxTool: () => void
}

const getOrderStatusBadge = (status?: string) => {
  const cfg = getOrderStatusConfig(status)
  return { text: cfg.label, bg: cfg.className }
}

export default function ShopQuickSearch({
  products,
  orders,
  onSelectProduct,
  onSelectOrder,
  onNavigateTab,
  onOpenAddProduct,
  onOpenComboBuilder,
  onOpenBlindBoxTool,
}: ShopQuickSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const cleanQuery = query.trim().toLowerCase()
  const isNumeric = cleanQuery.replace('#', '').length > 0 && /^\d+$/.test(cleanQuery.replace('#', ''))
  const digits = cleanQuery.replace(/\D/g, '')

  // 1. Matched Orders
  const matchedOrders = useMemo(() => {
    if (!cleanQuery) return []
    return orders
      .filter((o) => {
        const idStr = String(o.id ?? o.orderId ?? '')
        if (digits && idStr.includes(digits)) return true
        const recipient = (o.recipientName || o.buyerName || '').toLowerCase()
        if (recipient.includes(cleanQuery)) return true
        const phone = o.recipientPhone || ''
        if (phone.includes(cleanQuery)) return true
        const matchItem = o.items?.some((i) =>
          (i.itemName || i.productName || '').toLowerCase().includes(cleanQuery),
        )
        return !!matchItem
      })
      .slice(0, 5)
  }, [orders, cleanQuery, digits])

  // 2. Matched Products
  const matchedProducts = useMemo(() => {
    if (!cleanQuery) return []
    return products
      .filter((p) => {
        const name = (p.name || '').toLowerCase()
        const cat = (p.category || '').toLowerCase()
        const idStr = String(p.id || '')
        return name.includes(cleanQuery) || cat.includes(cleanQuery) || (digits && idStr.includes(digits))
      })
      .slice(0, 5)
  }, [products, cleanQuery, digits])

  // 3. Quick Actions
  const quickActions = useMemo(() => {
    const allActions = [
      {
        id: 'add-product',
        label: 'Đăng bán nông sản mới',
        keywords: ['dang ban', 'them san pham', 'tao nong san', 'nong san moi', 'them'],
        action: onOpenAddProduct,
        icon: PlusCircle,
        color: 'text-emerald-700 bg-emerald-50',
      },
      {
        id: 'add-combo',
        label: 'Tạo combo món ăn mới',
        keywords: ['tao combo', 'combo', 'them combo', 'mon an'],
        action: onOpenComboBuilder,
        icon: Layers,
        color: 'text-teal-700 bg-teal-50',
      },
      {
        id: 'add-blind-box',
        label: 'Tạo túi mù nông sản',
        keywords: ['tui mu', 'hop mu', 'blind box', 'tao tui mu'],
        action: onOpenBlindBoxTool,
        icon: Gift,
        color: 'text-amber-700 bg-amber-50',
      },
      {
        id: 'orders',
        label: 'Xem tất cả đơn hàng',
        keywords: ['don hang', 'don', 'xem don', 'giao hang', 'chua giao'],
        action: () => onNavigateTab('orders'),
        icon: ShoppingCart,
        color: 'text-blue-700 bg-blue-50',
      },
      {
        id: 'products',
        label: 'Xem kho nông sản',
        keywords: ['kho', 'san pham', 'nong san', 'ton kho'],
        action: () => onNavigateTab('products'),
        icon: Package,
        color: 'text-green-700 bg-green-50',
      },
      {
        id: 'revenue',
        label: 'Báo cáo doanh thu & tài chính',
        keywords: ['doanh thu', 'bao cao', 'tien', 'loi nhuan', 'tai chinh'],
        action: () => onNavigateTab('revenue-report'),
        icon: BarChart3,
        color: 'text-indigo-700 bg-indigo-50',
      },
      {
        id: 'wallet',
        label: 'Ví tiền shop & Yêu cầu rút tiền',
        keywords: ['vi tien', 'rut tien', 'so du', 'vi'],
        action: () => onNavigateTab('wallet'),
        icon: Wallet,
        color: 'text-purple-700 bg-purple-50',
      },
      {
        id: 'campaigns',
        label: 'Chiến dịch giải cứu nông sản',
        keywords: ['chien dich', 'giai cuu', 'campaign'],
        action: () => onNavigateTab('campaigns'),
        icon: Flame,
        color: 'text-orange-700 bg-orange-50',
      },
      {
        id: 'disputes',
        label: 'Khiếu nại & Trợ giúp',
        keywords: ['khieu nai', 'ho tro', 'tro giup', 'dispute'],
        action: () => onNavigateTab('disputes'),
        icon: AlertTriangle,
        color: 'text-rose-700 bg-rose-50',
      },
      {
        id: 'vouchers',
        label: 'Mã giảm giá & Voucher của shop',
        keywords: ['voucher', 'ma giam gia', 'khuyen mai'],
        action: () => onNavigateTab('vouchers'),
        icon: Tag,
        color: 'text-pink-700 bg-pink-50',
      },
    ]

    if (!cleanQuery) return []
    return allActions.filter(
      (a) =>
        a.label.toLowerCase().includes(cleanQuery) ||
        a.keywords.some((k) => k.includes(cleanQuery) || cleanQuery.includes(k)),
    ).slice(0, 3)
  }, [cleanQuery, onOpenAddProduct, onOpenComboBuilder, onOpenBlindBoxTool, onNavigateTab])

  const totalResults = matchedOrders.length + matchedProducts.length + quickActions.length

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    } else if (e.key === 'Enter') {
      if (isNumeric && matchedOrders.length > 0) {
        const firstOrder = matchedOrders[0]
        const orderId = String(firstOrder.id ?? firstOrder.orderId)
        onSelectOrder(orderId)
        setIsOpen(false)
        setQuery('')
      } else if (matchedProducts.length > 0) {
        onSelectProduct(matchedProducts[0].name)
        setIsOpen(false)
        setQuery('')
      } else if (quickActions.length > 0) {
        quickActions[0].action()
        setIsOpen(false)
        setQuery('')
      } else if (cleanQuery) {
        onSelectProduct(query.trim())
        setIsOpen(false)
        setQuery('')
      }
    }
  }

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative z-40">
      {/* Search Input Bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929a8c] pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Tìm đơn hàng (#103), nông sản..."
          className="pl-9 pr-8 py-2 bg-[#f4f7f1] rounded-full text-xs text-[#1e2319] placeholder-[#8e9688] outline-none focus:bg-white focus:ring-2 focus:ring-[#326318]/40 focus:border-[#326318] w-56 sm:focus:w-72 md:focus:w-80 transition-all duration-200 border border-transparent shadow-sm"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
            title="Xóa tìm kiếm"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown Results Box */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-[#e4ebde] overflow-hidden animate-fadeIn">
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#f0f4ec]">
            {totalResults === 0 ? (
              <div className="py-8 px-4 text-center">
                <Package size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-700">
                  Không tìm thấy kết quả cho &quot;{query}&quot;
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5 mb-3">
                  Thử tìm theo mã đơn (#103), tên nông sản hoặc danh mục.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onSelectProduct(query.trim())
                    setIsOpen(false)
                    setQuery('')
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#326318] hover:text-[#214310] bg-[#326318]/10 hover:bg-[#326318]/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Tìm trong kho nông sản</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : (
              <>
                {/* 1. Nhóm Đơn hàng (Ưu tiên hiển thị trước nếu query có chứa số) */}
                {isNumeric && matchedOrders.length > 0 && (
                  <div className="p-2">
                    <div className="px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wider text-[#326318] flex items-center gap-1.5">
                      <ShoppingCart size={12} />
                      <span>Đơn hàng phù hợp ({matchedOrders.length})</span>
                    </div>
                    <div className="mt-1 space-y-1">
                      {matchedOrders.map((ord) => {
                        const orderId = String(ord.id ?? ord.orderId)
                        const badge = getOrderStatusBadge(ord.status)
                        return (
                          <div
                            key={orderId}
                            onClick={() => {
                              onSelectOrder(orderId)
                              setIsOpen(false)
                              setQuery('')
                            }}
                            className="p-2 rounded-lg hover:bg-[#f4f7f1] transition-colors cursor-pointer flex items-center justify-between gap-2 border border-transparent hover:border-[#e2ebdc]"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-black text-xs shrink-0">
                                #{orderId}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">
                                  {ord.recipientName || ord.buyerName || 'Khách hàng'}
                                </p>
                                <p className="text-[11px] text-gray-500 truncate">
                                  {Number(ord.totalAmount || 0).toLocaleString('vi-VN')}đ
                                  {ord.items && ord.items.length > 0 && ` · ${ord.items.length} món`}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badge.bg}`}
                            >
                              {badge.text}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Nhóm Nông sản trong kho */}
                {matchedProducts.length > 0 && (
                  <div className="p-2">
                    <div className="px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wider text-[#326318] flex items-center gap-1.5">
                      <Package size={12} />
                      <span>Nông sản trong kho ({matchedProducts.length})</span>
                    </div>
                    <div className="mt-1 space-y-1">
                      {matchedProducts.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            onSelectProduct(prod.name)
                            setIsOpen(false)
                            setQuery('')
                          }}
                          className="p-2 rounded-lg hover:bg-[#f4f7f1] transition-colors cursor-pointer flex items-center justify-between gap-2 border border-transparent hover:border-[#e2ebdc]"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gray-200"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">
                                {prod.name}
                              </p>
                              <p className="text-[11px] text-gray-500 truncate">
                                {prod.category} · {Number(prod.price || 0).toLocaleString('vi-VN')}đ/{prod.unit}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-semibold text-gray-500 block">
                              Kho: {prod.stock} {prod.unit}
                            </span>
                            <span
                              className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                                prod.status === 'Đang bán'
                                  ? 'bg-green-100 text-green-700'
                                  : prod.status === 'Chờ duyệt'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {prod.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nhóm Đơn hàng (Nếu query là chữ thông thường khớp tên khách hoặc món ăn) */}
                {!isNumeric && matchedOrders.length > 0 && (
                  <div className="p-2">
                    <div className="px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wider text-[#326318] flex items-center gap-1.5">
                      <ShoppingCart size={12} />
                      <span>Đơn hàng phù hợp ({matchedOrders.length})</span>
                    </div>
                    <div className="mt-1 space-y-1">
                      {matchedOrders.map((ord) => {
                        const orderId = String(ord.id ?? ord.orderId)
                        const badge = getOrderStatusBadge(ord.status)
                        return (
                          <div
                            key={orderId}
                            onClick={() => {
                              onSelectOrder(orderId)
                              setIsOpen(false)
                              setQuery('')
                            }}
                            className="p-2 rounded-lg hover:bg-[#f4f7f1] transition-colors cursor-pointer flex items-center justify-between gap-2 border border-transparent hover:border-[#e2ebdc]"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-black text-xs shrink-0">
                                #{orderId}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">
                                  {ord.recipientName || ord.buyerName || 'Khách hàng'}
                                </p>
                                <p className="text-[11px] text-gray-500 truncate">
                                  {Number(ord.totalAmount || 0).toLocaleString('vi-VN')}đ
                                  {ord.items && ord.items.length > 0 && ` · ${ord.items.length} món`}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badge.bg}`}
                            >
                              {badge.text}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Nhóm Lối tắt nhanh */}
                {quickActions.length > 0 && (
                  <div className="p-2 bg-[#fafcf9]">
                    <div className="px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wider text-gray-500">
                      Lối tắt tác vụ
                    </div>
                    <div className="mt-1 space-y-1">
                      {quickActions.map((action) => {
                        const IconComponent = action.icon
                        return (
                          <div
                            key={action.id}
                            onClick={() => {
                              action.action()
                              setIsOpen(false)
                              setQuery('')
                            }}
                            className="p-2 rounded-lg hover:bg-[#edf2e7] transition-colors cursor-pointer flex items-center gap-2.5 text-xs font-bold text-gray-800"
                          >
                            <div className={`p-1.5 rounded-md shrink-0 ${action.color}`}>
                              <IconComponent size={14} />
                            </div>
                            <span>{action.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer thông tin phím tắt */}
          <div className="py-2 px-3 bg-[#f4f7f1] border-t border-[#e8ece3] flex items-center justify-between text-[11px] text-gray-500">
            <span>
              Nhấn <strong className="text-gray-800">Enter</strong> để chọn kết quả đầu tiên
            </span>
            <span className="text-gray-400">Esc để đóng</span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * ShopOrdersPage — Trang quản lý đơn hàng cho Shop Owner
 *
 * Workflow hiển thị:
 * 1. User chọn tab để lọc theo status
 * 2. Bấm vào card → mở OrderDetailModal
 * 3. Trong modal: confirm / ready / cancel
 * 4. Sau action → React Query tự refetch danh sách
 */

import { useState } from 'react'
import { Loader2, AlertCircle, Search } from 'lucide-react'
import { useShopOrders } from '@/features/shop/hooks/useShopOrders'
import { OrderCard } from '@/features/shop/components/OrderCard'
import { OrderDetailModal } from '@/features/shop/components/OrderDetailModal'
import type { OrderResponse, OrderStatus } from '@/types/order.types'
import { CapNongLoading } from '@/components/ui/Loading'

/* ── Tab definitions (Loại bỏ hoàn toàn AWAITING_PAYMENT khỏi phía Shop) ── */
const SHOP_ALL_STATUSES: OrderStatus[] = [
  'PENDING', 'PAID', 'CONFIRMED', 'READY', 'SHIPPING', 'PICKED_UP', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED'
]

const TABS: { label: string; statuses: OrderStatus[] }[] = [
  { label: 'Tất cả',         statuses: SHOP_ALL_STATUSES },
  { label: 'Cần xử lý',      statuses: ['PENDING', 'PAID'] },
  { label: 'Đang chuẩn bị',  statuses: ['CONFIRMED'] },
  { label: 'Chờ shipper',    statuses: ['READY'] },
  { label: 'Đang giao',      statuses: ['SHIPPING', 'PICKED_UP'] },
  { label: 'Hoàn thành',     statuses: ['DELIVERED', 'COMPLETED'] },
  { label: 'Đã hủy',         statuses: ['CANCELLED', 'FAILED'] },
]

const PAGE_SIZE = 10

export function ShopOrdersPage() {
  const [activeTab, setActiveTab]   = useState(0)
  const [page, setPage]             = useState(0)
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<OrderResponse | null>(null)

  const { data, isLoading, isError } = useShopOrders({
    page,
    size: PAGE_SIZE,
    statuses: TABS[activeTab].statuses,
  })

  // Đảm bảo không bao giờ hiển thị đơn AWAITING_PAYMENT phía shop
  const orders = (data?.content ?? []).filter((o: OrderResponse) => o.status !== 'AWAITING_PAYMENT')

  // Filter search phía client (mã đơn / tên khách)
  const filtered = search.trim()
    ? orders.filter(
        (o: OrderResponse) =>
          `#${o.orderId ?? o.id}`.includes(search) ||
          (o.recipientName || '').toLowerCase().includes(search.toLowerCase()),
      )
    : orders

  const handleTabChange = (idx: number) => {
    setActiveTab(idx)
    setPage(0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-gray-900">Quản Lý Đơn Hàng</h1>
          <p className="text-sm text-gray-400 mt-1">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Tìm mã đơn hoặc tên khách..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-300 transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((tab, idx) => (
            <button
              key={tab.label}
              onClick={() => handleTabChange(idx)}
              className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all border ${
                activeTab === idx
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300'
              }`}
            >
              {tab.label}
              {activeTab === idx && data ? ` (${data.totalElements})` : ''}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <CapNongLoading
            className="!min-h-[360px]"
            message="Đang tải danh sách đơn hàng..."
            subMessage="Kênh quản lý đơn hàng nhà vườn CapNong"
            size="md"
          />
        ) : isError ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-5 text-red-600">
            <AlertCircle className="size-5 shrink-0" />
            <span className="text-sm font-bold">Không thể tải đơn hàng. Kiểm tra kết nối và thử lại.</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400 font-bold text-sm">
            Không có đơn hàng nào.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((order: OrderResponse) => (
              <OrderCard key={order.id} order={order} onSelect={setSelected} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-2">
            <button
              disabled={data.first}
              onClick={() => setPage((p: number) => p - 1)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold disabled:opacity-40 hover:border-emerald-300 transition-all"
            >
              ← Trước
            </button>
            <span className="px-4 py-2 text-sm text-gray-500 font-medium">
              {page + 1} / {data.totalPages}
            </span>
            <button
              disabled={data.last}
              onClick={() => setPage((p: number) => p + 1)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold disabled:opacity-40 hover:border-emerald-300 transition-all"
            >
              Tiếp →
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

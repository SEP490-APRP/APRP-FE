import React, { useState } from 'react'
import {
  Plus,
  Search,
  Edit3,
  Gift,
  Images,
  Trash2,
  AlertCircle,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  PauseCircle,
} from 'lucide-react'
import type { FarmerProduct } from './types'
import type { ProductResponse } from '@/services'
import {
  useMyProducts,
  useDeleteProduct,
} from '@/features/product/hooks/useProductQueries'
import { useCategories } from '@/features/product/hooks/useCategoryQueries'
import { ProductImageGalleryModal } from '@/features/product/components/ProductImageGalleryModal'
import { EditProductModal } from '@/features/product/components/EditProductModal'

interface ProductsProps {
  products?: FarmerProduct[]
  onOpenAddProduct: () => void
  onOpenBlindBoxTool: () => void
  onOpenComboBuilder: () => void
  onInfo?: (msg: string) => void
}

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'INACTIVE'

export default function Products({
  products: propProducts = [],
  onOpenAddProduct,
  onOpenBlindBoxTool,
  onInfo,
}: ProductsProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<number | 'ALL'>('ALL')
  const [search, setSearch] = useState('')

  // Modals state
  const [galleryModalState, setGalleryModalState] = useState<{
    isOpen: boolean
    productId: number
    productName: string
  }>({ isOpen: false, productId: 0, productName: '' })

  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean
    product: ProductResponse | null
  }>({ isOpen: false, product: null })

  // Real data fetching from TanStack Query
  const { data: myProductsData, isLoading } = useMyProducts({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
  })
  const { data: categories = [] } = useCategories()
  const deleteMutation = useDeleteProduct()

  // Danh sách sản phẩm thực tế từ API (nếu chưa có API thì dùng propProducts fallback)
  const apiProducts: ProductResponse[] = myProductsData?.content ?? []
  const hasApiData = apiProducts.length > 0

  // Chuyển đổi dữ liệu thống nhất để render
  const displayItems: ProductResponse[] = hasApiData
    ? apiProducts
    : propProducts.map((p) => ({
        id: Number(p.id) || 1,
        productId: Number(p.id) || 1,
        productName: p.name,
        name: p.name,
        sellingPrice: p.price,
        price: p.price,
        stockQuantity: p.stock,
        stock: p.stock,
        unit: p.unit || 'kg',
        status: ((p.status as string) === 'Chờ duyệt'
          ? 'PENDING'
          : (p.status as string) === 'Đang bán'
            ? 'APPROVED'
            : 'INACTIVE') as any,
        category: p.category as any,
        categoryId: 1,
        imageUrl: p.image,
        image: p.image,
        expiryDate: undefined,
        rejectReason: undefined,
        defectReason: undefined,
        images: [],
      }))

  // Lọc theo search và category
  const filtered = displayItems.filter((p) => {
    // Lọc theo trạng thái
    if (statusFilter !== 'ALL') {
      const s = p.status?.toUpperCase()
      if (statusFilter === 'APPROVED' && s !== 'APPROVED' && s !== 'ACTIVE') return false
      if (statusFilter === 'PENDING' && s !== 'PENDING') return false
      if (statusFilter === 'REJECTED' && s !== 'REJECTED') return false
      if (statusFilter === 'INACTIVE' && s !== 'INACTIVE') return false
    }

    // Lọc theo danh mục
    if (categoryFilter !== 'ALL') {
      const pCatId =
        typeof p.category === 'object' && p.category !== null
          ? (p.category as any).categoryId
          : p.categoryId
      if (pCatId !== categoryFilter) return false
    }

    // Lọc theo từ khóa tìm kiếm
    if (search) {
      const q = search.toLowerCase()
      const name = (p.productName || p.name || '').toLowerCase()
      if (!name.includes(q)) return false
    }

    return true
  })

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Bạn có chắc muốn tạm dừng/xóa sản phẩm "${name}"?`)) {
      try {
        await deleteMutation.mutateAsync(id)
        onInfo?.(`Đã gỡ sản phẩm: ${name}`)
      } catch {
        onInfo?.('Lỗi khi xóa sản phẩm')
      }
    }
  }

  const renderStatusBadge = (status: string, rejectReason?: string) => {
    const s = status?.toUpperCase()
    if (s === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={11} /> Chờ duyệt
        </span>
      )
    }
    if (s === 'APPROVED' || s === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-green-50 text-green-700 border border-green-200">
          <CheckCircle2 size={11} /> Đang bán
        </span>
      )
    }
    if (s === 'REJECTED') {
      return (
        <div className="flex flex-col items-end">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-red-50 text-red-700 border border-red-200">
            <XCircle size={11} /> Bị từ chối
          </span>
          {rejectReason && (
            <span className="text-[10px] text-red-600 mt-0.5 max-w-[160px] truncate" title={rejectReason}>
              Lý do: {rejectReason}
            </span>
          )}
        </div>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-gray-100 text-gray-700 border border-gray-200">
        <PauseCircle size={11} /> Tạm dừng
      </span>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f1f4ed]">
        <div>
          <h3 className="text-2xl font-black text-[#1c2216]">Kho Nông Sản Của Bạn</h3>
          <p className="text-xs text-[#7e8779]">
            Quản lý nông sản thu hoạch, tải ảnh kiểm duyệt AI và thiết lập giá bán
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="tour-products-blindbox-btn"
            type="button"
            onClick={onOpenBlindBoxTool}
            className="px-4 py-2.5 rounded-full bg-[#fdf5eb] border border-[#f5ddbd] hover:bg-[#faeedd] text-[#8a4e1d] font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Gift size={14} />
            <span>Tạo Túi Mù Blind Box</span>
          </button>

          <button
            id="tour-products-add-btn"
            type="button"
            onClick={onOpenAddProduct}
            className="px-5 py-2.5 rounded-full bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-xs uppercase shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus size={15} />
            <span>Đăng Bán Nông Sản Mới</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs, Categories & Search */}
      <div className="bg-white rounded-3xl border border-[#e8ece3] shadow-sm overflow-hidden">
        {/* Status Filter Tabs */}
        <div className="p-4 border-b border-[#f1f4ed] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-[#1c2216] text-white shadow-sm'
                  : 'bg-[#f4f7f1] text-[#5b6454] hover:bg-[#e8eee3]'
              }`}
            >
              Tất cả ({displayItems.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                statusFilter === 'APPROVED'
                  ? 'bg-[#326318] text-white shadow-sm'
                  : 'bg-[#f4f7f1] text-[#5b6454] hover:bg-[#e8eee3]'
              }`}
            >
              Đang bán ({displayItems.filter((p) => p.status === 'APPROVED' || p.status === 'ACTIVE').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-[#f4f7f1] text-[#5b6454] hover:bg-[#e8eee3]'
              }`}
            >
              Chờ duyệt ({displayItems.filter((p) => p.status === 'PENDING').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                statusFilter === 'REJECTED'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-[#f4f7f1] text-[#5b6454] hover:bg-[#e8eee3]'
              }`}
            >
              Từ chối ({displayItems.filter((p) => p.status === 'REJECTED').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929a8c]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm nông sản..."
              className="w-full pl-9 pr-3 py-2 bg-[#f4f7f1] rounded-full text-xs text-[#1e2319] outline-none border border-transparent focus:border-[#326318] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="px-4 py-2.5 bg-[#fafcf9] border-b border-[#f1f4ed] flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-[#7e8779] flex items-center gap-1 shrink-0">
            <Filter size={12} /> Danh mục:
          </span>
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer transition-all ${
              categoryFilter === 'ALL'
                ? 'bg-[#326318] text-white'
                : 'bg-white border border-[#e2e8dc] text-[#5b6454] hover:bg-[#f4f7f1]'
            }`}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              key={c.categoryId}
              type="button"
              onClick={() => setCategoryFilter(c.categoryId)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer transition-all ${
                categoryFilter === c.categoryId
                  ? 'bg-[#326318] text-white'
                  : 'bg-white border border-[#e2e8dc] text-[#5b6454] hover:bg-[#f4f7f1]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product Items List */}
        <div className="divide-y divide-[#f1f4ed]">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center justify-between gap-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#f0f4ec]" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-[#f0f4ec] rounded" />
                      <div className="w-24 h-3 bg-[#f0f4ec] rounded" />
                    </div>
                  </div>
                  <div className="w-20 h-6 bg-[#f0f4ec] rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((p) => {
              const prodId = Number(p.id ?? p.productId)
              const prodName = p.productName || p.name || 'Nông sản'
              const price = Number(p.sellingPrice ?? p.price ?? 0)
              const stock = Number(p.stockQuantity ?? p.stock ?? 0)
              const unit = p.unit || 'kg'
              const imgUrl =
                p.imageUrl ||
                p.image ||
                'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80'
              const catName =
                typeof p.category === 'object' && p.category !== null
                  ? (p.category as any).name
                  : p.category || 'Nông sản'

              return (
                <div
                  key={prodId}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#fafcf9] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative group/thumb shrink-0">
                      <img
                        src={imgUrl}
                        alt={prodName}
                        className="w-14 h-14 rounded-2xl object-cover border border-[#e4ebd9]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setGalleryModalState({
                            isOpen: true,
                            productId: prodId,
                            productName: prodName,
                          })
                        }
                        title="Quản lý ảnh (Gallery)"
                        className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                      >
                        <Images size={16} />
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-[#1c2216]">{prodName}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f4f7f1] text-[#5b6454]">
                          {catName}
                        </span>
                      </div>
                      <span className="text-xs text-[#7e8779] block mt-0.5">
                        Tồn kho: <span className="font-bold text-[#1c2216]">{stock} {unit}</span>
                        {p.expiryDate && ` · HSD: ${p.expiryDate}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-left sm:text-right">
                      <div className="text-sm font-black text-[#326318]">
                        {price.toLocaleString('vi-VN')}đ / {unit}
                      </div>
                      <div className="mt-1">
                        {renderStatusBadge(p.status, p.rejectReason || p.defectReason)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Nút Quản lý Gallery ảnh riêng biệt */}
                      <button
                        type="button"
                        onClick={() =>
                          setGalleryModalState({
                            isOpen: true,
                            productId: prodId,
                            productName: prodName,
                          })
                        }
                        title="Quản lý thư viện ảnh"
                        className="px-2.5 py-1.5 rounded-xl border border-[#e2e8dc] hover:border-[#326318] hover:bg-[#f0f4ec] text-[#5b6454] hover:text-[#326318] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Images size={14} />
                        <span className="hidden md:inline">Ảnh ({p.images?.length ?? 1})</span>
                      </button>

                      {/* Nút Chỉnh sửa */}
                      <button
                        type="button"
                        onClick={() => setEditModalState({ isOpen: true, product: p })}
                        title="Chỉnh sửa thông tin"
                        className="p-2 rounded-xl hover:bg-[#f0f4ec] text-[#616a5b] hover:text-[#326318] cursor-pointer transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>

                      {/* Nút Xóa / Tạm dừng */}
                      <button
                        type="button"
                        onClick={() => handleDelete(prodId, prodName)}
                        title="Gỡ sản phẩm"
                        className="p-2 rounded-xl hover:bg-red-50 text-[#929a8c] hover:text-red-600 cursor-pointer transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#f4f7f1] text-[#7e8779] flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-sm font-extrabold text-[#1c2216]">Chưa tìm thấy nông sản nào</h4>
              <p className="text-xs text-[#7e8779] mt-1 max-w-sm mx-auto">
                Không có sản phẩm nào phù hợp với bộ lọc hiện tại. Bạn có thể đăng bán sản phẩm mới hoặc đổi tiêu chí tìm kiếm.
              </p>
              <button
                type="button"
                onClick={onOpenAddProduct}
                className="mt-4 px-5 py-2 rounded-full bg-[#326318] hover:bg-[#254b12] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus size={14} /> Đăng Bán Nông Sản
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Image Gallery Modal */}
      <ProductImageGalleryModal
        productId={galleryModalState.productId}
        productName={galleryModalState.productName}
        isOpen={galleryModalState.isOpen}
        onClose={() => setGalleryModalState({ isOpen: false, productId: 0, productName: '' })}
        onInfo={onInfo}
      />

      {/* Edit Product Modal */}
      {editModalState.product && (
        <EditProductModal
          product={editModalState.product}
          isOpen={editModalState.isOpen}
          onClose={() => setEditModalState({ isOpen: false, product: null })}
          onOpenGallery={(pId, pName) =>
            setGalleryModalState({ isOpen: true, productId: pId, productName: pName })
          }
          onInfo={onInfo}
        />
      )}
    </div>
  )
}

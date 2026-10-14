import React, { useState, useRef, useEffect } from 'react'
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
  ChevronDown,
  Check,
} from 'lucide-react'
import type { FarmerProduct } from './types'
import { comboService, mysteryBoxService, type ProductResponse } from '@/services'
import { getErrorMessage } from '@/utils'
import {
  useMyProducts,
  useDeleteProduct,
  useMyCombos,
  useDeleteCombo,
} from '@/features/product'
import { useCategories } from '@/features/product/hooks/useCategoryQueries'
import { useMyMysteryBoxes, useDeleteMysteryBox } from '@/features/mystery-box'
import { ProductImageGalleryModal } from '@/features/product/components/ProductImageGalleryModal'
import { EditProductModal } from '@/features/product/components/EditProductModal'
import Pagination from '@/components/ui/Pagination/Pagination'

interface ProductsProps {
  products?: FarmerProduct[]
  onOpenAddProduct: () => void
  onOpenBlindBoxTool: () => void
  onOpenComboBuilder?: (combo?: any) => void
  onInfo?: (msg: string) => void
}

export type StatusFilter = 'ALL' | 'ACTIVE' | 'PENDING' | 'REJECTED' | 'INACTIVE'
export type ProductTypeFilter = 'ALL' | 'SINGLE' | 'MYSTERY_BOX' | 'COMBO'

export function isBlindBoxItem(p: any): boolean {
  if (p?.isBlindBox) return true
  const cat = typeof p.category === 'object' && p.category !== null ? p.category.name : String(p.category || '')
  const name = String(p.productName || p.name || '')
  const unit = String(p.unit || '')
  const catLower = cat.toLowerCase()
  const nameLower = name.toLowerCase()
  const unitLower = unit.toLowerCase()

  return (
    catLower.includes('hộp mù') ||
    catLower.includes('túi mù') ||
    catLower.includes('blind box') ||
    catLower.includes('mystery') ||
    nameLower.includes('túi mù') ||
    nameLower.includes('hộp mù') ||
    nameLower.includes('blind box') ||
    unitLower === 'hộp'
  )
}

export function isComboItem(p: any): boolean {
  if (p?.isCombo) return true
  if (isBlindBoxItem(p)) return false
  const cat = typeof p.category === 'object' && p.category !== null ? p.category.name : String(p.category || '')
  const name = String(p.productName || p.name || '')
  const unit = String(p.unit || '')
  const catLower = cat.toLowerCase()
  const nameLower = name.toLowerCase()
  const unitLower = unit.toLowerCase()

  return (
    catLower.includes('combo') ||
    nameLower.includes('combo') ||
    unitLower === 'combo' ||
    unitLower === 'phần' ||
    unitLower === 'set'
  )
}


export default function Products({
  products: propProducts = [],
  onOpenAddProduct,
  onOpenBlindBoxTool,
  onOpenComboBuilder,
  onInfo,
}: ProductsProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [typeFilter, setTypeFilter] = useState<ProductTypeFilter>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<number | 'ALL'>('ALL')
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false)
      }
    }
    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCategoryDropdownOpen])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState<number>(0)
  const pageSize = 10

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

  // Lấy dữ liệu kho hàng của Shop từ BE (tải tối đa 100 mặt hàng mỗi loại để phân trang & lọc Client-side đồng nhất)
  const { data: myProductsData, isLoading: isLoadingProducts } = useMyProducts({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    size: 100,
  })

  // Gọi API lấy danh sách Combo của shop từ BE (GET /combos/my-shop)
  const { data: myCombosData, isLoading: isLoadingCombos } = useMyCombos({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    page: 1,
    size: 100,
  })

  // Gọi API lấy danh sách Túi mù của shop từ BE (GET /mystery-boxes/my-shop)
  const { data: myBoxesData, isLoading: isLoadingBoxes } = useMyMysteryBoxes(1, 100)

  const isLoading = isLoadingProducts || isLoadingCombos || isLoadingBoxes
  const { data: categories = [] } = useCategories()
  const selectedCategory = categories.find((c) => c.categoryId === categoryFilter)
  const deleteMutation = useDeleteProduct()
  const deleteComboMutation = useDeleteCombo()
  const deleteMysteryBoxMutation = useDeleteMysteryBox()

  // Map Combo từ BE sang ProductResponse
  const comboItems: any[] = (myCombosData?.content || []).map((c) => ({
    id: c.comboId,
    productId: c.comboId,
    productName: c.comboName,
    name: c.comboName,
    sellingPrice: c.price,
    price: c.price,
    stockQuantity: c.totalQuantity,
    stock: c.totalQuantity,
    unit: 'combo',
    status: (c.status || 'PENDING') as any,
    category: { categoryId: 9999, name: `Combo · ${c.type || 'Set món'}` } as any,
    categoryId: 9999,
    imageUrl: c.imageUrl,
    image: c.imageUrl,
    images: c.imageUrl ? [{ imageId: 1, imageUrl: c.imageUrl, isPrimary: true }] : [],
    description: c.description,
    isCombo: true,
    mealType: c.mealType,
    type: c.type,
    region: c.region,
    items: c.items,
    rawCombo: c,
  }))

  // Map Túi mù từ BE sang ProductResponse
  const boxItems: any[] = (myBoxesData?.content || []).map((b) => ({
    id: b.mysteryId || b.id,
    productId: b.mysteryId || b.id,
    productName: b.boxType,
    name: b.boxType,
    sellingPrice: b.price,
    price: b.price,
    stockQuantity: b.totalQuantity || 0,
    stock: b.totalQuantity || 0,
    unit: 'hộp',
    status: (b.isActive ? 'ACTIVE' : 'PENDING') as any,
    category: { categoryId: 9998, name: 'Hộp mù nông sản' } as any,
    categoryId: 9998,
    imageUrl: b.imageUrl,
    image: b.imageUrl,
    images: b.imageUrl ? [{ imageId: 1, imageUrl: b.imageUrl, isPrimary: true }] : [],
    description: b.description,
    isBlindBox: true,
  }))

  // Danh sách sản phẩm thực tế từ API (hoặc prop fallback nếu chưa có dữ liệu API)
  const apiProducts: ProductResponse[] = myProductsData?.content ?? []
  const hasApiData = myProductsData !== undefined && myProductsData !== null

  // Gộp đầy đủ cả nông sản lẻ, combo và túi mù vào kho hàng của Shop
  const allStoreItems: any[] = [
    ...apiProducts,
    ...comboItems,
    ...boxItems,
  ]

  const displayItems: ProductResponse[] = hasApiData || comboItems.length > 0 || boxItems.length > 0
    ? allStoreItems
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
            ? 'ACTIVE'
            : (p.status as string) === 'Bị từ chối'
              ? 'REJECTED'
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

  // Danh sách các mặt hàng phù hợp với trạng thái statusFilter đang chọn
  const itemsByStatus = displayItems.filter((p) => {
    if (statusFilter === 'ALL') return true
    const s = p.status?.toUpperCase()
    if (statusFilter === 'ACTIVE') return s === 'ACTIVE' || s === 'APPROVED'
    if (statusFilter === 'PENDING') return s === 'PENDING'
    if (statusFilter === 'REJECTED') return s === 'REJECTED'
    if (statusFilter === 'INACTIVE') return s === 'INACTIVE'
    return true
  })

  // Bộ lọc client-side (kết hợp phân loại loại hình, danh mục, từ khóa)
  const filtered = itemsByStatus.filter((p) => {
    // 1. Phân loại sản phẩm (Nông sản lẻ / Túi mù / Combo)
    const isBox = isBlindBoxItem(p)
    const isCmb = isComboItem(p)
    if (typeFilter === 'MYSTERY_BOX' && !isBox) return false
    if (typeFilter === 'COMBO' && !isCmb) return false
    if (typeFilter === 'SINGLE' && (isBox || isCmb)) return false

    // 3. Danh mục
    if (categoryFilter !== 'ALL') {
      const pCatId =
        typeof p.category === 'object' && p.category !== null
          ? (p.category as any).categoryId
          : p.categoryId
      if (pCatId && pCatId !== categoryFilter) return false
    }

    // 3. Từ khóa tìm kiếm
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const name = (p.productName || p.name || '').toLowerCase()
      if (!name.includes(q)) return false
    }

    return true
  })

  // Phân trang: dùng filtered.length để phản ánh tổng cả Nông sản lẻ + Combo + Túi mù
  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const totalElements = filtered.length
  const paginatedItems = filtered.slice(page * pageSize, (page + 1) * pageSize)

  const handleStatusChange = (status: StatusFilter) => {
    setStatusFilter(status)
    setPage(0)
  }

  const handleTypeChange = (type: ProductTypeFilter) => {
    setTypeFilter(type)
    setPage(0)
  }

  const handleCategoryChange = (catId: number | 'ALL') => {
    setCategoryFilter(catId)
    setPage(0)
  }

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(0)
  }

  const handleDelete = async (p: any) => {
    const prodId = Number(p.id ?? p.productId)
    const prodName = p.productName || p.name || 'Sản phẩm'
    if (window.confirm(`Bạn có chắc muốn tạm dừng/gỡ bỏ "${prodName}"?`)) {
      try {
        if (isComboItem(p)) {
          await deleteComboMutation.mutateAsync(prodId)
          onInfo?.(`Đã gỡ Combo: ${prodName}`)
        } else if (isBlindBoxItem(p)) {
          await deleteMysteryBoxMutation.mutateAsync(prodId)
          onInfo?.(`Đã gỡ Túi mù: ${prodName}`)
        } else {
          await deleteMutation.mutateAsync(prodId)
          onInfo?.(`Đã tạm dừng sản phẩm: ${prodName}`)
        }
      } catch (err: any) {
        onInfo?.(getErrorMessage(err) || 'Lỗi khi xử lý sản phẩm')
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
    if (s === 'ACTIVE' || s === 'APPROVED') {
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
            Quản lý nông sản thu hoạch, tải ảnh kiểm duyệt AI Google Vision và thiết lập giá bán
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenComboBuilder && (
            <button
              id="tour-products-combo-btn"
              type="button"
              onClick={onOpenComboBuilder}
              className="px-4 py-2 rounded-full bg-[#edf6f7] border border-[#cae4e7] hover:bg-[#deeff0] text-[#195962] font-bold text-xs uppercase cursor-pointer transition-colors"
            >
              Tạo Combo Món
            </button>
          )}

          <button
            id="tour-products-blindbox-btn"
            type="button"
            onClick={onOpenBlindBoxTool}
            className="px-4 py-2 rounded-full bg-[#fdf5eb] border border-[#f5ddbd] hover:bg-[#faeedd] text-[#8a4e1d] font-bold text-xs uppercase cursor-pointer transition-colors"
          >
            Tạo Túi Mù Blind Box
          </button>

          <button
            id="tour-products-add-btn"
            type="button"
            onClick={onOpenAddProduct}
            className="px-4 py-2 rounded-full bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-xs uppercase shadow-sm flex items-center gap-1 cursor-pointer transition-all"
          >
            <Plus size={14} />
            <span>Đăng Bán Nông Sản</span>
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
              onClick={() => handleStatusChange('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-[#1c2216] text-white shadow-sm'
                  : 'bg-[#f4f7f1] text-[#5b6454] hover:bg-[#e8eee3]'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('ACTIVE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                statusFilter === 'ACTIVE'
                  ? 'bg-[#326318] text-white shadow-sm'
                  : 'bg-[#f4f7f1] text-[#5b6454] hover:bg-[#e8eee3]'
              }`}
            >
              Đang bán
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-[#f4f7f1] text-[#5b6454] hover:bg-[#e8eee3]'
              }`}
            >
              Chờ duyệt
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('REJECTED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                statusFilter === 'REJECTED'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-[#f4f7f1] text-[#5b6454] hover:bg-[#e8eee3]'
              }`}
            >
              Từ chối
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('INACTIVE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                statusFilter === 'INACTIVE'
                  ? 'bg-gray-600 text-white shadow-sm'
                  : 'bg-[#f4f7f1] text-[#5b6454] hover:bg-[#e8eee3]'
              }`}
            >
              Tạm dừng
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929a8c]" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm kiếm nông sản..."
              className="w-full pl-9 pr-3 py-2 bg-[#f4f7f1] rounded-full text-xs text-[#1e2319] outline-none border border-transparent focus:border-[#326318] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Filter Type & Category Dropdown */}
        <div className="px-4 py-2 bg-[#fafcf9] border-b border-[#f1f4ed] flex items-center justify-between gap-2.5 text-xs">
          {/* Phân loại Loại hình */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[11px] font-bold text-[#7e8779] shrink-0 mr-1">
              Phân loại:
            </span>
            <button
              type="button"
              onClick={() => handleTypeChange('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                typeFilter === 'ALL'
                  ? 'bg-[#1c2216] text-white'
                  : 'bg-white border border-[#e2e8dc] text-[#5b6454] hover:bg-[#f4f7f1]'
              }`}
            >
              Tất cả ({itemsByStatus.length})
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('SINGLE')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                typeFilter === 'SINGLE'
                  ? 'bg-[#326318] text-white'
                  : 'bg-white border border-[#e2e8dc] text-[#5b6454] hover:bg-[#f4f7f1]'
              }`}
            >
              Nông sản lẻ ({itemsByStatus.filter((p) => !isBlindBoxItem(p) && !isComboItem(p)).length})
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('MYSTERY_BOX')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                typeFilter === 'MYSTERY_BOX'
                  ? 'bg-[#8a4e1d] text-white'
                  : 'bg-white border border-[#f5ddbd] text-[#8a4e1d] hover:bg-[#fdf5eb]'
              }`}
            >
              Túi mù ({itemsByStatus.filter(isBlindBoxItem).length})
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('COMBO')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                typeFilter === 'COMBO'
                  ? 'bg-[#195962] text-white'
                  : 'bg-white border border-[#cae4e7] text-[#195962] hover:bg-[#edf6f7]'
              }`}
            >
              Combo ({itemsByStatus.filter(isComboItem).length})
            </button>
          </div>

          {/* Icon/Dropdown Bộ lọc Danh mục gọn gàng (chống tràn viền) */}
          <div className="relative shrink-0" ref={categoryDropdownRef}>
            <button
              id="tour-products-category-filter-btn"
              type="button"
              onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                categoryFilter !== 'ALL'
                  ? 'bg-[#326318] text-white border-[#326318] shadow-xs'
                  : 'bg-white border border-[#e2e8dc] text-[#5b6454] hover:bg-[#f4f7f1]'
              }`}
              title="Lọc danh mục nông sản"
            >
              <Filter size={12} />
              <span>{selectedCategory ? selectedCategory.name : 'Danh mục'}</span>
              <ChevronDown
                size={11}
                className={`transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu popover */}
            {isCategoryDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-[#e2e8dc] py-1 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 border-b border-[#f1f4ed] flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#7e8779] uppercase tracking-wider">
                    Chọn danh mục
                  </span>
                  {categoryFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCategoryChange('ALL')
                        setIsCategoryDropdownOpen(false)
                      }}
                      className="text-[10px] text-red-500 hover:underline font-semibold cursor-pointer"
                    >
                      Đặt lại
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto py-1 divide-y divide-[#fafcf9]">
                  <button
                    type="button"
                    onClick={() => {
                      handleCategoryChange('ALL')
                      setIsCategoryDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between hover:bg-[#f4f7f1] transition-colors cursor-pointer ${
                      categoryFilter === 'ALL'
                        ? 'text-[#326318] bg-[#f4f7f1] font-bold'
                        : 'text-[#2e3726]'
                    }`}
                  >
                    <span>Tất cả danh mục</span>
                    {categoryFilter === 'ALL' && <Check size={12} className="text-[#326318]" />}
                  </button>

                  {categories.map((c) => (
                    <button
                      key={c.categoryId}
                      type="button"
                      onClick={() => {
                        handleCategoryChange(c.categoryId)
                        setIsCategoryDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between hover:bg-[#f4f7f1] transition-colors cursor-pointer ${
                        categoryFilter === c.categoryId
                          ? 'text-[#326318] bg-[#f4f7f1] font-bold'
                          : 'text-[#2e3726]'
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      {categoryFilter === c.categoryId && (
                        <Check size={12} className="text-[#326318]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
          ) : paginatedItems.length > 0 ? (
            paginatedItems.map((p) => {
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
                  key={isComboItem(p) ? `combo-${prodId}` : isBlindBoxItem(p) ? `box-${prodId}` : `prod-${prodId}`}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#fafcf9] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative group/thumb shrink-0">
                      <img
                        src={imgUrl}
                        alt={prodName}
                        className="w-14 h-14 rounded-2xl object-cover border border-[#e4ebd9]"
                      />
                      {!isBlindBoxItem(p) && !isComboItem(p) && (
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
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-[#1c2216]">{prodName}</h4>
                        
                        {isBlindBoxItem(p) ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#fdf5eb] text-[#8a4e1d] border border-[#f5ddbd]">
                            Túi Mù
                          </span>
                        ) : isComboItem(p) ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#edf6f7] text-[#195962] border border-[#cae4e7]">
                            Combo
                          </span>
                        ) : null}

                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#f4f7f1] text-[#5b6454]">
                          {catName}
                        </span>
                      </div>

                      <span className="text-xs text-[#7e8779] block mt-0.5">
                        {isBlindBoxItem(p) ? (
                          <>Hộp quà nông sản bí ẩn · Tồn kho: <span className="font-bold text-[#1c2216]">{stock} {unit}</span></>
                        ) : isComboItem(p) ? (
                          <>Set nguyên liệu bữa ăn · Tồn kho: <span className="font-bold text-[#1c2216]">{stock} {unit}</span></>
                        ) : (
                          <>Tồn kho: <span className="font-bold text-[#1c2216]">{stock} {unit}</span>{p.expiryDate && ` · HSD: ${p.expiryDate}`}</>
                        )}
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
                      {/* Nút Quản lý Gallery ảnh: Chỉ dành cho Nông sản đơn lẻ */}
                      {!isBlindBoxItem(p) && !isComboItem(p) && (
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
                      )}

                      {/* Nút Chỉnh sửa */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isComboItem(p)) {
                            onOpenComboBuilder?.(p)
                          } else if (isBlindBoxItem(p)) {
                            onOpenBlindBoxTool?.()
                          } else {
                            setEditModalState({ isOpen: true, product: p })
                          }
                        }}
                        title="Chỉnh sửa thông tin"
                        className="p-2 rounded-xl hover:bg-[#f0f4ec] text-[#616a5b] hover:text-[#326318] cursor-pointer transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>

                      {/* Nút Xóa / Tạm dừng */}
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        title="Tạm dừng / Gỡ sản phẩm"
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

        {/* Thanh Phân Trang (Pagination Control) */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#f1f4ed] bg-[#fafcf9]">
            <Pagination
              pageInfo={{
                page,
                size: pageSize,
                totalElements,
                totalPages,
                first: page === 0,
                last: page >= totalPages - 1,
              }}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}
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

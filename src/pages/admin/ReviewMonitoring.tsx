import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Star,
  Search,
  Store,
  FileText,
  MessageSquare,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Package,
  Layers,
  Image as ImageIcon,
  ChevronDown,
  Check,
} from 'lucide-react'
import { reviewService } from '@/services/review.service'
import type { ReviewResponse } from '@/services/review.types'
import { Button } from '@/components/ui/Button'
import { ReviewOrderDetailModal, ReviewImageLightbox } from '@/features/review'
import { cn } from '@/utils'

type QuickFilter = 'ALL' | 'NEGATIVE' | 'UNREPLIED' | 'WITH_IMAGES'
type SortOrder = 'NEWEST' | 'OLDEST' | 'LOWEST_RATING' | 'HIGHEST_RATING'

export default function ReviewMonitoring() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStar, setSelectedStar] = useState<number | 'ALL'>('ALL')
  const [selectedShop, setSelectedShop] = useState<string>('ALL')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('ALL')
  const [sortOrder, setSortOrder] = useState<SortOrder>('NEWEST')

  // Custom Dropdowns open state & refs
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false)
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const shopDropdownRef = useRef<HTMLDivElement>(null)
  const sortDropdownRef = useRef<HTMLDivElement>(null)

  // Modals state
  const [viewingOrderId, setViewingOrderId] = useState<number | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  const fetchReviews = async () => {
    try {
      setIsLoading(true)
      const res = await reviewService.getAllReviewsAdmin(page, 20)
      if (res.result) {
        setReviews(res.result.content || [])
        setTotalPages(res.result.totalPages || 1)
        setTotalElements(res.result.totalElements || 0)
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách đánh giá:', err)
      setReviews([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [page])

  // Click outside to close custom dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shopDropdownRef.current && !shopDropdownRef.current.contains(event.target as Node)) {
        setIsShopDropdownOpen(false)
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Danh sách các shop duy nhất từ reviews hiện có
  const availableShops = useMemo(() => {
    const shops = new Set<string>()
    reviews.forEach((r) => {
      if (r.shopName) shops.add(r.shopName)
    })
    return Array.from(shops)
  }, [reviews])

  // Đếm số lượng review theo từng shop
  const shopCounts = useMemo(() => {
    const map: Record<string, number> = {}
    reviews.forEach((r) => {
      if (r.shopName) {
        map[r.shopName] = (map[r.shopName] || 0) + 1
      }
    })
    return map
  }, [reviews])

  // Nhãn hiển thị cho sắp xếp
  const sortLabels: Record<SortOrder, string> = {
    NEWEST: 'Mới nhất',
    OLDEST: 'Cũ nhất',
    LOWEST_RATING: 'Sao thấp trước',
    HIGHEST_RATING: 'Sao cao trước',
  }

  // Thống kê KPI toàn sàn
  const stats = useMemo(() => {
    const total = reviews.length
    if (total === 0) {
      return {
        avgRating: 5.0,
        positivePercent: 100,
        negativeCount: 0,
        unrepliedCount: 0,
        hasImagesCount: 0,
      }
    }

    let starSum = 0
    let negative = 0
    let unreplied = 0
    let withImages = 0
    let positive = 0

    reviews.forEach((r) => {
      const star = Math.round(Number(r.ratingStar) || 5)
      starSum += star
      if (star <= 2) negative++
      if (star >= 4) positive++
      if (!r.replyFromShop) unreplied++
      if ((r.imageUrls && r.imageUrls.length > 0) || r.evidence) withImages++
    })

    return {
      avgRating: Math.round((starSum / total) * 10) / 10,
      positivePercent: Math.round((positive / total) * 100),
      negativeCount: negative,
      unrepliedCount: unreplied,
      hasImagesCount: withImages,
    }
  }, [reviews])

  // Lọc và sắp xếp danh sách đánh giá
  const filteredAndSortedList = useMemo(() => {
    return reviews
      .filter((rev) => {
        // Lọc theo số sao
        if (typeof selectedStar === 'number') {
          if (Math.round(Number(rev.ratingStar)) !== selectedStar) return false
        }

        // Lọc theo shop
        if (selectedShop !== 'ALL') {
          if (rev.shopName !== selectedShop) return false
        }

        // Lọc nhanh trạng thái
        if (quickFilter === 'NEGATIVE') {
          if (Math.round(Number(rev.ratingStar)) > 2) return false
        } else if (quickFilter === 'UNREPLIED') {
          if (Boolean(rev.replyFromShop)) return false
        } else if (quickFilter === 'WITH_IMAGES') {
          const hasImg = (rev.imageUrls && rev.imageUrls.length > 0) || Boolean(rev.evidence)
          if (!hasImg) return false
        }

        // Tìm kiếm đa năng
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const bName = (rev.fullName || rev.buyerName || '').toLowerCase()
          const sName = (rev.shopName || '').toLowerCase()
          const pName = (rev.productName || rev.boxType || rev.comboName || '').toLowerCase()
          const cmt = (rev.comment || '').toLowerCase()
          const ord = rev.orderId ? String(rev.orderId) : ''
          return (
            bName.includes(q) ||
            sName.includes(q) ||
            pName.includes(q) ||
            cmt.includes(q) ||
            ord.includes(q)
          )
        }

        return true
      })
      .sort((a, b) => {
        if (sortOrder === 'LOWEST_RATING') {
          return Number(a.ratingStar || 0) - Number(b.ratingStar || 0)
        }
        if (sortOrder === 'HIGHEST_RATING') {
          return Number(b.ratingStar || 0) - Number(a.ratingStar || 0)
        }
        if (sortOrder === 'OLDEST') {
          const dateA = new Date(a.createAt || a.createdAt || 0).getTime()
          const dateB = new Date(b.createAt || b.createdAt || 0).getTime()
          return dateA - dateB
        }
        // Default: NEWEST
        const dateA = new Date(a.createAt || a.createdAt || 0).getTime()
        const dateB = new Date(b.createAt || b.createdAt || 0).getTime()
        return dateB - dateA
      })
  }, [reviews, selectedStar, selectedShop, quickFilter, searchQuery, sortOrder])

  return (
    <div className="space-y-4 p-4 sm:p-5 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* 1. Header & Tiêu đề trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight">
              Giám Sát Đánh Giá &amp; Phản Hồi Toàn Sàn
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              Chế độ chỉ xem
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Theo dõi mức độ hài lòng của khách hàng và chất lượng phục vụ của các nhà vườn mà không can thiệp nội dung.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchReviews()}
          disabled={isLoading}
          leftIcon={<RotateCcw size={13} className={isLoading ? 'animate-spin' : ''} />}
          className="self-start sm:self-auto text-xs font-semibold rounded-md h-8 px-3"
        >
          Làm mới
        </Button>
      </div>

      {/* 2. KPI Metrics Cards (Gọn gàng, bo góc thanh thoát rounded-lg) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Card 1: Tổng đánh giá */}
        <div className="bg-white rounded-lg p-3 border border-line shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Tổng đánh giá
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-ink">
                {totalElements || reviews.length}
              </span>
              <span className="text-[11px] font-semibold text-leaf-700">
                ({stats.positivePercent}% tốt)
              </span>
            </div>
          </div>
          <div className="size-8 rounded-md bg-leaf-50 text-leaf-700 flex items-center justify-center shrink-0">
            <Star size={16} className="fill-leaf-600/20" />
          </div>
        </div>

        {/* Card 2: Điểm trung bình */}
        <div className="bg-white rounded-lg p-3 border border-line shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Điểm sàn trung bình
            </p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-ink">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '5.0'}
              </span>
              <span className="text-[11px] text-ink-muted font-bold">/ 5.0</span>
            </div>
          </div>
          <div className="size-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
        </div>

        {/* Card 3: Cảnh báo 1-2 sao */}
        <div
          className={cn(
            'bg-white rounded-lg p-3 border shadow-2xs flex items-center justify-between',
            stats.negativeCount > 0 ? 'border-rose-300 bg-rose-50/20' : 'border-line',
          )}
        >
          <div>
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Tiêu cực (1 - 2 ⭐)
            </p>
            <p
              className={cn(
                'text-xl font-extrabold mt-0.5',
                stats.negativeCount > 0 ? 'text-rose-600' : 'text-ink',
              )}
            >
              {stats.negativeCount}
            </p>
          </div>
          <div
            className={cn(
              'size-8 rounded-md flex items-center justify-center shrink-0',
              stats.negativeCount > 0
                ? 'bg-rose-100 text-rose-600'
                : 'bg-neutral-100 text-neutral-400',
            )}
          >
            <AlertTriangle size={16} />
          </div>
        </div>

        {/* Card 4: Chưa phản hồi */}
        <div className="bg-white rounded-lg p-3 border border-line shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Chưa Shop phản hồi
            </p>
            <p className="text-xl font-extrabold text-ink mt-0.5">
              {stats.unrepliedCount}
            </p>
          </div>
          <div className="size-8 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Store size={16} />
          </div>
        </div>
      </div>

      {/* 3. Toolbar: Tìm kiếm, Custom Dropdown Chọn Shop & Sắp Xếp */}
      <div className="bg-white rounded-lg p-3 border border-line shadow-2xs space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm theo khách hàng, nhà vườn, sản phẩm, mã #ORD..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-line rounded-md text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-leaf-700 focus:bg-white transition-all h-8"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Custom Dropdown: Chọn Nhà Vườn */}
            {availableShops.length > 0 && (
              <div className="relative" ref={shopDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsShopDropdownOpen((prev) => !prev)
                    setIsSortDropdownOpen(false)
                  }}
                  className={cn(
                    'h-8 px-2.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs',
                    selectedShop !== 'ALL'
                      ? 'bg-leaf-50/80 border-leaf-600/50 text-leaf-800'
                      : 'bg-white border-line text-ink hover:bg-neutral-50',
                  )}
                >
                  <Store size={13} className={selectedShop !== 'ALL' ? 'text-leaf-700' : 'text-ink-muted'} />
                  <span className="max-w-[150px] truncate">
                    {selectedShop === 'ALL' ? 'Tất cả nhà vườn' : selectedShop}
                  </span>
                  <ChevronDown
                    size={13}
                    className={cn(
                      'text-ink-muted transition-transform duration-200 ml-0.5',
                      isShopDropdownOpen && 'rotate-180',
                    )}
                  />
                </button>

                {isShopDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-lg border border-line shadow-lg p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                      Lọc theo Nhà Vườn
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedShop('ALL')
                        setIsShopDropdownOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors text-left cursor-pointer',
                        selectedShop === 'ALL'
                          ? 'bg-leaf-50 text-leaf-800 font-bold'
                          : 'text-ink hover:bg-neutral-100 font-medium',
                      )}
                    >
                      <span>Tất cả nhà vườn</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-ink-muted">({reviews.length})</span>
                        {selectedShop === 'ALL' && <Check size={13} className="text-leaf-700" />}
                      </div>
                    </button>

                    <div className="border-t border-line/60 my-1" />

                    <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                      {availableShops.map((shop) => {
                        const isSelected = selectedShop === shop
                        const count = shopCounts[shop] || 0
                        return (
                          <button
                            key={shop}
                            type="button"
                            onClick={() => {
                              setSelectedShop(shop)
                              setIsShopDropdownOpen(false)
                            }}
                            className={cn(
                              'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors text-left cursor-pointer',
                              isSelected
                                ? 'bg-leaf-50 text-leaf-800 font-bold'
                                : 'text-ink hover:bg-neutral-100 font-medium',
                            )}
                          >
                            <span className="truncate pr-2">{shop}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[11px] text-ink-muted">({count})</span>
                              {isSelected && <Check size={13} className="text-leaf-700" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom Dropdown: Sắp Xếp */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsSortDropdownOpen((prev) => !prev)
                  setIsShopDropdownOpen(false)
                }}
                className={cn(
                  'h-8 px-2.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs',
                  sortOrder !== 'NEWEST'
                    ? 'bg-leaf-50/80 border-leaf-600/50 text-leaf-800'
                    : 'bg-white border-line text-ink hover:bg-neutral-50',
                )}
              >
                <ArrowUpDown size={13} className={sortOrder !== 'NEWEST' ? 'text-leaf-700' : 'text-ink-muted'} />
                <span>{sortLabels[sortOrder]}</span>
                <ChevronDown
                  size={13}
                  className={cn(
                    'text-ink-muted transition-transform duration-200 ml-0.5',
                    isSortDropdownOpen && 'rotate-180',
                  )}
                />
              </button>

              {isSortDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-lg border border-line shadow-lg p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                    Sắp xếp đánh giá
                  </div>

                  {([
                    { key: 'NEWEST' as const, label: 'Mới nhất trước' },
                    { key: 'OLDEST' as const, label: 'Cũ nhất trước' },
                    { key: 'LOWEST_RATING' as const, label: 'Sao thấp trước (Cần xử lý)' },
                    { key: 'HIGHEST_RATING' as const, label: 'Sao cao trước' },
                  ] as const).map((opt) => {
                    const isSelected = sortOrder === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setSortOrder(opt.key)
                          setIsSortDropdownOpen(false)
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors text-left cursor-pointer',
                          isSelected
                            ? 'bg-leaf-50 text-leaf-800 font-bold'
                            : 'text-ink hover:bg-neutral-100 font-medium',
                        )}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check size={13} className="text-leaf-700" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Pills (Mức sao & Trạng thái) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/50 text-xs">
          {/* Mức sao */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] font-semibold text-ink-muted mr-1">Mức sao:</span>
            {([
              { key: 'ALL' as const, label: 'Tất cả' },
              { key: 5, label: '5 ⭐' },
              { key: 4, label: '4 ⭐' },
              { key: 3, label: '3 ⭐' },
              { key: 2, label: '2 ⭐' },
              { key: 1, label: '1 ⭐' },
            ] as const).map((tab) => (
              <button
                key={String(tab.key)}
                type="button"
                onClick={() => setSelectedStar(tab.key)}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer',
                  selectedStar === tab.key
                    ? 'bg-ink text-white'
                    : 'bg-neutral-50 text-ink-muted hover:bg-neutral-100 hover:text-ink border border-line/60',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Trạng thái nhanh */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setQuickFilter('ALL')}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer',
                quickFilter === 'ALL'
                  ? 'bg-leaf-700 text-white font-bold'
                  : 'bg-neutral-50 text-ink-muted hover:bg-neutral-100 border border-line/60',
              )}
            >
              Tất cả ({reviews.length})
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter('NEGATIVE')}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1',
                quickFilter === 'NEGATIVE'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-neutral-50 text-rose-600 hover:bg-rose-50 border border-rose-200/60',
              )}
            >
              <AlertTriangle size={11} />
              <span>Tiêu cực 1-2 ⭐ ({stats.negativeCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter('UNREPLIED')}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1',
                quickFilter === 'UNREPLIED'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-neutral-50 text-amber-700 hover:bg-amber-50 border border-amber-200/60',
              )}
            >
              <Clock size={11} />
              <span>Chưa phản hồi ({stats.unrepliedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter('WITH_IMAGES')}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1',
                quickFilter === 'WITH_IMAGES'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'bg-neutral-50 text-sky-700 hover:bg-sky-50 border border-sky-200/60',
              )}
            >
              <ImageIcon size={11} />
              <span>Có ảnh ({stats.hasImagesCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Danh Sách Đánh Giá: Tinh gọn, Bố cục 2 cột song song (Review vs Reply) */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2.5 bg-white rounded-lg border border-line">
          <Loader2 className="size-7 text-leaf-700 animate-spin" />
          <p className="text-xs text-ink-muted font-bold uppercase tracking-wider">
            Đang tải dữ liệu giám sát đánh giá...
          </p>
        </div>
      ) : filteredAndSortedList.length > 0 ? (
        <div className="space-y-2.5">
          {filteredAndSortedList.map((rev) => {
            const starCount = Math.round(Number(rev.ratingStar) || 5)
            const dateObj = rev.createAt || rev.createdAt ? new Date(rev.createAt || rev.createdAt!) : null
            const dateStr = dateObj
              ? dateObj.toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Gần đây'

            const itemTypeLabel = rev.comboName
              ? 'Combo'
              : rev.boxType
                ? 'Túi Mù'
                : 'Sản Phẩm'

            const ItemIcon = rev.comboName ? Layers : rev.boxType ? Package : LeafIcon

            return (
              <div
                key={rev.id || rev.reviewId}
                className="bg-white rounded-lg p-3.5 border border-line shadow-2xs hover:border-leaf-600/40 transition-colors space-y-2.5"
              >
                {/* Header Dòng 1: Khách hàng + Điểm sao + Thời gian + Đơn hàng + Shop + Mặt hàng */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-line/50 text-xs">
                  {/* Bên trái: Khách hàng, Star, Ngày */}
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-full bg-leaf-100 text-leaf-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                      {(rev.fullName || rev.buyerName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-ink">
                      {rev.fullName || rev.buyerName || `Người dùng #${rev.buyerId}`}
                    </span>

                    {/* Ngôi sao */}
                    <div className="flex text-amber-400 items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={
                            i < starCount
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-neutral-200 fill-neutral-100'
                          }
                        />
                      ))}
                    </div>

                    <span className="text-[11px] text-ink-muted">
                      {dateStr}
                    </span>
                  </div>

                  {/* Bên phải: Mã đơn hàng #ORD, Tên Shop, Mặt hàng */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {/* Nút xem chi tiết đơn hàng */}
                    {rev.orderId && (
                      <button
                        type="button"
                        onClick={() => setViewingOrderId(rev.orderId!)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 hover:bg-leaf-50 hover:text-leaf-800 text-ink font-semibold border border-line/60 transition-colors cursor-pointer"
                        title="Xem chi tiết đơn hàng"
                      >
                        <FileText size={11} className="text-leaf-700" />
                        <span>#ORD-{rev.orderId}</span>
                      </button>
                    )}

                    {/* Badge Shop */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-50 text-ink-muted border border-line/60">
                      <Store size={11} className="text-leaf-700" />
                      <strong className="font-semibold text-ink">{rev.shopName || `Shop #${rev.shopId}`}</strong>
                    </span>

                    {/* Badge Mặt hàng */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-leaf-50/70 text-leaf-800 font-semibold border border-leaf-200/60 max-w-[200px] truncate">
                      <ItemIcon size={11} className="text-leaf-700 shrink-0" />
                      <span className="truncate">
                        {rev.productName || rev.boxType || rev.comboName || 'Nông sản'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Bố cục 2 Cột Song Song: [Nhận xét của Khách (Cột Trái)] ⟷ [Phản hồi Nhà Vườn (Cột Phải)] */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  {/* Cột Trái (Chiếm 7/12 nếu có phản hồi, hoặc full 12/12 nếu chưa) */}
                  <div className={cn(rev.replyFromShop ? 'md:col-span-7' : 'md:col-span-8', 'space-y-2')}>
                    <p className="text-xs text-ink leading-relaxed font-normal">
                      "{rev.comment}"
                    </p>

                    {/* Ảnh đính kèm (Thumbnails nhỏ gọn inline) */}
                    {(rev.imageUrls?.length || rev.evidence) && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {rev.imageUrls && rev.imageUrls.length > 0 ? (
                          rev.imageUrls.map((img, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setLightboxImage(img)}
                              className="size-11 rounded-md overflow-hidden border border-line hover:border-leaf-600 shrink-0 transition-transform hover:scale-105 cursor-pointer relative group"
                              title="Nhấp để phóng to"
                            >
                              <img
                                src={img}
                                alt={`Ảnh ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))
                        ) : rev.evidence ? (
                          <button
                            type="button"
                            onClick={() => setLightboxImage(rev.evidence)}
                            className="size-11 rounded-md overflow-hidden border border-line hover:border-leaf-600 shrink-0 transition-transform hover:scale-105 cursor-pointer"
                            title="Nhấp để phóng to"
                          >
                            <img
                              src={rev.evidence}
                              alt="Ảnh đính kèm"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Cột Phải: Khối Phản Hồi Từ Shop (Gọn gàng, đối xứng) */}
                  <div className={cn(rev.replyFromShop ? 'md:col-span-5' : 'md:col-span-4')}>
                    {rev.replyFromShop ? (
                      <div className="bg-emerald-50/60 p-2.5 rounded-md border border-emerald-200/70 text-xs text-ink space-y-1">
                        <div className="flex items-center gap-1.5 text-leaf-800 font-bold text-[11px]">
                          <MessageSquare size={12} className="text-leaf-700 shrink-0" />
                          <span>Phản hồi từ Nhà Vườn:</span>
                        </div>
                        <p className="text-[11px] text-ink-muted italic leading-relaxed">
                          {rev.replyFromShop}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-amber-50/50 p-2 rounded-md border border-amber-200/60 text-[11px] text-amber-800 flex items-center gap-1.5">
                        <Clock size={12} className="text-amber-600 shrink-0" />
                        <span>Chưa có phản hồi từ nhà vườn</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Dòng Cuối: Phân loại hàng & Lượt thích hữu ích */}
                <div className="flex items-center justify-between text-[10px] text-ink-muted pt-1 border-t border-line/30">
                  <span className="font-semibold text-neutral-400 uppercase tracking-wider">
                    Loại: {itemTypeLabel}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={11} className="text-neutral-400" />
                      <span>{rev.likeCount || 0} hữu ích</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsDown size={11} className="text-neutral-400" />
                      <span>{rev.dislikeCount || 0}</span>
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-line text-xs">
              <span className="text-ink-muted font-medium">
                Trang {page + 1} / {totalPages} (Tổng {totalElements} đánh giá)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1 text-xs rounded-md h-7"
                >
                  Trang trước
                </Button>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 text-xs rounded-md h-7"
                >
                  Trang tiếp
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-line space-y-1.5">
          <Star className="size-8 text-neutral-300 mx-auto" />
          <p className="text-xs font-bold text-ink">
            Không tìm thấy đánh giá nào
          </p>
          <p className="text-[11px] text-ink-muted">
            Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh lại bộ lọc mức sao.
          </p>
        </div>
      )}

      {/* 5. Modal Chi Tiết Đơn Hàng */}
      <ReviewOrderDetailModal
        orderId={viewingOrderId}
        isOpen={Boolean(viewingOrderId)}
        onClose={() => setViewingOrderId(null)}
      />

      {/* 6. Modal Xem Ảnh Phóng To (Lightbox) */}
      <ReviewImageLightbox
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  )
}

function LeafIcon({ size = 12, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  )
}

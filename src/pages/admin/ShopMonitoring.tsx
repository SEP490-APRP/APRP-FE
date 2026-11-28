import React, { useState } from 'react'
import {
  Search,
  Star,
  Loader2,
  AlertCircle,
  Eye,
  Store,
  User,
  Flag,
  CheckCircle2,
  Lock,
  Unlock,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ExternalLink,
  X,
  FileText,
  TrendingUp,
  Clock,
  RefreshCw,
  Award,
} from 'lucide-react'
import type { UserResponse, ShopRiskFlagResponse } from '@/services'
import { userService } from '@/services'
import { useFetchUser, useSetUserActive, useUsersByRole } from '@/features/user'
import Pagination, { PageInfo } from '@/components/ui/Pagination'
import { globalShowAlert, globalShowConfirm } from '@/components/common/Popup'
import { getErrorMessage, ENV } from '@/utils'

const PAGE_SIZE = 20
const SHOP_ROLES = ['SHOP']

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'FLAGGED'

// Kiểm tra xem chuỗi có phải là đường dẫn / link hình ảnh hợp lệ không
const isLikelyImageUrl = (str?: string | null): boolean => {
  if (!str) return false
  const trimmed = str.trim()
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  ) {
    return true
  }
  return /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(trimmed)
}

// Chuẩn hóa URL hình ảnh (hỗ trợ cả full URL Cloudinary và relative path server)
const formatImageUrl = (path?: string | null): string | null => {
  if (!path) return null
  const trimmed = path.trim()
  if (!trimmed) return null
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed
  }
  if (trimmed.includes('/') || trimmed.includes('.')) {
    return `${ENV.API_ORIGIN}/${trimmed.replace(/^\//, '')}`
  }
  return null
}

const ShopMonitoring: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [page, setPage] = useState(0)
  const [selectedShop, setSelectedShop] = useState<UserResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [riskFlags, setRiskFlags] = useState<ShopRiskFlagResponse[]>([])
  const [loadingFlags, setLoadingFlags] = useState(false)
  const [resolvingFlagId, setResolvingFlagId] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null)
  const [imageLoadError, setImageLoadError] = useState(false)

  const shopsQuery = useUsersByRole(SHOP_ROLES, null, page, PAGE_SIZE)
  const fetchUser = useFetchUser()
  const setActive = useSetUserActive()

  const shops = shopsQuery.data?.content ?? []
  const pageInfo: PageInfo | null = shopsQuery.data ?? null
  const loading = shopsQuery.isPending
  const error = shopsQuery.isError ? 'Không thể tải danh sách cửa hàng.' : null

  // Khi admin bấm "Xem chi tiết" một shop
  const handleSelectShop = async (shopId: number) => {
    setDetailLoading(true)
    setRiskFlags([])
    try {
      const user = await fetchUser(shopId)
      setSelectedShop(user)
      if (user) {
        try {
          setLoadingFlags(true)
          const flagsRes = await userService.getShopRiskFlags(shopId)
          setRiskFlags(flagsRes.result || [])
        } catch (flagErr) {
          console.error('Failed to load shop risk flags', flagErr)
        } finally {
          setLoadingFlags(false)
        }
      }
    } catch {
      globalShowAlert('Không thể tải thông tin cửa hàng. Vui lòng thử lại.', 'Lỗi', 'error')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleResolveFlag = async (flagId: number) => {
    if (!selectedShop) return
    const confirmed = await globalShowConfirm(
      'Gỡ cờ vi phạm chất lượng',
      'Bạn có chắc muốn gỡ cờ vi phạm này cho Shop? Nếu số cờ hiệu lực giảm xuống dưới 3, hệ thống sẽ tự động khôi phục 1 sao đánh giá cho gian hàng.'
    )
    if (!confirmed) return

    setResolvingFlagId(flagId)
    try {
      await userService.resolveRiskFlag(flagId, 'Admin xác nhận miễn trừ / giải quyết thỏa đáng')
      globalShowAlert('Đã gỡ cờ rủi ro thành công! Điểm đánh giá của shop đã được cập nhật.', 'Thành công', 'success')
      const flagsRes = await userService.getShopRiskFlags(selectedShop.id)
      setRiskFlags(flagsRes.result || [])
      const updatedShop = await fetchUser(selectedShop.id)
      setSelectedShop(updatedShop)
      void shopsQuery.refetch()
    } catch (err) {
      globalShowAlert(getErrorMessage(err, 'Không thể gỡ cờ rủi ro'), 'Lỗi', 'error')
    } finally {
      setResolvingFlagId(null)
    }
  }

  const handleDeactivate = async (userId: number) => {
    if (!(await globalShowConfirm('Khóa cửa hàng', 'Bạn có chắc chắn muốn tạm khóa cửa hàng này không?')))
      return
    try {
      await setActive.mutateAsync({ userId, active: false })
      globalShowAlert('Đã tạm khóa cửa hàng thành công!', 'Thành công', 'success')
      if (selectedShop?.id === userId) {
        const updated = await fetchUser(userId)
        setSelectedShop(updated)
      }
      void shopsQuery.refetch()
    } catch (err) {
      globalShowAlert(getErrorMessage(err, 'Không thể khóa cửa hàng'), 'Lỗi', 'error')
    }
  }

  const handleActivate = async (userId: number) => {
    if (!(await globalShowConfirm('Mở khóa cửa hàng', 'Bạn có muốn mở khóa cho cửa hàng này hoạt động trở lại?')))
      return
    try {
      await setActive.mutateAsync({ userId, active: true })
      globalShowAlert('Đã mở khóa cửa hàng thành công!', 'Thành công', 'success')
      if (selectedShop?.id === userId) {
        const updated = await fetchUser(userId)
        setSelectedShop(updated)
      }
      void shopsQuery.refetch()
    } catch (err) {
      globalShowAlert(getErrorMessage(err, 'Không thể mở khóa cửa hàng'), 'Lỗi', 'error')
    }
  }

  // Filter client-side
  const filteredShops = shops.filter((s) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim()
      const matchName = (s.shopName || '').toLowerCase().includes(term)
      const matchOwner = (s.fullName || '').toLowerCase().includes(term)
      const matchEmail = (s.email || '').toLowerCase().includes(term)
      const matchPhone = (s.phoneNumber || s.phone || '').toLowerCase().includes(term)
      const matchId = s.id.toString().includes(term)
      if (!matchName && !matchOwner && !matchEmail && !matchPhone && !matchId) return false
    }

    if (statusFilter === 'ACTIVE') return s.status === 'ACTIVE'
    if (statusFilter === 'INACTIVE') return s.status === 'INACTIVE'
    if (statusFilter === 'FLAGGED') return (s.activeRiskFlags ?? 0) > 0

    return true
  })

  // Quick stats
  const totalCount = pageInfo?.totalElements ?? shops.length
  const activeCount = shops.filter((s) => s.status === 'ACTIVE').length
  const inactiveCount = shops.filter((s) => s.status === 'INACTIVE').length
  const pendingCount = shops.filter((s) => s.status === 'PENDING').length
  const flaggedCount = shops.filter((s) => (s.activeRiskFlags ?? 0) > 0).length

  const shopsWithRating = shops.filter((s) => typeof s.ratingAverage === 'number' && s.ratingAverage > 0)
  const avgRating =
    shopsWithRating.length > 0
      ? (shopsWithRating.reduce((sum, s) => sum + (s.ratingAverage || 0), 0) / shopsWithRating.length).toFixed(1)
      : '5.0'

  // Stat cards matching User Report (Image 2)
  const statCards = [
    {
      label: 'CỬA HÀNG',
      value: totalCount,
      icon: Store,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'ĐANG HOẠT ĐỘNG',
      value: activeCount,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'TÀI KHOẢN BỊ KHÓA',
      value: inactiveCount,
      icon: Lock,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'CỜ RỦI RO VI PHẠM',
      value: flaggedCount,
      icon: Flag,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'CHỜ DUYỆT KYC',
      value: pendingCount,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'ĐÁNH GIÁ TRUNG BÌNH',
      value: `${avgRating} ★`,
      icon: Star,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
  ]

  // Tìm URL ảnh chứng nhận/giấy phép thực sự của shop (nếu có)
  const certCandidate =
    selectedShop?.licenseImageUrl ||
    selectedShop?.businessLicenseUrl ||
    (isLikelyImageUrl(selectedShop?.achievement) ? selectedShop?.achievement : null)
  const certImageUrl = formatImageUrl(certCandidate)

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Store className="size-7 text-primary" />
            Giám sát Shop
          </h1>
          <p className="text-xs font-semibold text-gray-400 mt-1">
            Theo dõi hoạt động kinh doanh, uy tín đánh giá và xử lý vi phạm chất lượng của các gian hàng
          </p>
        </div>
        <button
          type="button"
          onClick={() => void shopsQuery.refetch()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-50 text-gray-600 font-bold text-xs hover:bg-gray-100 transition-colors shrink-0"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stat Cards Grid (Exactly matching Image 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`p-3 rounded-2xl ${card.bg}`}>
              <card.icon className={`size-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {card.label}
              </p>
              <p className="text-2xl font-black text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-700 font-bold text-sm">
          <AlertCircle className="size-5 shrink-0" /> {error}
        </div>
      )}

      {/* Main Grid: Danh sách chiếm 2/3 (hoặc 100% khi đóng), Khung chi tiết chiếm 1/3 khi mở */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Danh sách gian hàng */}
        <div className={selectedShop ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col min-h-[640px]">
            {/* Header, Search & Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Store className="size-5 text-primary" />
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                  Danh sách cửa hàng
                </h3>
                <span className="bg-gray-100 text-gray-700 text-xs font-black px-2.5 py-1 rounded-full ml-1">
                  {filteredShops.length} Shop
                </span>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên shop, chủ shop, SĐT..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-5">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Hoạt động
              </button>
              <button
                onClick={() => setStatusFilter('INACTIVE')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                  statusFilter === 'INACTIVE'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Bị khóa
              </button>
              <button
                onClick={() => setStatusFilter('FLAGGED')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                  statusFilter === 'FLAGGED'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Có cờ rủi ro
              </button>
            </div>

            {/* List / Grid of Shop Cards */}
            <div className="flex-1">
              {loading && shops.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <span className="text-xs font-bold text-gray-400">Đang tải danh sách cửa hàng...</span>
                </div>
              ) : filteredShops.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <Store className="size-12 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-400">Không tìm thấy cửa hàng nào phù hợp</p>
                </div>
              ) : (
                <div
                  className={`grid gap-3.5 ${
                    selectedShop
                      ? 'grid-cols-1 md:grid-cols-2'
                      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                  }`}
                >
                  {filteredShops.map((shop) => {
                    const isSelected = selectedShop?.id === shop.id
                    const isFlagged = (shop.activeRiskFlags ?? 0) > 0

                    return (
                      <div
                        key={shop.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                            : 'border-gray-200/80 bg-white hover:border-gray-300 hover:shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-black text-gray-700">#{shop.id}</span>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                              <Star className="size-3 fill-amber-500 text-amber-500" />
                              <span>{shop.ratingAverage ? shop.ratingAverage.toFixed(1) : '5.0'}</span>
                            </div>
                          </div>

                          <h4 className="font-bold text-gray-900 text-sm line-clamp-1 mb-1">
                            {shop.shopName || shop.fullName || 'Gian hàng không tên'}
                          </h4>

                          <p className="text-xs text-gray-500 line-clamp-1 mb-1">
                            Chủ shop: <span className="text-gray-700 font-semibold">{shop.fullName || 'N/A'}</span>
                          </p>

                          {shop.phoneNumber && (
                            <p className="text-[11px] text-gray-400 mb-2">
                              SĐT: {shop.phoneNumber}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex flex-col gap-2.5">
                          {/* Badges */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                shop.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  shop.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-rose-600'
                                }`}
                              ></span>
                              {shop.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}
                            </span>

                            {isFlagged && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                                <Flag size={9} className="fill-rose-600 text-rose-600" />
                                {shop.activeRiskFlags} cờ rủi ro
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSelectShop(shop.id)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                            >
                              <Eye className="size-3.5" /> Xem chi tiết
                            </button>

                            {shop.status === 'ACTIVE' ? (
                              <button
                                type="button"
                                onClick={() => handleDeactivate(shop.id)}
                                className="px-2.5 py-1.5 text-[11px] font-bold rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                Khóa
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleActivate(shop.id)}
                                className="px-2.5 py-1.5 text-[11px] font-bold rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                Mở khóa
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {pageInfo && pageInfo.totalPages > 1 && (
              <div className="pt-4 border-t border-gray-100 mt-4">
                <Pagination
                  pageInfo={pageInfo}
                  onPageChange={(p) => setPage(p)}
                  className="justify-center"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Khung hiển thị thông tin chi tiết (1/3 màn hình) */}
        {selectedShop && (
          <div className="lg:col-span-4 sticky top-6">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              {/* Header: Mã shop | Tên gian hàng + Nút Đóng [X] */}
              <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Chi tiết gian hàng #{selectedShop.id}
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm mt-1.5 leading-snug">
                    {selectedShop.shopName || selectedShop.fullName || 'Gian hàng không tên'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Chủ shop: <span className="font-semibold text-gray-800">{selectedShop.fullName || 'Chưa rõ'}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedShop(null)}
                  className="size-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                  title="Đóng bảng chi tiết"
                >
                  <X className="size-4" />
                </button>
              </div>

              {detailLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="size-6 text-primary animate-spin" />
                  <p className="text-xs font-bold text-gray-400">Đang cập nhật dữ liệu...</p>
                </div>
              ) : (
                <>
                  {/* Block 1: CHỦ GIAN HÀNG & LIÊN HỆ */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                        <User className="size-3.5" />
                      </div>
                      <span className="text-xs font-black text-gray-800 tracking-wide uppercase">
                        CHỦ GIAN HÀNG (OWNER)
                      </span>
                    </div>

                    <div className="bg-[#ffedd5]/80 border border-orange-200/60 rounded-2xl p-3.5 text-xs font-semibold text-gray-800 leading-relaxed space-y-1.5">
                      <div className="flex items-center gap-2">
                        <User className="size-3.5 text-orange-600 shrink-0" />
                        <span>Họ tên: <span className="font-bold">{selectedShop.fullName || 'Chưa cập nhật'}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="size-3.5 text-orange-600 shrink-0" />
                        <span>SĐT: <span className="font-bold">{selectedShop.phoneNumber || selectedShop.phone || 'Chưa cập nhật'}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="size-3.5 text-orange-600 shrink-0" />
                        <span className="truncate">Email: <span className="font-bold">{selectedShop.email || 'Chưa cập nhật'}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="size-3.5 text-orange-600 shrink-0" />
                        <span>Tài khoản: <span className="font-bold">{selectedShop.bankAccount || selectedShop.bankAccountNumber || 'Chưa cung cấp'}</span></span>
                      </div>
                      <div className="flex items-start gap-2 pt-1 border-t border-orange-200/50">
                        <MapPin className="size-3.5 text-orange-600 shrink-0 mt-0.5" />
                        <span>Địa chỉ: <span className="font-bold">{selectedShop.address || 'Chưa cung cấp'}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Block 2: THÔNG TIN GIAN HÀNG */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Store className="size-3.5" />
                      </div>
                      <span className="text-xs font-black text-gray-800 tracking-wide uppercase">
                        NGƯỜI BÁN (SHOP OWNER)
                      </span>
                    </div>

                    <div className="bg-[#dbeafe]/80 border border-blue-200/60 rounded-2xl p-3.5 text-xs font-semibold text-gray-800 leading-relaxed space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          Tên shop: <span className="font-bold text-gray-900">{selectedShop.shopName || selectedShop.fullName}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-full border border-blue-200 text-amber-700 font-bold text-[11px]">
                          <Star className="size-3 fill-amber-500 text-amber-500" />
                          <span>{selectedShop.ratingAverage ? selectedShop.ratingAverage.toFixed(1) : '5.0'} / 5.0</span>
                        </div>
                      </div>

                      {selectedShop.description ? (
                        <p className="text-gray-700 pt-1 border-t border-blue-200/60">
                          Mô tả: {selectedShop.description}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic pt-1 border-t border-blue-200/60">
                          Chưa cập nhật mô tả cửa hàng.
                        </p>
                      )}

                      {/* Mã số giấy phép / MST nếu có */}
                      {selectedShop.license && (
                        <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-[11px]">
                          <span className="text-gray-600 font-medium">Số GPKD / MST:</span>
                          <span className="font-mono font-bold text-gray-900">{selectedShop.license}</span>
                        </div>
                      )}

                      {/* Tiêu chuẩn / Danh hiệu nếu là dạng chữ */}
                      {selectedShop.achievement && !isLikelyImageUrl(selectedShop.achievement) && (
                        <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider shrink-0 flex items-center gap-1">
                            <Award className="size-3 text-emerald-600" /> Tiêu chuẩn:
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 truncate">
                            🌱 {selectedShop.achievement}
                          </span>
                        </div>
                      )}

                      {/* Ảnh giấy tờ chứng nhận (nếu có URL hợp lệ) */}
                      {certImageUrl && (
                        <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-blue-800 font-bold text-[11px]">
                            <FileText className="size-3.5" /> Giấy phép / Chứng nhận cơ sở
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setImageLoadError(false)
                              setPreviewImage({
                                url: certImageUrl,
                                title: `Hồ sơ chứng nhận - ${selectedShop.shopName || selectedShop.fullName}`,
                              })
                            }}
                            className="text-[11px] font-black text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="size-3" /> Xem ảnh
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Block 3: CỜ RỦI RO CHẤT LƯỢNG */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <Flag className="size-3.5" />
                      </div>
                      <span className="text-xs font-black text-gray-800 tracking-wide uppercase">
                        CỜ RỦI RO ({riskFlags.filter((f) => f.isActive).length} cờ hiệu lực)
                      </span>
                    </div>

                    {loadingFlags ? (
                      <div className="bg-gray-50 rounded-2xl p-3 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                        <Loader2 className="size-3.5 animate-spin text-primary" /> Đang tải cờ...
                      </div>
                    ) : riskFlags.length === 0 ? (
                      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 text-xs font-semibold text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        <span>Không có cờ vi phạm chất lượng nào.</span>
                      </div>
                    ) : (
                      <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3 text-xs font-semibold text-gray-800 space-y-2.5">
                        {riskFlags.map((flag) => (
                          <div
                            key={flag.id}
                            className={`p-2.5 rounded-xl border transition-all ${
                              flag.isActive
                                ? 'bg-white border-rose-200 shadow-2xs'
                                : 'bg-gray-50 border-gray-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                  flag.isActive ? 'bg-rose-100 text-rose-800' : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {flag.isActive ? 'Hiệu lực' : 'Đã gỡ'}
                              </span>
                              <span className="font-mono text-[11px] font-bold text-gray-600">
                                #{flag.id} {flag.orderId ? `(Đơn #${flag.orderId})` : ''}
                              </span>

                              {flag.isActive && (
                                <button
                                  type="button"
                                  onClick={() => handleResolveFlag(flag.id)}
                                  disabled={resolvingFlagId === flag.id}
                                  className="px-2 py-0.5 bg-white border border-rose-300 text-rose-700 hover:bg-rose-600 hover:text-white rounded-md text-[10px] font-black transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  {resolvingFlagId === flag.id ? (
                                    <Loader2 size={10} className="animate-spin" />
                                  ) : (
                                    <CheckCircle2 size={10} />
                                  )}
                                  Gỡ cờ
                                </button>
                              )}
                            </div>

                            <p className="text-[11px] text-gray-800 font-medium line-clamp-2">
                              {flag.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Block 4: GHI CHÚ & QUYẾT ĐỊNH ADMIN */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">
                      GHI CHÚ & QUYẾT ĐỊNH ADMIN
                    </span>

                    {selectedShop.status === 'ACTIVE' ? (
                      <div className="bg-[#dcfce7] border border-emerald-200 rounded-2xl p-3.5 space-y-3">
                        <div>
                          <h4 className="font-black text-xs text-gray-900">
                            TRẠNG THÁI: Hoạt động bình thường
                          </h4>
                          <p className="text-[11px] font-medium text-gray-700 mt-0.5">
                            Gian hàng được đăng bán sản phẩm và nhận đơn hàng.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeactivate(selectedShop.id)}
                          className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Lock className="size-3.5" /> Khóa tạm thời
                        </button>
                      </div>
                    ) : (
                      <div className="bg-[#fee2e2] border border-rose-200 rounded-2xl p-3.5 space-y-3">
                        <div>
                          <h4 className="font-black text-xs text-rose-950">
                            TRẠNG THÁI: Đang bị tạm khóa
                          </h4>
                          <p className="text-[11px] font-medium text-rose-900 mt-0.5">
                            Gian hàng bị ngưng giao dịch trên hệ thống.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleActivate(selectedShop.id)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Unlock className="size-3.5" /> Mở khóa gian hàng
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox / Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setPreviewImage(null)
                setImageLoadError(false)
              }}
              className="absolute top-4 right-4 size-9 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-colors z-10 cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <div>
              <div className="flex items-center justify-between mb-3 pr-8">
                <p className="text-xs font-black text-gray-800 uppercase tracking-wider">
                  {previewImage.title}
                </p>
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink size={12} /> Mở tab mới
                </a>
              </div>

              {imageLoadError ? (
                <div className="w-full h-64 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center p-6 text-center gap-2">
                  <AlertCircle className="size-8 text-amber-500" />
                  <p className="text-xs font-bold text-gray-700">
                    Không thể hiển thị hình ảnh này
                  </p>
                  <p className="text-[11px] text-gray-400 font-mono break-all max-w-md">
                    Đường dẫn ảnh: {previewImage.url}
                  </p>
                  <a
                    href={previewImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5"
                  >
                    <ExternalLink size={12} /> Bấm để mở ảnh trực tiếp
                  </a>
                </div>
              ) : (
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  referrerPolicy="no-referrer"
                  onError={() => setImageLoadError(true)}
                  className="w-full max-h-[75vh] object-contain rounded-2xl bg-gray-50 border border-gray-100"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShopMonitoring

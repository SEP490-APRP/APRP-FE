import React, { useState } from 'react'
import {
  Search,
  Star,
  Loader2,
  AlertCircle,
  Eye,
  Truck,
  Bike,
  User,
  CheckCircle2,
  Lock,
  Unlock,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  X,
  FileCheck,
  ShieldCheck,
  TrendingUp,
  Clock,
  RefreshCw,
} from 'lucide-react'
import type { UserResponse } from '@/services'
import { useAllUsers, useApproveKyc, useFetchUser, useSetUserActive } from '@/features/user'
import { globalShowAlert, globalShowConfirm } from '@/components/common/Popup'
import { getErrorMessage, ENV } from '@/utils'

type StatusFilter = 'ALL' | 'ACTIVE' | 'PENDING' | 'INACTIVE'

// Chuẩn hóa URL hình ảnh
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

const ShipperManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedShipper, setSelectedShipper] = useState<UserResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null)
  const [imageLoadError, setImageLoadError] = useState(false)

  const usersQuery = useAllUsers()
  const approve = useApproveKyc()
  const setActive = useSetUserActive()
  const fetchUser = useFetchUser()

  const allShippers = (usersQuery.data ?? []).filter((u) => u.role?.name === 'SHIPPER')
  const loading = usersQuery.isPending
  const error = usersQuery.isError ? 'Không thể tải danh sách shipper. Vui lòng thử lại sau.' : null
  const approvingId = approve.isPending ? approve.variables.userId : null

  // Khi admin bấm "Xem chi tiết" một shipper
  const handleSelectShipper = async (userId: number) => {
    setDetailLoading(true)
    try {
      const user = await fetchUser(userId)
      setSelectedShipper(user)
    } catch {
      globalShowAlert('Không thể tải thông tin hồ sơ shipper. Vui lòng thử lại.', 'Lỗi', 'error')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleApproveShipper = async (userId: number) => {
    const confirmed = await globalShowConfirm(
      'Duyệt hồ sơ Shipper',
      'Bạn đã kiểm tra thông tin bằng lái và hình ảnh, đồng ý kích hoạt tài khoản cho shipper này?'
    )
    if (!confirmed) return

    try {
      await approve.mutateAsync({ userId, roleName: 'SHIPPER' })
      globalShowAlert('Đã phê duyệt hồ sơ shipper thành công!', 'Thành công', 'success')
      if (selectedShipper?.id === userId) {
        const updated = await fetchUser(userId)
        setSelectedShipper(updated)
      }
      void usersQuery.refetch()
    } catch (err) {
      globalShowAlert(getErrorMessage(err, 'Duyệt hồ sơ thất bại'), 'Lỗi', 'error')
    }
  }

  const handleToggleStatus = async (userId: number, action: 'activate' | 'deactivate') => {
    const isAct = action === 'activate'
    const title = isAct ? 'Mở khóa tài khoản' : 'Khóa tài khoản'
    const msg = isAct
      ? 'Bạn có muốn mở khóa cho shipper này tiếp tục nhận đơn vận chuyển?'
      : 'Bạn có chắc chắn muốn tạm khóa tài khoản shipper này?'

    if (!(await globalShowConfirm(title, msg))) return

    try {
      await setActive.mutateAsync({ userId, active: isAct })
      globalShowAlert(
        isAct ? 'Đã mở khóa tài khoản thành công!' : 'Đã tạm khóa tài khoản shipper thành công!',
        'Thành công',
        'success'
      )
      if (selectedShipper?.id === userId) {
        const updated = await fetchUser(userId)
        setSelectedShipper(updated)
      }
      void usersQuery.refetch()
    } catch (err) {
      globalShowAlert(getErrorMessage(err, 'Thao tác thất bại'), 'Lỗi', 'error')
    }
  }

  // Filter client-side
  const filteredShippers = allShippers.filter((s) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim()
      const matchName = (s.fullName || '').toLowerCase().includes(term)
      const matchEmail = (s.email || '').toLowerCase().includes(term)
      const matchPhone = (s.phoneNumber || s.phone || '').toLowerCase().includes(term)
      const matchVehicle = (s.vehicleNumber || s.licensePlate || '').toLowerCase().includes(term)
      const matchId = s.id.toString().includes(term)
      if (!matchName && !matchEmail && !matchPhone && !matchVehicle && !matchId) return false
    }

    if (statusFilter === 'ACTIVE') return s.status === 'ACTIVE'
    if (statusFilter === 'PENDING') return s.status === 'PENDING'
    if (statusFilter === 'INACTIVE') return s.status === 'INACTIVE'

    return true
  })

  // Quick stats
  const totalCount = allShippers.length
  const activeCount = allShippers.filter((s) => s.status === 'ACTIVE').length
  const pendingCount = allShippers.filter((s) => s.status === 'PENDING').length
  const inactiveCount = allShippers.filter((s) => s.status === 'INACTIVE').length
  const registeredVehicles = allShippers.filter((s) => Boolean(s.vehicleNumber || s.licensePlate)).length

  const shippersWithRating = allShippers.filter((s) => typeof s.ratingAverage === 'number' && s.ratingAverage > 0)
  const avgRating =
    shippersWithRating.length > 0
      ? (shippersWithRating.reduce((sum, s) => sum + (s.ratingAverage || 0), 0) / shippersWithRating.length).toFixed(1)
      : '5.0'

  // Stat cards matching User Report (Image 2)
  const statCards = [
    {
      label: 'TỔNG NGƯỜI GIAO HÀNG',
      value: totalCount,
      icon: Truck,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'ĐANG HOẠT ĐỘNG',
      value: activeCount,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'HỒ SƠ CHỜ DUYỆT',
      value: pendingCount,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'TÀI KHOẢN BỊ KHÓA',
      value: inactiveCount,
      icon: Lock,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'PHƯƠNG TIỆN ĐÃ ĐĂNG KÝ',
      value: registeredVehicles,
      icon: Bike,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'ĐÁNH GIÁ TRUNG BÌNH',
      value: `${avgRating} ★`,
      icon: Star,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
  ]

  const licenseImg = formatImageUrl(selectedShipper?.licenseImageUrl)
  const portraitImg = formatImageUrl(selectedShipper?.logoUrl || selectedShipper?.avatar)
  const vehicleDocImg = formatImageUrl(selectedShipper?.vehicleDocImageUrl)

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Truck className="size-7 text-violet-600" />
            Quản lý Người giao hàng
          </h1>
          <p className="text-xs font-semibold text-gray-400 mt-1">
            Quản lý đội ngũ đối tác giao hàng, kiểm tra hồ sơ phương tiện và xét duyệt tài khoản
          </p>
        </div>
        <button
          type="button"
          onClick={() => void usersQuery.refetch()}
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Danh sách người giao hàng */}
        <div className={selectedShipper ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col min-h-[640px]">
            {/* Header, Search & Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Truck className="size-5 text-violet-600" />
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                  Danh sách người giao hàng
                </h3>
                <span className="bg-gray-100 text-gray-700 text-xs font-black px-2.5 py-1 rounded-full ml-1">
                  {filteredShippers.length} Người giao hàng
                </span>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên, SĐT, biển số xe..."
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
                Đang hoạt động
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                  statusFilter === 'PENDING'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Chờ duyệt
              </button>
              <button
                onClick={() => setStatusFilter('INACTIVE')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                  statusFilter === 'INACTIVE'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tạm khóa
              </button>
            </div>

            {/* List / Grid of Shipper Cards */}
            <div className="flex-1">
              {loading && allShippers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <span className="text-xs font-bold text-gray-400">Đang tải danh sách người giao hàng...</span>
                </div>
              ) : filteredShippers.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <Truck className="size-12 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-400">Không tìm thấy người giao hàng nào</p>
                </div>
              ) : (
                <div
                  className={`grid gap-3.5 ${
                    selectedShipper
                      ? 'grid-cols-1 md:grid-cols-2'
                      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                  }`}
                >
                  {filteredShippers.map((shipper) => {
                    const isSelected = selectedShipper?.id === shipper.id

                    return (
                      <div
                        key={shipper.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                            : 'border-gray-200/80 bg-white hover:border-gray-300 hover:shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-black text-gray-700">#{shipper.id}</span>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                              <Star className="size-3 fill-amber-500 text-amber-500" />
                              <span>{shipper.ratingAverage ? shipper.ratingAverage.toFixed(1) : '5.0'}</span>
                            </div>
                          </div>

                          <h4 className="font-bold text-gray-900 text-sm line-clamp-1 mb-1">
                            {shipper.fullName || shipper.email || 'Người giao hàng'}
                          </h4>

                          <p className="text-xs text-gray-500 line-clamp-1 mb-1">
                            Biển số: <span className="font-semibold text-gray-700">{shipper.vehicleNumber || shipper.licensePlate || 'Chưa cung cấp'}</span>
                          </p>

                          {shipper.phoneNumber && (
                            <p className="text-[11px] text-gray-400 mb-2">
                              SĐT: {shipper.phoneNumber}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex flex-col gap-2.5">
                          {/* Badges */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                shipper.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : shipper.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  shipper.status === 'ACTIVE'
                                    ? 'bg-emerald-600'
                                    : shipper.status === 'PENDING'
                                      ? 'bg-amber-600'
                                      : 'bg-rose-600'
                                }`}
                              ></span>
                              {shipper.status === 'ACTIVE'
                                ? 'Hoạt động'
                                : shipper.status === 'PENDING'
                                  ? 'Chờ duyệt'
                                  : 'Tạm ngưng'}
                            </span>

                            <span className="text-[11px] text-gray-400">
                              {shipper.address ? shipper.address.slice(0, 16) + '...' : ''}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSelectShipper(shipper.id)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                            >
                              <Eye className="size-3.5" /> Xem chi tiết
                            </button>

                            {shipper.status === 'PENDING' ? (
                              <button
                                type="button"
                                onClick={() => handleApproveShipper(shipper.id)}
                                disabled={approvingId === shipper.id}
                                className="px-2.5 py-1.5 text-[11px] font-bold rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                              >
                                Duyệt ngay
                              </button>
                            ) : shipper.status === 'ACTIVE' ? (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(shipper.id, 'deactivate')}
                                className="px-2.5 py-1.5 text-[11px] font-bold rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                Khóa
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(shipper.id, 'activate')}
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
          </div>
        </div>

        {/* Right Column: Khung hiển thị thông tin chi tiết */}
        {selectedShipper && (
          <div className="lg:col-span-4 sticky top-6">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              {/* Header: Mã Shipper | Họ tên + Nút Đóng [X] */}
              <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                    Chi tiết Người giao hàng #{selectedShipper.id}
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm mt-1.5 leading-snug">
                    {selectedShipper.fullName || selectedShipper.email || 'Chưa cung cấp tên'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Khu vực: <span className="font-semibold text-gray-800">{selectedShipper.address || 'Toàn quốc'}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedShipper(null)}
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
                  {/* Block 1: THÔNG TIN NGƯỜI GIAO HÀNG */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                        <Truck className="size-3.5" />
                      </div>
                      <span className="text-xs font-black text-gray-800 tracking-wide uppercase">
                        THÔNG TIN NGƯỜI GIAO HÀNG
                      </span>
                    </div>

                    <div className="bg-[#ede9fe]/70 border border-violet-200/60 rounded-2xl p-3.5 text-xs font-semibold text-gray-800 leading-relaxed space-y-1.5">
                      <div className="flex items-center gap-2">
                        <User className="size-3.5 text-violet-600 shrink-0" />
                        <span>Họ tên: <span className="font-bold">{selectedShipper.fullName || 'Chưa cập nhật'}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="size-3.5 text-violet-600 shrink-0" />
                        <span>SĐT: <span className="font-bold">{selectedShipper.phoneNumber || selectedShipper.phone || 'Chưa cập nhật'}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="size-3.5 text-violet-600 shrink-0" />
                        <span className="truncate">Email: <span className="font-bold">{selectedShipper.email || 'Chưa cập nhật'}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="size-3.5 fill-amber-500 text-amber-500 shrink-0" />
                        <span>Đánh giá: <span className="font-bold">{selectedShipper.ratingAverage ? selectedShipper.ratingAverage.toFixed(1) : '5.0'} / 5.0</span></span>
                      </div>
                      <div className="flex items-start gap-2 pt-1 border-t border-violet-200/50">
                        <MapPin className="size-3.5 text-violet-600 shrink-0 mt-0.5" />
                        <span>Khu vực hoạt động: <span className="font-bold">{selectedShipper.address || 'Chưa cập nhật'}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Block 2: PHƯƠNG TIỆN & HỒ SƠ */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                        <Bike className="size-3.5" />
                      </div>
                      <span className="text-xs font-black text-gray-800 tracking-wide uppercase">
                        PHƯƠNG TIỆN & HỒ SƠ
                      </span>
                    </div>

                    <div className="bg-[#ffedd5]/80 border border-orange-200/60 rounded-2xl p-3.5 text-xs font-semibold text-gray-800 leading-relaxed space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Bike className="size-3.5 text-orange-600 shrink-0" />
                        <span>Biển số xe: <span className="font-bold">{selectedShipper.vehicleNumber || selectedShipper.licensePlate || 'Chưa cung cấp'}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileCheck className="size-3.5 text-orange-600 shrink-0" />
                        <span>Bằng lái / CCCD: <span className="font-bold">{selectedShipper.license || selectedShipper.identityCardNumber || 'Chưa cung cấp'}</span></span>
                      </div>

                      {/* Thumbnails */}
                      <div className="pt-2 border-t border-orange-200/60">
                        <span className="text-[11px] font-bold text-orange-900 mb-1.5 block">
                          Giấy tờ xác minh:
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {/* Bằng lái */}
                          <div className="bg-white/90 p-1.5 rounded-xl border border-orange-200 text-center flex flex-col items-center">
                            <span className="text-[9px] font-black uppercase text-gray-500 mb-1">Bằng lái</span>
                            {licenseImg ? (
                              <div
                                onClick={() => {
                                  setImageLoadError(false)
                                  setPreviewImage({
                                    url: licenseImg,
                                    title: 'Bằng lái xe / CCCD',
                                  })
                                }}
                                className="w-full h-16 rounded overflow-hidden relative group cursor-pointer"
                              >
                                <img
                                  src={licenseImg}
                                  alt="Bằng lái"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ExternalLink size={12} className="text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-16 rounded bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-[9px] text-gray-400">
                                Trống
                              </div>
                            )}
                          </div>

                          {/* Chân dung */}
                          <div className="bg-white/90 p-1.5 rounded-xl border border-orange-200 text-center flex flex-col items-center">
                            <span className="text-[9px] font-black uppercase text-gray-500 mb-1">Chân dung</span>
                            {portraitImg ? (
                              <div
                                onClick={() => {
                                  setImageLoadError(false)
                                  setPreviewImage({
                                    url: portraitImg,
                                    title: 'Ảnh chân dung người giao hàng',
                                  })
                                }}
                                className="w-full h-16 rounded overflow-hidden relative group cursor-pointer"
                              >
                                <img
                                  src={portraitImg}
                                  alt="Chân dung"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ExternalLink size={12} className="text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-16 rounded bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-[9px] text-gray-400">
                                Trống
                              </div>
                            )}
                          </div>

                          {/* Giấy tờ xe */}
                          <div className="bg-white/90 p-1.5 rounded-xl border border-orange-200 text-center flex flex-col items-center">
                            <span className="text-[9px] font-black uppercase text-gray-500 mb-1">Cà-vẹt</span>
                            {vehicleDocImg ? (
                              <div
                                onClick={() => {
                                  setImageLoadError(false)
                                  setPreviewImage({
                                    url: vehicleDocImg,
                                    title: 'Giấy tờ xe (Cà-vẹt)',
                                  })
                                }}
                                className="w-full h-16 rounded overflow-hidden relative group cursor-pointer"
                              >
                                <img
                                  src={vehicleDocImg}
                                  alt="Giấy tờ xe"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ExternalLink size={12} className="text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-16 rounded bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-[9px] text-gray-400">
                                Trống
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Block 3: GHI CHÚ & QUYẾT ĐỊNH ADMIN */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">
                      GHI CHÚ & QUYẾT ĐỊNH ADMIN
                    </span>

                    {selectedShipper.status === 'PENDING' ? (
                      <div className="bg-[#fef3c7] border border-amber-200 rounded-2xl p-3.5 space-y-3">
                        <div>
                          <h4 className="font-black text-xs text-amber-950">
                            HỒ SƠ ĐANG CHỜ PHÊ DUYỆT
                          </h4>
                          <p className="text-[11px] font-medium text-amber-900 mt-0.5">
                            Kiểm tra bằng lái, ảnh chân dung và biển số trước khi duyệt.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(selectedShipper.id, 'deactivate')}
                            className="py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            Từ chối
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveShipper(selectedShipper.id)}
                            disabled={approvingId === selectedShipper.id}
                            className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            {approvingId === selectedShipper.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <ShieldCheck className="size-3.5" />
                            )}
                            Duyệt hồ sơ
                          </button>
                        </div>
                      </div>
                    ) : selectedShipper.status === 'ACTIVE' ? (
                      <div className="bg-[#dcfce7] border border-emerald-200 rounded-2xl p-3.5 space-y-3">
                        <div>
                          <h4 className="font-black text-xs text-gray-900">
                            TRẠNG THÁI: Hoạt động bình thường
                          </h4>
                          <p className="text-[11px] font-medium text-gray-700 mt-0.5">
                            Tài xế đủ điều kiện nhận và giao đơn hàng.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(selectedShipper.id, 'deactivate')}
                          className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Lock className="size-3.5" /> Khóa tài khoản
                        </button>
                      </div>
                    ) : (
                      <div className="bg-[#fee2e2] border border-rose-200 rounded-2xl p-3.5 space-y-3">
                        <div>
                          <h4 className="font-black text-xs text-rose-950">
                            TRẠNG THÁI: Tài khoản đang bị tạm khóa
                          </h4>
                          <p className="text-[11px] font-medium text-rose-900 mt-0.5">
                            Shipper đang bị ngừng nhận đơn vận chuyển.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(selectedShipper.id, 'activate')}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Unlock className="size-3.5" /> Mở khóa hoạt động
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

export default ShipperManagement

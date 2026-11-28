import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Loader2,
  X,
  Ticket,
  RefreshCw,
  AlertCircle,
  Trash2,
  Truck,
  Tag,
  Percent,
  Calendar,
  Sparkles,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  Edit3,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  Clock,
  Users,
  LayoutGrid,
  List,
  Search,
} from 'lucide-react'
import {
  voucherService,
  type VoucherResponse,
  type VoucherCreateRequest,
  type VoucherUpdateRequest,
  type VoucherType,
  type VoucherScope,
  type VoucherTarget,
} from '@/services'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { globalShowAlert, globalShowConfirm } from '@/components/common/Popup'

type FilterTab = 'ALL' | 'ACTIVE' | 'UPCOMING' | 'INACTIVE'
type ViewMode = 'GRID' | 'LIST'

export default function VoucherManagement() {
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<VoucherResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('GRID')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Create Form State
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherType, setVoucherType] = useState<VoucherType>('FIXED_AMOUNT')
  const [voucherScope, setVoucherScope] = useState<VoucherScope>('PLATFORM')
  const [voucherTarget, setVoucherTarget] = useState<VoucherTarget>('ORDER')
  const [discountValue, setDiscountValue] = useState<number>(30000)
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(undefined)
  const [minOrderValue, setMinOrderValue] = useState<number>(100000)
  const [claimLimit, setClaimLimit] = useState<number>(500)
  const [perUserLimit, setPerUserLimit] = useState<number>(1)
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 16)
  })
  const [isPublic, setIsPublic] = useState(true)

  // Edit Form State
  const [editClaimLimit, setEditClaimLimit] = useState<number>(500)
  const [editExpiryDate, setEditExpiryDate] = useState<string>('')
  const [editMinOrderValue, setEditMinOrderValue] = useState<number>(0)
  const [editIsPublic, setEditIsPublic] = useState(true)

  // Tính toán dự toán kinh tế sàn (Economic Estimator)
  const economicEstimate = useMemo(() => {
    const minOrder = Number(minOrderValue) || 0
    let maxSubsidy = 0

    if (voucherType === 'FIXED_AMOUNT') {
      maxSubsidy = Number(discountValue) || 0
    } else if (voucherType === 'PERCENTAGE') {
      if (maxDiscount && maxDiscount > 0) {
        maxSubsidy = Number(maxDiscount)
      } else {
        maxSubsidy = (minOrder * (Number(discountValue) || 0)) / 100
      }
    } else if (voucherType === 'FREE_SHIPPING') {
      maxSubsidy = maxDiscount && maxDiscount > 0 ? Number(maxDiscount) : Number(discountValue) || 0
    }

    const commission = minOrder * 0.1
    const netProfit = commission - maxSubsidy
    const netProfitMargin = minOrder > 0 ? (netProfit / minOrder) * 100 : 0
    const breakEvenMinOrder = Math.ceil(maxSubsidy / 0.1)
    const profitableMinOrder = Math.ceil(maxSubsidy / 0.07)

    let status: 'PROFIT' | 'BREAK_EVEN' | 'LOSS' = 'PROFIT'
    if (netProfit < 0) {
      status = 'LOSS'
    } else if (netProfitMargin < 2) {
      status = 'BREAK_EVEN'
    }

    return {
      minOrder,
      maxSubsidy,
      commission,
      netProfit,
      netProfitMargin,
      breakEvenMinOrder,
      profitableMinOrder,
      status,
    }
  }, [minOrderValue, voucherType, discountValue, maxDiscount])

  const handleNumericInput = (
    setter: (val: number) => void,
    maxVal?: number,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const clean = raw.replace(/^0+(?=\d)/, '')
    let num = clean === '' ? 0 : parseInt(clean, 10)
    if (maxVal !== undefined && num > maxVal) {
      num = maxVal
    }
    setter(num)
  }

  const handleMaxDiscountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const clean = raw.replace(/^0+(?=\d)/, '')
    setMaxDiscount(clean === '' ? undefined : parseInt(clean, 10))
  }

  const loadVouchers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await voucherService.getAdminVouchers(0, 100)
      setVouchers(data || [])
    } catch (err: any) {
      console.error('Lỗi tải voucher toàn sàn:', err)
      setError('Không thể tải danh sách voucher toàn sàn.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVouchers()
  }, [])

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => {
      setCopiedCode(null)
    }, 2000)
  }

  // Toggle trạng thái kích hoạt / tạm dừng
  const handleToggleStatus = async (voucher: VoucherResponse) => {
    const isExpired = voucher.expiryDate && new Date(voucher.expiryDate) < new Date()
    if (isExpired && !voucher.active) {
      globalShowAlert(
        'Voucher này đã hết hạn sử dụng. Vui lòng bấm "Chỉnh sửa" để gia hạn thời gian trước khi kích hoạt lại.',
        'Voucher đã hết hạn',
        'warning'
      )
      return
    }

    setTogglingId(voucher.voucherId)
    try {
      await voucherService.toggleAdminVoucher(voucher.voucherId)
      await loadVouchers()
    } catch (err: any) {
      console.error('Lỗi đổi trạng thái voucher:', err)
      globalShowAlert(
        'Lỗi: ' + (err?.response?.data?.message || err.message),
        'Thao tác thất bại',
        'error',
      )
    } finally {
      setTogglingId(null)
    }
  }

  // Xóa vĩnh viễn voucher
  const handleDeleteVoucher = async (voucherId: number, code: string) => {
    const confirmed = await globalShowConfirm(
      'Xác nhận xóa vĩnh viễn',
      `Bạn có chắc chắn muốn xóa voucher "${code}" không? Thao tác này không thể hoàn tác.`,
    )
    if (!confirmed) return

    setDeletingId(voucherId)
    try {
      await voucherService.deleteAdminVoucher(voucherId)
      globalShowAlert(`Đã xóa voucher ${code} thành công.`, 'Thành công', 'success')
      await loadVouchers()
    } catch (err: any) {
      console.error('Lỗi xóa voucher:', err)
      globalShowAlert(
        'Không thể xóa voucher: ' + (err?.response?.data?.message || err.message),
        'Thao tác thất bại',
        'error',
      )
    } finally {
      setDeletingId(null)
    }
  }

  // Mở modal chỉnh sửa
  const openEditModal = (voucher: VoucherResponse) => {
    setEditingVoucher(voucher)
    setEditClaimLimit(voucher.claimLimit || 100)
    setEditMinOrderValue(voucher.minOrderValue || 0)
    setEditIsPublic(voucher.isPublic !== false)
    if (voucher.expiryDate) {
      const d = new Date(voucher.expiryDate)
      setEditExpiryDate(d.toISOString().slice(0, 16))
    } else {
      const d = new Date()
      d.setDate(d.getDate() + 30)
      setEditExpiryDate(d.toISOString().slice(0, 16))
    }
  }

  // Submit cập nhật voucher
  const handleUpdateVoucher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVoucher) return

    setIsSubmitting(true)
    try {
      const payload: VoucherUpdateRequest = {
        claimLimit: Number(editClaimLimit),
        expiryDate: new Date(editExpiryDate).toISOString(),
        minOrderValue: Number(editMinOrderValue),
        isPublic: editIsPublic,
      }

      await voucherService.updateAdminVoucher(editingVoucher.voucherId, payload)
      setEditingVoucher(null)
      globalShowAlert('Đã cập nhật voucher thành công!', 'Thành công', 'success')
      await loadVouchers()
    } catch (err: any) {
      console.error('Lỗi cập nhật voucher:', err)
      globalShowAlert(
        err?.response?.data?.message || 'Không thể cập nhật voucher.',
        'Lỗi cập nhật',
        'error',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Tạo voucher mới
  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voucherCode.trim()) return

    if (voucherScope !== 'WELCOME' && economicEstimate.status === 'LOSS') {
      globalShowAlert(
        `Mức giảm voucher (${economicEstimate.maxSubsidy.toLocaleString('vi-VN')}\u00A0đ) vượt quá 10% hoa hồng sàn thu được từ shop (${economicEstimate.commission.toLocaleString('vi-VN')}\u00A0đ). Vui lòng đặt đơn tối thiểu ít nhất ${economicEstimate.breakEvenMinOrder.toLocaleString('vi-VN')}\u00A0đ để bảo toàn lợi nhuận sàn.`,
        'Voucher gây lỗ cho sàn',
        'error',
      )
      return
    }

    setIsSubmitting(true)
    try {
      const payload: VoucherCreateRequest = {
        voucherCode: voucherCode.trim().toUpperCase(),
        voucherType,
        voucherScope,
        voucherTarget: voucherType === 'FREE_SHIPPING' ? 'SHIPPING' : voucherTarget,
        discountValue: Number(discountValue),
        maxDiscount: voucherType === 'PERCENTAGE' && maxDiscount ? Number(maxDiscount) : undefined,
        minOrderValue: Number(minOrderValue),
        claimLimit: Number(claimLimit),
        perUserLimit: Number(perUserLimit),
        expiryDate: new Date(expiryDate).toISOString(),
        isPublic,
      }

      await voucherService.createAdminVoucher(payload)
      setShowCreateModal(false)
      setVoucherCode('')
      setDiscountValue(30000)
      setMaxDiscount(undefined)
      globalShowAlert('Đã tạo voucher toàn sàn thành công!', 'Thành công', 'success')
      await loadVouchers()
    } catch (err: any) {
      console.error('Lỗi tạo voucher:', err)
      globalShowAlert(
        err?.response?.data?.message || 'Không thể tạo voucher toàn sàn.',
        'Lỗi tạo voucher',
        'error',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Thống kê 4 thẻ KPI nhanh
  const stats = useMemo(() => {
    const now = new Date()
    let active = 0
    let inactive = 0
    let upcoming = 0
    let totalUsed = 0

    vouchers.forEach((vc) => {
      const isExpired = vc.expiryDate && new Date(vc.expiryDate) < now
      const isUpcoming = vc.createAt && new Date(vc.createAt) > now
      const isActive = vc.active !== false && !isExpired

      if (isActive) active++
      else inactive++

      if (isUpcoming) upcoming++
      totalUsed += vc.usedCount || 0
    })

    return {
      total: vouchers.length,
      active,
      inactive,
      upcoming,
      totalUsed,
    }
  }, [vouchers])

  // Lọc danh sách theo Tab & Ô tìm kiếm
  const filteredVouchers = useMemo(() => {
    const now = new Date()
    return vouchers.filter((vc) => {
      const isExpired = vc.expiryDate && new Date(vc.expiryDate) < now
      const isUpcoming = vc.createAt && new Date(vc.createAt) > now
      const isActive = vc.active !== false && !isExpired

      // Lọc theo Tab
      if (filterTab === 'ACTIVE' && !isActive) return false
      if (filterTab === 'INACTIVE' && isActive) return false
      if (filterTab === 'UPCOMING' && !isUpcoming) return false

      // Lọc theo tìm kiếm
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim()
        const matchCode = vc.voucherCode.toLowerCase().includes(term)
        const matchValue = String(vc.discountValue).includes(term)
        const matchType = vc.voucherType.toLowerCase().includes(term)
        if (!matchCode && !matchValue && !matchType) return false
      }

      return true
    })
  }, [vouchers, filterTab, searchTerm])

  // Helper tính thời gian còn lại
  const getRemainingTimeText = (expiryDateStr?: string) => {
    if (!expiryDateStr) return 'Vô thời hạn'
    const now = new Date()
    const exp = new Date(expiryDateStr)
    const diffMs = exp.getTime() - now.getTime()
    if (diffMs <= 0) return 'Đã hết hạn'

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24)

    if (diffDays > 0) {
      return `Còn ${diffDays} ngày`
    }
    return `Còn ${diffHours} giờ`
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* 1. Header chính */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs">
            <Ticket className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">
              QUẢN LÝ MÃ GIẢM GIÁ
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Tạo và phân bổ mã giảm giá do hệ thống tài trợ cho toàn bộ đơn hàng trên sàn CapNong
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadVouchers}
            disabled={loading}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus className="size-4" />
            <span>Tạo mã giảm giá</span>
          </button>
        </div>
      </div>

      {/* 2. Bốn thẻ KPI thống kê nhanh */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Tổng mã giảm giá */}
        <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-2xs flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Ticket className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-500">Tổng mã giảm giá:</p>
            <h4 className="text-2xl font-black text-gray-900 font-display mt-0.5">{stats.total}</h4>
          </div>
        </div>

        {/* Đang hoạt động */}
        <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-2xs flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-500">Đang hoạt động:</p>
            <h4 className="text-2xl font-black text-gray-900 font-display mt-0.5">{stats.active}</h4>
          </div>
        </div>

        {/* Hết hạn / Đã tắt */}
        <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-2xs flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <Clock className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-500">Hết hạn / Đã tắt:</p>
            <h4 className="text-2xl font-black text-gray-900 font-display mt-0.5">{stats.inactive}</h4>
          </div>
        </div>

        {/* Đã sử dụng */}
        <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-2xs flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Users className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-500">Đã sử dụng:</p>
            <h4 className="text-2xl font-black text-gray-900 font-display mt-0.5">
              {stats.totalUsed.toLocaleString('vi-VN')} <span className="text-xs font-semibold text-gray-500">lượt</span>
            </h4>
          </div>
        </div>
      </div>

      {/* 3. Thanh Tabs, Tìm kiếm & Chuyển đổi Grid / List */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        {/* Tabs bên trái */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${filterTab === 'ALL'
              ? 'bg-[#1e3a1e] text-white shadow-2xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            Tất cả ({stats.total})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('ACTIVE')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${filterTab === 'ACTIVE'
              ? 'bg-[#1e3a1e] text-white shadow-2xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            Đang hoạt động ({stats.active})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('UPCOMING')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${filterTab === 'UPCOMING'
              ? 'bg-[#1e3a1e] text-white shadow-2xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            Sắp diễn ra ({stats.upcoming})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('INACTIVE')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${filterTab === 'INACTIVE'
              ? 'bg-[#1e3a1e] text-white shadow-2xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            Đã tắt / Hết hạn ({stats.inactive})
          </button>
        </div>

        {/* Ô Tìm kiếm & Chuyển đổi View Mode */}
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="size-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, mã voucher..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#15803d]/20 transition-all placeholder:text-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Grid vs List */}
          <div className="flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'GRID' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              title="Dạng lưới"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'LIST' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              title="Dạng danh sách"
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-semibold">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4. Danh sách voucher (Grid hoặc List) */}
      {loading ? (
        <div className="py-24 text-center text-sm text-gray-500 space-y-3 bg-white rounded-3xl border border-gray-100 shadow-xs">
          <Loader2 className="size-8 animate-spin text-[#15803d] mx-auto" />
          <p className="font-semibold text-gray-600">Đang tải danh sách voucher toàn sàn...</p>
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200 space-y-3.5 shadow-xs">
          <div className="size-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
            <Ticket size={28} />
          </div>
          <h4 className="font-black text-gray-800 text-base">Không tìm thấy mã giảm giá phù hợp</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            {vouchers.length === 0
              ? 'Hệ thống chưa tạo mã giảm giá toàn sàn nào. Hãy bấm nút "+ Tạo mã giảm giá" để bắt đầu.'
              : 'Không có mã giảm giá nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm.'}
          </p>
        </div>
      ) : viewMode === 'GRID' ? (
        /* ================= DẠNG LƯỚI (GRID 3 CỘT) ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVouchers.map((vc) => {
            const isPercent = vc.voucherType === 'PERCENTAGE'
            const isFreeship =
              vc.voucherType === 'FREE_SHIPPING' || vc.voucherTarget === 'SHIPPING'
            const discountLabel = isPercent
              ? `Giảm ${vc.discountValue}%`
              : vc.voucherType === 'FREE_SHIPPING'
                ? 'Miễn phí vận chuyển'
                : `Giảm ${Number(vc.discountValue).toLocaleString('vi-VN')}đ`

            const isExpired = vc.expiryDate && new Date(vc.expiryDate) < new Date()
            const isActive = vc.active !== false && !isExpired

            const used = vc.usedCount || 0
            const limit = vc.claimLimit || 0
            const usagePercent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0

            // Màu của thanh Progress Bar
            let progressColor = 'bg-[#15803d]'
            if (usagePercent >= 90) progressColor = 'bg-rose-500'
            else if (usagePercent >= 60) progressColor = 'bg-amber-500'

            const remainingText = getRemainingTimeText(vc.expiryDate)

            return (
              <div
                key={vc.voucherId}
                className={`bg-white rounded-[26px] p-6 border transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-md ${isActive
                  ? 'border-gray-200/80 hover:border-[#15803d]/40'
                  : 'border-gray-200/60 bg-gray-50/40 opacity-90'
                  }`}
              >
                <div>
                  {/* Hàng 1: Badge loại voucher & Badge trạng thái */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${isFreeship
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-purple-50 text-purple-800'
                          }`}
                      >
                        {isFreeship ? 'Miễn phí vận chuyển' : 'Toàn sàn'}
                      </span>
                      {isFreeship && vc.voucherScope === 'PLATFORM' && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800">
                          Toàn sàn • Freeship
                        </span>
                      )}
                    </div>

                    {/* Badge trạng thái */}
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                        <span className="size-1.5 rounded-full bg-rose-500" />
                        Hết hạn
                      </span>
                    ) : isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Đang bật
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                        <span className="size-1.5 rounded-full bg-stone-400" />
                        Đã tắt
                      </span>
                    )}
                  </div>

                  {/* Hàng 2: Giá trị giảm & Đơn tối thiểu */}
                  <div className="flex items-center gap-3 my-2">
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${isFreeship
                        ? 'bg-emerald-50 text-emerald-700'
                        : isPercent
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-blue-50 text-blue-700'
                        }`}
                    >
                      {isFreeship ? (
                        <Truck className="size-5" />
                      ) : isPercent ? (
                        <Percent className="size-5" />
                      ) : (
                        <Tag className="size-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-gray-900 tracking-tight leading-snug">
                        {discountLabel}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {vc.minOrderValue
                          ? `Đơn tối thiểu: ${Number(vc.minOrderValue).toLocaleString('vi-VN')}đ`
                          : 'Không giới hạn đơn tối thiểu'}
                      </p>
                    </div>
                  </div>

                  {/* Hàng 3: Hộp Mã Voucher (Promo Code box) có nút Copy */}
                  <div className="bg-gray-50 border border-gray-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between mt-3 mb-3.5">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      Mã: <span className="font-mono font-black text-gray-900 tracking-wider text-sm">{vc.voucherCode}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(vc.voucherCode)}
                      className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-200 transition-colors"
                      title="Sao chép mã"
                    >
                      {copiedCode === vc.voucherCode ? (
                        <Check className="size-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Hàng 4: Tiến độ sử dụng (Progress Bar) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-gray-500">Đã dùng:</span>
                      <span className="text-gray-900 font-black">
                        {used}/{limit || '∞'} ({usagePercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Hàng 5: Hạn sử dụng & Đếm ngược */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-3 pt-2.5 border-t border-gray-100 font-medium">
                    <Calendar className="size-3.5 text-gray-400" />
                    <span>HSD: {vc.expiryDate ? new Date(vc.expiryDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}</span>
                    <span className={`font-semibold ${isExpired ? 'text-rose-600' : 'text-gray-700'}`}>
                      ({remainingText})
                    </span>
                  </div>
                </div>

                {/* Hàng 6: Nút hành động Chỉnh sửa | Bật/Tắt | Xóa */}
                <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2">
                  {/* Nút Chỉnh sửa */}
                  <button
                    type="button"
                    onClick={() => openEditModal(vc)}
                    className="flex-1 py-2 px-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all text-center cursor-pointer shadow-2xs"
                  >
                    Chỉnh sửa
                  </button>

                  {/* Nút Tạm dừng / Kích hoạt lại */}
                  <button
                    type="button"
                    disabled={togglingId === vc.voucherId}
                    onClick={() => handleToggleStatus(vc)}
                    className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all text-center cursor-pointer shadow-2xs ${isActive
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                      : isExpired
                        ? 'bg-emerald-50/50 text-emerald-800/60 border border-emerald-200/50 cursor-pointer'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                  >
                    {togglingId === vc.voucherId ? (
                      <Loader2 className="size-3 animate-spin mx-auto" />
                    ) : isActive ? (
                      'Tạm dừng'
                    ) : (
                      'Kích hoạt lại'
                    )}
                  </button>

                  {/* Nút Xóa */}
                  <button
                    type="button"
                    disabled={deletingId === vc.voucherId}
                    onClick={() => handleDeleteVoucher(vc.voucherId, vc.voucherCode)}
                    className="flex-1 py-2 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition-all text-center cursor-pointer shadow-2xs"
                  >
                    {deletingId === vc.voucherId ? (
                      <Loader2 className="size-3 animate-spin mx-auto" />
                    ) : (
                      'Xóa'
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ================= DẠNG DANH SÁCH (LIST TABLE) ================= */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/60 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Mã Voucher
                  </th>
                  <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Mức giảm giá
                  </th>
                  <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Đơn tối thiểu
                  </th>
                  <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Đã dùng / Số lượng
                  </th>
                  <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Hạn sử dụng
                  </th>
                  <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider text-center">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredVouchers.map((vc) => {
                  const isPercent = vc.voucherType === 'PERCENTAGE'
                  const isFreeship =
                    vc.voucherType === 'FREE_SHIPPING' || vc.voucherTarget === 'SHIPPING'
                  const discountLabel = isPercent
                    ? `Giảm ${vc.discountValue}%`
                    : vc.voucherType === 'FREE_SHIPPING'
                      ? 'Miễn phí VC'
                      : `Giảm ${Number(vc.discountValue).toLocaleString('vi-VN')}đ`

                  const isExpired = vc.expiryDate && new Date(vc.expiryDate) < new Date()
                  const isActive = vc.active !== false && !isExpired

                  const used = vc.usedCount || 0
                  const limit = vc.claimLimit || 0
                  const usagePercent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
                  const remainingText = getRemainingTimeText(vc.expiryDate)

                  return (
                    <tr key={vc.voucherId} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                            {vc.voucherCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(vc.voucherCode)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Sao chép"
                          >
                            {copiedCode === vc.voucherCode ? (
                              <Check className="size-3 text-emerald-600" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-xs text-gray-900">{discountLabel}</span>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-600 font-medium">
                        {vc.minOrderValue ? `${Number(vc.minOrderValue).toLocaleString('vi-VN')}đ` : '0đ'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1 min-w-[120px]">
                          <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                            <span>{used}/{limit || '∞'}</span>
                            <span className="text-gray-400">({usagePercent}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#15803d] rounded-full"
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-gray-700">
                        <div>{vc.expiryDate ? new Date(vc.expiryDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}</div>
                        <span className={`text-[10px] ${isExpired ? 'text-rose-500 font-bold' : 'text-gray-400'}`}>
                          {remainingText}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                            Hết hạn
                          </span>
                        ) : isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Đang bật
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                            Đã tắt
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(vc)}
                            className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 transition-all cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(vc)}
                            className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${isActive
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                              }`}
                          >
                            {isActive ? 'Tắt' : 'Bật'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVoucher(vc.voucherId, vc.voucherCode)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-lg transition-all cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL CHỈNH SỬA VOUCHER ================= */}
      {editingVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setEditingVoucher(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 leading-tight">
                    Chỉnh sửa Voucher ({editingVoucher.voucherCode})
                  </h3>
                  <p className="text-[11px] text-gray-500">Gia hạn thời gian hoặc tăng thêm số lượng phát hành</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingVoucher(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateVoucher} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tổng lượt nhận (Phát hành thêm)
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={editClaimLimit}
                  onChange={handleNumericInput(setEditClaimLimit)}
                  required
                  className="font-bold"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Đã nhận: {editingVoucher.claimedCount || 0} lượt | Đã dùng: {editingVoucher.usedCount || 0} lượt
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Hạn sử dụng mới (Gia hạn)
                </label>
                <Input
                  type="datetime-local"
                  value={editExpiryDate}
                  onChange={(e) => setEditExpiryDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Đơn tối thiểu áp dụng (VNĐ)
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={editMinOrderValue}
                  onChange={handleNumericInput(setEditMinOrderValue)}
                  className="font-bold"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsPublic"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                  className="rounded text-[#15803d] focus:ring-[#15803d]"
                />
                <label htmlFor="editIsPublic" className="text-xs text-gray-700 cursor-pointer select-none">
                  Hiển thị công khai trên toàn sàn
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingVoucher(null)}
                  className="text-xs py-2 px-4 cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-xs py-2 px-5 bg-[#15803d] hover:bg-[#166534] text-white font-bold rounded-xl cursor-pointer"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TẠO VOUCHER TOÀN SÀN ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100 bg-gray-50/50 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Ticket size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 leading-tight">
                    Tạo Mã Giảm Giá Mới
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Thiết lập chương trình khuyến mãi tài trợ bởi sàn CapNong
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mã Voucher (Code) <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="VD: CAPNONG30K, FREESHIPALL"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  required
                  className="uppercase font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Loại giảm giá
                  </label>
                  <select
                    value={voucherType}
                    onChange={(e) => {
                      const nextType = e.target.value as VoucherType
                      setVoucherType(nextType)
                      if (nextType === 'FREE_SHIPPING') {
                        setVoucherTarget('SHIPPING')
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#15803d]"
                  >
                    <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                    <option value="FREE_SHIPPING">Miễn phí vận chuyển (Freeship)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mục tiêu áp dụng
                  </label>
                  <select
                    value={voucherType === 'FREE_SHIPPING' ? 'SHIPPING' : voucherTarget}
                    disabled={voucherType === 'FREE_SHIPPING'}
                    onChange={(e) => setVoucherTarget(e.target.value as VoucherTarget)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#15803d] disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="ORDER">Toàn bộ đơn hàng (ORDER)</option>
                    <option value="SHIPPING">Phí vận chuyển (SHIPPING)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {voucherType === 'PERCENTAGE' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={discountValue === 0 ? '' : discountValue}
                    onChange={handleNumericInput(
                      setDiscountValue,
                      voucherType === 'PERCENTAGE' ? 100 : undefined,
                    )}
                    required
                    className={
                      voucherScope !== 'WELCOME' && economicEstimate.status === 'LOSS'
                        ? 'border-rose-400 focus:ring-rose-500 font-bold'
                        : 'font-bold'
                    }
                  />
                  {voucherType !== 'PERCENTAGE' && discountValue > 0 && (
                    <span className="text-[11px] text-[#15803d] font-semibold mt-1 block whitespace-nowrap">
                      = {Number(discountValue).toLocaleString('vi-VN')}&nbsp;đ
                    </span>
                  )}
                </div>
                {voucherType === 'PERCENTAGE' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Giảm tối đa (VNĐ)
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Không giới hạn"
                      value={maxDiscount ?? ''}
                      onChange={handleMaxDiscountInput}
                      className="font-bold"
                    />
                    {maxDiscount && maxDiscount > 0 ? (
                      <span className="text-[11px] text-gray-500 font-semibold mt-1 block whitespace-nowrap">
                        Tối đa: {Number(maxDiscount).toLocaleString('vi-VN')}&nbsp;đ
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Giá trị đơn hàng tối thiểu (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  {voucherScope !== 'WELCOME' && economicEstimate.status === 'LOSS' && (
                    <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-pulse">
                      <AlertTriangle size={12} /> Cần tối thiểu{' '}
                      <span className="whitespace-nowrap">{economicEstimate.breakEvenMinOrder.toLocaleString('vi-VN')}&nbsp;đ</span> để hòa vốn
                    </span>
                  )}
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={minOrderValue === 0 ? '' : minOrderValue}
                  onChange={handleNumericInput(setMinOrderValue)}
                  className={
                    voucherScope !== 'WELCOME' && economicEstimate.status === 'LOSS'
                      ? 'border-rose-400 focus:ring-rose-500 font-bold'
                      : 'font-bold'
                  }
                />
              </div>

              {/* Hộp Cảnh Báo Lợi Nhuận Sàn */}
              {voucherScope !== 'WELCOME' && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2.5 ${economicEstimate.status === 'LOSS'
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : economicEstimate.status === 'BREAK_EVEN'
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black">
                      {economicEstimate.status === 'LOSS' ? (
                        <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                      ) : (
                        <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                      )}
                      <span>
                        {economicEstimate.status === 'LOSS'
                          ? 'CẢNH BÁO: VOUCHER NÀY SẼ LÀM SÀN BỊ LỖ RÒNG!'
                          : 'Dự toán Lợi nhuận sàn: Biên Lãi An Toàn'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-white/90 rounded-xl border border-gray-200/80 text-[11px]">
                    <div>
                      <span className="text-gray-500 block text-[10px]">Hoa hồng (10%):</span>
                      <span className="font-bold text-gray-900">
                        +{economicEstimate.commission.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Tài trợ voucher:</span>
                      <span className="font-bold text-rose-600">
                        -{economicEstimate.maxSubsidy.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Lợi nhuận ròng:</span>
                      <span className={`font-black ${economicEstimate.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {economicEstimate.netProfit >= 0 ? '+' : ''}
                        {economicEstimate.netProfit.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tổng lượt nhận
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={claimLimit === 0 ? '' : claimLimit}
                    onChange={handleNumericInput(setClaimLimit)}
                    required
                    className="font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Lượt dùng mỗi khách
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={perUserLimit === 0 ? '' : perUserLimit}
                    onChange={handleNumericInput(setPerUserLimit, 100)}
                    required
                    className="font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Hạn sử dụng <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPublicPlatform"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded text-[#15803d] focus:ring-[#15803d]"
                />
                <label
                  htmlFor="isPublicPlatform"
                  className="text-xs text-gray-700 cursor-pointer select-none"
                >
                  Hiển thị công khai trên toàn sàn (Người mua có thể tự bấm lưu mã)
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs py-2 px-4 cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-xs py-2 px-6 bg-[#15803d] hover:bg-[#166534] text-white font-bold rounded-xl cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin inline mr-1" />
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo mã giảm giá'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

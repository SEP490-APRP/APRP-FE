import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Gift, Loader2, Power, X, Calendar, DollarSign, Tag, Check, AlertCircle, Trash2, Sparkles, Percent, Truck, Calculator, AlertTriangle, Info, Search, Ticket } from 'lucide-react'
import { ShopPageHeader } from '@/features/shop'
import {
  voucherService,
  type VoucherResponse,
  type VoucherCreateRequest,
  type VoucherType,
  type VoucherScope,
  type VoucherTarget,
} from '@/services'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CapNongLoading } from '@/components/ui/Loading'
import { globalShowAlert, globalShowConfirm } from '@/components/common/Popup'

interface VouchersProps {
  onOpenCreateVoucher?: () => void
  onInfo?: (msg: string) => void
}

type VoucherStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED'

export default function Vouchers({ onInfo }: VouchersProps) {
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<VoucherStatusFilter>('ALL')

  // Form State
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherType, setVoucherType] = useState<VoucherType>('FIXED_AMOUNT')
  const [voucherTarget, setVoucherTarget] = useState<VoucherTarget>('ORDER')
  const [discountValue, setDiscountValue] = useState<number>(10000)
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(undefined)
  const [minOrderValue, setMinOrderValue] = useState<number>(50000)
  const [claimLimit, setClaimLimit] = useState<number>(100)
  const [perUserLimit, setPerUserLimit] = useState<number>(1)
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 16)
  })
  const [isPublic, setIsPublic] = useState(true)

  // Dự toán thực nhận của Shop (không tính hoa hồng sàn)
  const shopRevenueEstimate = useMemo(() => {
    const minOrder = Number(minOrderValue) || 0
    let discount = 0

    if (voucherType === 'PERCENTAGE') {
      const pct = (Number(discountValue) || 0) / 100
      const rawDisc = minOrder * pct
      if (maxDiscount && maxDiscount > 0) {
        discount = Math.min(rawDisc, Number(maxDiscount))
      } else {
        discount = rawDisc
      }
    } else {
      discount = Number(discountValue) || 0
    }

    const appliedDiscount = minOrder > 0 ? Math.min(minOrder, discount) : discount
    const shopReceive = Math.max(0, minOrder - appliedDiscount)
    const receivePercent = minOrder > 0 ? (shopReceive / minOrder) * 100 : 0

    let status: 'NORMAL' | 'HIGH_DISCOUNT' | 'ZERO' = 'NORMAL'
    if (minOrder > 0 && discount >= minOrder) {
      status = 'ZERO'
    } else if (minOrder > 0 && appliedDiscount / minOrder >= 0.5) {
      status = 'HIGH_DISCOUNT'
    }

    return {
      minOrder,
      discount,
      appliedDiscount,
      shopReceive,
      receivePercent,
      status,
    }
  }, [minOrderValue, voucherType, discountValue, maxDiscount])

  // Thống kê nhanh chỉ số Voucher
  const counts = useMemo(() => {
    const now = new Date()
    let active = 0
    let inactive = 0
    let expired = 0
    let totalUsed = 0

    vouchers.forEach((vc) => {
      const isExpired = Boolean(vc.expiryDate && new Date(vc.expiryDate) < now)
      const isActive = vc.active !== false && !isExpired
      if (isExpired) expired++
      else if (isActive) active++
      else inactive++
      totalUsed += vc.usedCount || 0
    })

    return { total: vouchers.length, active, inactive, expired, totalUsed }
  }, [vouchers])

  // Danh sách voucher sau khi lọc & tìm kiếm
  const filteredVouchers = useMemo(() => {
    const now = new Date()
    return vouchers.filter((vc) => {
      const isExpired = Boolean(vc.expiryDate && new Date(vc.expiryDate) < now)
      const isActive = vc.active !== false && !isExpired

      if (statusFilter === 'ACTIVE' && !isActive) return false
      if (statusFilter === 'INACTIVE' && (vc.active !== false || isExpired)) return false
      if (statusFilter === 'EXPIRED' && !isExpired) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const codeMatch = vc.voucherCode.toLowerCase().includes(q)
        return codeMatch
      }
      return true
    })
  }, [vouchers, statusFilter, searchQuery])


  const loadVouchers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await voucherService.getShopVouchers()
      setVouchers(data || [])
    } catch (err: any) {
      console.error('Lỗi tải voucher của shop:', err)
      setError('Không thể tải danh sách voucher.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVouchers()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCreateModal && !isSubmitting) {
        setShowCreateModal(false)
      }
    }
    if (showCreateModal) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCreateModal, isSubmitting])

  const handleToggleStatus = async (voucherId: number) => {
    setTogglingId(voucherId)
    try {
      await voucherService.toggleShopVoucher(voucherId)
      onInfo?.('Cập nhật trạng thái voucher thành công')
      await loadVouchers()
    } catch (err: any) {
      console.error('Lỗi đổi trạng thái voucher:', err)
      onInfo?.('Lỗi: ' + (err?.response?.data?.message || err.message))
    } finally {
      setTogglingId(null)
    }
  }

  const handleDeleteVoucher = async (voucherId: number, code: string) => {
    if (!(await globalShowConfirm(`Xóa vĩnh viễn voucher "${code}"?`, 'Hành động này không thể hoàn tác.', { danger: true, confirmText: 'Xóa voucher' }))) {
      return
    }
    setDeletingId(voucherId)
    try {
      await voucherService.deleteShopVoucher(voucherId)
      onInfo?.(`Xóa thành công voucher "${code}"`)
      await loadVouchers()
    } catch (err: any) {
      console.error('Lỗi xóa voucher:', err)
      onInfo?.('Không thể xóa voucher: ' + (err?.response?.data?.message || err.message))
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voucherCode.trim()) return

    setIsSubmitting(true)
    try {
      const payload: VoucherCreateRequest = {
        voucherCode: voucherCode.trim().toUpperCase(),
        voucherType,
        voucherScope: 'SHOP',
        voucherTarget: voucherType === 'FREE_SHIPPING' ? 'SHIPPING' : voucherTarget,
        discountValue: Number(discountValue),
        maxDiscount: voucherType === 'PERCENTAGE' && maxDiscount ? Number(maxDiscount) : undefined,
        minOrderValue: Number(minOrderValue),
        claimLimit: Number(claimLimit),
        perUserLimit: Number(perUserLimit),
        expiryDate: new Date(expiryDate).toISOString(),
        isPublic,
      }

      await voucherService.createShopVoucher(payload)
      onInfo?.('Đã tạo voucher mới thành công!')
      setShowCreateModal(false)
      // Reset form
      setVoucherCode('')
      setDiscountValue(10000)
      setMaxDiscount(undefined)
      await loadVouchers()
    } catch (err: any) {
      console.error('Lỗi tạo voucher:', err)
      void globalShowAlert(err?.response?.data?.message || 'Không thể tạo voucher. Vui lòng kiểm tra lại thông tin.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <ShopPageHeader
        title="Mã Giảm Giá & Khuyến Mãi Của Shop"
        subtitle="Tạo và quản lý các mã giảm giá dành cho khách mua nông sản tại shop của bạn"
        actions={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-[#2b5619] hover:bg-[#1f3f12] text-white font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all shrink-0"
          >
            <Plus size={15} />
            <span>Tạo Voucher Mới</span>
          </button>
        }
      />

      {/* Thống kê nhanh chỉ số Voucher */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-[#e8ece3] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#717a6c] uppercase block">Tổng mã voucher</span>
            <span className="text-xl font-black text-[#1c2216]">{counts.total}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center">
            <Ticket size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-[#e8ece3] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#717a6c] uppercase block">Đang hoạt động</span>
            <span className="text-xl font-black text-[#326318]">{counts.active}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#326318] flex items-center justify-center">
            <Check size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-[#e8ece3] shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[11px] font-bold text-[#717a6c] uppercase block">Lượt khách đã dùng</span>
            <span className="text-xl font-black text-amber-700">{counts.totalUsed}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Tag size={18} />
          </div>
        </div>
      </div>

      {/* Toolbar: Bộ lọc trạng thái + Tìm kiếm mã voucher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-lg border border-[#e8ece3] shadow-xs">
        {/* Segmented Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-[#326318] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Tất cả ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-[#326318] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Đang chạy ({counts.active})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'INACTIVE'
                ? 'bg-[#326318] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Tạm dừng ({counts.inactive})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('EXPIRED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'EXPIRED'
                ? 'bg-[#326318] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Hết hạn ({counts.expired})
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã voucher..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#326318] focus:border-[#326318] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Danh sách Voucher */}
      <div>
        <div className="w-full">
          {loading ? (
            <CapNongLoading
              className="!min-h-[300px]"
              message="Đang tải danh sách voucher của shop..."
              subMessage="Kênh khuyến mãi & ưu đãi nhà vườn CapNong"
              size="md"
            />
          ) : filteredVouchers.length === 0 ? (
            <div className="bg-white rounded-lg p-10 text-center border border-dashed border-[#e8ece3] space-y-3">
              <Gift size={36} className="mx-auto text-stone-300" />
              <h4 className="font-bold text-sm text-stone-700">
                {searchQuery || statusFilter !== 'ALL' ? 'Không tìm thấy voucher phù hợp' : 'Chưa có mã giảm giá nào'}
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Thử thay đổi từ khóa tìm kiếm hoặc chuyển sang tab trạng thái khác.'
                  : 'Hãy tạo voucher đầu tiên để thu hút người mua và tăng số lượng đơn hàng nông sản.'}
              </p>
              {!(searchQuery || statusFilter !== 'ALL') && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2 text-xs py-2 px-5 bg-[#326318] hover:bg-[#254b12] text-white rounded-lg"
                >
                  Tạo Voucher ngay
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3.5 grid-cols-1 md:grid-cols-2">
              {filteredVouchers.map((vc) => {
                const isPercent = vc.voucherType === 'PERCENTAGE'
                const discountLabel = isPercent
                  ? `Giảm ${vc.discountValue}%`
                  : vc.voucherType === 'FREE_SHIPPING'
                    ? 'Freeship (Miễn phí ship)'
                    : `Giảm ${Number(vc.discountValue).toLocaleString('vi-VN')}đ`

                const isExpired = Boolean(vc.expiryDate && new Date(vc.expiryDate) < new Date())
                const isActive = vc.active !== false && !isExpired
                const usedPct = vc.claimLimit ? Math.min(100, Math.round(((vc.usedCount || 0) / vc.claimLimit) * 100)) : 0

                return (
                  <div
                    key={vc.voucherId}
                    className={`bg-white rounded-lg p-4 border transition-all flex flex-col justify-between gap-3 shadow-xs relative ${
                      isActive
                        ? 'border-[#e8ece3] hover:border-[#326318]/40'
                        : 'border-stone-200 bg-stone-50/60 opacity-75'
                    }`}
                  >
                    {/* Top Row: Mã + Badges + Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                            isActive ? 'bg-[#326318]/10 text-[#326318]' : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          <Gift size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-black text-[#1c2216] font-mono tracking-wide">
                              {vc.voucherCode}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                vc.voucherTarget === 'SHIPPING' || vc.voucherType === 'FREE_SHIPPING'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {vc.voucherTarget === 'SHIPPING' || vc.voucherType === 'FREE_SHIPPING'
                                ? 'Freeship Shop'
                                : 'Đơn hàng'}
                            </span>
                            {!vc.isPublic && (
                              <span className="text-[10px] font-semibold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md border border-stone-200">
                                Ẩn
                              </span>
                            )}
                            {isExpired && (
                              <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200">
                                Hết hạn
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-[#8a4e1d] mt-1">
                            {discountLabel}
                            {vc.minOrderValue ? ` · Đơn từ ${Number(vc.minOrderValue).toLocaleString('vi-VN')}đ` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Right Action: Enterprise Toggle Switch */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-2">
                          {!vc.active && (
                            <button
                              type="button"
                              disabled={deletingId === vc.voucherId}
                              onClick={() => handleDeleteVoucher(vc.voucherId, vc.voucherCode)}
                              title="Xóa vĩnh viễn voucher đã tạm dừng"
                              className="p-1.5 rounded-lg transition-all cursor-pointer text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              {deletingId === vc.voucherId ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            disabled={togglingId === vc.voucherId}
                            onClick={() => handleToggleStatus(vc.voucherId)}
                            title={isActive ? 'Gạt để tạm dừng voucher' : 'Gạt để kích hoạt lại voucher'}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-[#326318] focus:ring-offset-1 disabled:opacity-60 ${
                              isActive ? 'bg-[#326318]' : 'bg-stone-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                        <span className={`text-[10px] font-bold ${isActive ? 'text-[#326318]' : 'text-stone-400'}`}>
                          {togglingId === vc.voucherId ? 'Đang lưu...' : isActive ? 'Đang bật' : 'Tạm dừng'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Tiến độ sử dụng + HSD */}
                    <div className="pt-2 border-t border-[#f1f4ed] space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-[#555f4d]">
                        <span>
                          Đã dùng: <strong>{vc.usedCount || 0}</strong> / {vc.claimLimit || '∞'}
                        </span>
                        <span>
                          HSD: {vc.expiryDate ? new Date(vc.expiryDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                        </span>
                      </div>
                      {vc.claimLimit ? (
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              usedPct >= 90 ? 'bg-rose-500' : 'bg-[#326318]'
                            }`}
                            style={{ width: `${usedPct}%` }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Tạo Voucher Mới */}
      {showCreateModal &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-voucher-title"
            onClick={() => !isSubmitting && setShowCreateModal(false)}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] max-w-2xl w-full shadow-2xl border border-[#e2dcce] max-h-[92vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-[#fafcf9] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#326318] flex items-center justify-center border border-emerald-100/80 shadow-inner">
                    <Gift size={20} />
                  </div>
                  <div>
                    <h3 id="create-voucher-title" className="font-black text-base sm:text-lg text-[#1c2216]">
                      Tạo Mã Giảm Giá Mới
                    </h3>
                    <p className="text-xs text-stone-500">
                      Cung cấp ưu đãi riêng cho khách mua nông sản tại gian hàng của bạn
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !isSubmitting && setShowCreateModal(false)}
                  disabled={isSubmitting}
                  aria-label="Đóng"
                  className="text-stone-400 hover:text-stone-700 p-2 rounded-full hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body + Sticky Footer */}
              <form id="create-voucher-form" onSubmit={handleCreateVoucher} className="flex-1 min-h-0 flex flex-col">
                <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              {/* 1. Thẻ xem trước Voucher trực tiếp (Live Preview Ticket) */}
              <div className="rounded-lg border-2 border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 p-4 shadow-xs relative overflow-hidden">
                <div className="absolute top-2 right-2 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Xem trước voucher
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  <span className="font-mono text-xs font-black uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    {voucherCode.trim() ? voucherCode.trim() : 'MÃ_VOUCHER'}
                  </span>
                  {voucherType === 'FREE_SHIPPING' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                      Freeship Shop
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      Đơn hàng
                    </span>
                  )}
                  {isPublic ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Công khai
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                      Mã riêng (ẩn)
                    </span>
                  )}
                </div>
                <div className="mt-1">
                  <p className="text-base sm:text-lg font-black text-stone-900">
                    {voucherType === 'PERCENTAGE'
                      ? `Giảm ${discountValue || 0}%${maxDiscount ? ` (Tối đa ${Number(maxDiscount).toLocaleString('vi-VN')}đ)` : ''}`
                      : voucherType === 'FREE_SHIPPING'
                        ? 'Miễn phí vận chuyển (Freeship)'
                        : `Giảm ${Number(discountValue || 0).toLocaleString('vi-VN')}đ`}
                  </p>
                  <p className="text-xs text-stone-500 font-medium mt-0.5">
                    Áp dụng cho đơn nông sản từ {Number(minOrderValue || 0).toLocaleString('vi-VN')}đ
                    {expiryDate && ` · HSD: ${new Date(expiryDate).toLocaleDateString('vi-VN')}`}
                  </p>
                </div>
              </div>

              {/* 2. Mã Voucher (Code) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-800">
                    Mã Voucher (Code) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const prefixes = ['TRIAN', 'CAPNONG', 'FREESHIP', 'UUDAI', 'RAUSACH']
                      const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)]
                      const randomNum = Math.floor(10 + Math.random() * 90)
                      setVoucherCode(`${randomPrefix}${randomNum}`)
                    }}
                    className="text-[11px] font-bold text-[#326318] hover:text-[#254b12] flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={12} />
                    <span>Gợi ý mã ngẫu nhiên</span>
                  </button>
                </div>
                <div className="relative">
                  <Input
                    placeholder="VD: GIAM20K, RAUSACH15, MIENPHISHIP"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    required
                    className="uppercase font-mono font-bold text-sm h-11 tracking-wider bg-stone-50/60 border-stone-200 focus:bg-white focus:ring-2 focus:ring-[#326318]/20 focus:border-[#326318] rounded-lg"
                  />
                </div>
              </div>

              {/* 3. Phân loại ưu đãi (Segmented Control Tabs) */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Loại hình giảm giá <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-stone-100/80 rounded-lg border border-stone-200/60">
                  <button
                    type="button"
                    onClick={() => {
                      setVoucherType('FIXED_AMOUNT')
                      if (discountValue > 500000) setDiscountValue(20000)
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${voucherType === 'FIXED_AMOUNT'
                        ? 'bg-white text-[#326318] shadow-sm font-black'
                        : 'text-stone-600 hover:text-stone-900'
                      }`}
                  >
                    <DollarSign size={14} />
                    <span>Số tiền (VNĐ)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoucherType('PERCENTAGE')
                      if (discountValue > 100) setDiscountValue(10)
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${voucherType === 'PERCENTAGE'
                        ? 'bg-white text-[#326318] shadow-sm font-black'
                        : 'text-stone-600 hover:text-stone-900'
                      }`}
                  >
                    <Percent size={14} />
                    <span>Phần trăm (%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoucherType('FREE_SHIPPING')
                      setVoucherTarget('SHIPPING')
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${voucherType === 'FREE_SHIPPING'
                        ? 'bg-white text-[#326318] shadow-sm font-black'
                        : 'text-stone-600 hover:text-stone-900'
                      }`}
                  >
                    <Truck size={14} />
                    <span>Miễn phí vận chuyển</span>
                  </button>
                </div>
              </div>

              {/* 4. Mục tiêu áp dụng (Target) */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Mục tiêu áp dụng
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={voucherType === 'FREE_SHIPPING'}
                    onClick={() => setVoucherTarget('ORDER')}
                    className={`py-2.5 px-3.5 rounded-lg border text-xs font-semibold text-left transition-all cursor-pointer ${voucherTarget === 'ORDER' && voucherType !== 'FREE_SHIPPING'
                        ? 'border-[#326318] bg-[#f4f7f1] text-[#326318] font-bold ring-1 ring-[#326318]'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    Giảm trực tiếp vào tiền hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoucherTarget('SHIPPING')}
                    className={`py-2.5 px-3.5 rounded-lg border text-xs font-semibold text-left transition-all cursor-pointer ${voucherTarget === 'SHIPPING' || voucherType === 'FREE_SHIPPING'
                        ? 'border-[#326318] bg-[#f4f7f1] text-[#326318] font-bold ring-1 ring-[#326318]'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                  >
                    Giảm trừ vào phí vận chuyển
                  </button>
                </div>
              </div>

              {/* 5. Giá trị giảm & Giảm tối đa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {voucherType === 'PERCENTAGE'
                      ? 'Phần trăm giảm (%)'
                      : 'Mức tiền giảm (VNĐ)'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      max={voucherType === 'PERCENTAGE' ? 100 : 10000000}
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      required
                      className="h-10 text-xs font-bold rounded-lg pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      {voucherType === 'PERCENTAGE' ? '%' : 'đ'}
                    </span>
                  </div>
                  {voucherType !== 'PERCENTAGE' && discountValue > 0 && (
                    <span className="text-[11px] text-[#326318] font-medium mt-1 block whitespace-nowrap">
                      = {Number(discountValue).toLocaleString('vi-VN')}&nbsp;đ
                    </span>
                  )}
                </div>

                {voucherType === 'PERCENTAGE' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Giảm tối đa (VNĐ)
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="Để trống nếu không giới hạn"
                        value={maxDiscount ?? ''}
                        onChange={(e) =>
                          setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)
                        }
                        className="h-10 text-xs font-bold rounded-lg pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                        đ
                      </span>
                    </div>
                    {maxDiscount && maxDiscount > 0 ? (
                      <span className="text-[11px] text-stone-500 font-medium mt-1 block whitespace-nowrap">
                        Tối đa: {Number(maxDiscount).toLocaleString('vi-VN')}&nbsp;đ
                      </span>
                    ) : null}
                  </div>
                )}

                {/* Đơn tối thiểu */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Đơn hàng tối thiểu (VNĐ)
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={minOrderValue ?? ''}
                      onChange={(e) => setMinOrderValue(Number(e.target.value))}
                      className="h-10 text-xs font-bold rounded-lg pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      đ
                    </span>
                  </div>
                  {minOrderValue > 0 && (
                    <span className="text-[11px] text-stone-500 font-medium mt-1 block whitespace-nowrap">
                      Áp dụng từ: {Number(minOrderValue).toLocaleString('vi-VN')}&nbsp;đ
                    </span>
                  )}
                </div>
              </div>

              {/* Hộp Cảnh Báo & Dự Toán Thực Nhận Của Shop (Không tính hoa hồng sàn) */}
              <div
                className={`p-3.5 rounded-lg border text-xs space-y-2.5 transition-all ${shopRevenueEstimate.status === 'ZERO'
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                    : shopRevenueEstimate.status === 'HIGH_DISCOUNT'
                      ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                      : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Calculator
                      size={14}
                      className={
                        shopRevenueEstimate.status === 'ZERO'
                          ? 'text-rose-600'
                          : shopRevenueEstimate.status === 'HIGH_DISCOUNT'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                      }
                    />
                    <span>Dự toán Doanh thu Shop thực nhận (Chưa tính hoa hồng sàn)</span>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${shopRevenueEstimate.status === 'ZERO'
                        ? 'bg-rose-600 text-white'
                        : shopRevenueEstimate.status === 'HIGH_DISCOUNT'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                  >
                    {shopRevenueEstimate.status === 'ZERO'
                      ? 'Thực nhận 0đ'
                      : shopRevenueEstimate.status === 'HIGH_DISCOUNT'
                        ? 'Giảm sâu > 50%'
                        : 'Mức giảm an toàn'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 px-2.5 bg-white/80 rounded-lg border border-stone-200/60 text-[11px]">
                  <div>
                    <span className="text-stone-500 block text-[10px]">Đơn tối thiểu:</span>
                    <span className="font-bold text-stone-900 whitespace-nowrap">
                      {shopRevenueEstimate.minOrder > 0
                        ? `${shopRevenueEstimate.minOrder.toLocaleString('vi-VN')}\u00A0đ`
                        : 'Mọi giá trị'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px]">Shop tự giảm:</span>
                    <span className="font-bold text-rose-600 whitespace-nowrap">
                      -{shopRevenueEstimate.appliedDiscount.toLocaleString('vi-VN')}&nbsp;đ
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px]">Shop thực nhận:</span>
                    <span
                      className={`font-black whitespace-nowrap ${shopRevenueEstimate.shopReceive > 0
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                        }`}
                    >
                      +{shopRevenueEstimate.shopReceive.toLocaleString('vi-VN')}&nbsp;đ
                      {shopRevenueEstimate.minOrder > 0 && (
                        <span className="text-[10px] font-normal block text-stone-500">
                          (Còn {shopRevenueEstimate.receivePercent.toFixed(0)}% tiền hàng)
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {shopRevenueEstimate.status === 'ZERO' && (
                  <div className="flex items-start gap-1.5 text-[11px] text-rose-700 leading-tight">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    <span>
                      <strong>Cảnh báo:</strong> Mức giảm giá bằng hoặc lớn hơn giá trị đơn tối thiểu. Với các đơn hàng bằng mức tối thiểu, Shop sẽ <strong>thực nhận 0đ</strong> (tặng miễn phí nông sản). Hệ thống không ngăn cản bạn tạo voucher này nếu đây là chương trình quà tặng tri ân đặc biệt của shop.
                    </span>
                  </div>
                )}

                {shopRevenueEstimate.status === 'HIGH_DISCOUNT' && (
                  <div className="flex items-start gap-1.5 text-[11px] text-amber-800 leading-tight">
                    <Info size={13} className="shrink-0 mt-0.5" />
                    <span>
                      <strong>Lưu ý:</strong> Voucher này giảm hơn 50% giá trị đơn hàng tối thiểu. Hãy cân nhắc tỷ suất lợi nhuận sau chi phí canh tác và đóng gói.
                    </span>
                  </div>
                )}

                {shopRevenueEstimate.status === 'NORMAL' && (
                  <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-medium">
                    <Check size={13} className="text-emerald-600 shrink-0" />
                    <span>
                      Mức giảm hợp lý. Shop sẽ thực nhận <strong className="whitespace-nowrap">{shopRevenueEstimate.shopReceive.toLocaleString('vi-VN')}&nbsp;đ</strong> trên mỗi đơn hàng đạt điều kiện tối thiểu (chưa tính phí hoa hồng sàn).
                    </span>
                  </div>
                )}

                <p className="text-[10px] text-stone-400 italic">
                  * Lưu ý: Con số trên là doanh thu bán hàng thực nhận của Shop trước khi trừ 10% phí hoa hồng dịch vụ sàn.
                </p>
              </div>


              {/* 6. Số lượng phát hành & Lượt dùng mỗi khách */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Tổng số lượt phát hành
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={claimLimit}
                    onChange={(e) => setClaimLimit(Number(e.target.value))}
                    required
                    className="h-10 text-xs font-bold rounded-lg"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Tổng số lần voucher có thể được nhận
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Mỗi khách được dùng
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(Number(e.target.value))}
                    required
                    className="h-10 text-xs font-bold rounded-lg"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Số lần dùng tối đa cho 1 tài khoản
                  </span>
                </div>
              </div>

              {/* 7. Hạn sử dụng */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-800">
                    Hạn sử dụng <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-stone-400">Nhanh:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date()
                        d.setDate(d.getDate() + 7)
                        setExpiryDate(d.toISOString().slice(0, 16))
                      }}
                      className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 font-bold text-stone-600 transition-colors cursor-pointer"
                    >
                      +7 ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date()
                        d.setDate(d.getDate() + 14)
                        setExpiryDate(d.toISOString().slice(0, 16))
                      }}
                      className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 font-bold text-stone-600 transition-colors cursor-pointer"
                    >
                      +14 ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date()
                        d.setDate(d.getDate() + 30)
                        setExpiryDate(d.toISOString().slice(0, 16))
                      }}
                      className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 font-bold text-stone-600 transition-colors cursor-pointer"
                    >
                      +30 ngày
                    </button>
                  </div>
                </div>
                <Input
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                  className="h-10 text-xs font-medium rounded-lg border-stone-200"
                />
              </div>

              {/* 8. Tùy chọn hiển thị công khai */}
              <label
                className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${isPublic
                    ? 'bg-emerald-50/50 border-emerald-200 ring-1 ring-emerald-300/60'
                    : 'bg-stone-50 border-stone-200'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-[#326318] rounded focus:ring-[#326318] accent-[#326318] cursor-pointer shrink-0"
                />
                <div>
                  <h5 className="text-xs font-bold text-stone-900">
                    Hiển thị công khai trên gian hàng
                  </h5>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                    {isPublic
                      ? 'Khách hàng có thể nhìn thấy và tự bấm lưu mã này ngay tại trang cửa hàng của bạn.'
                      : 'Mã voucher sẽ được ẩn khỏi trang gian hàng. Bạn có thể gửi mã riêng cho khách VIP hoặc qua tin nhắn chat.'}
                  </p>
                </div>
              </label>
                </div>

                {/* Footer Buttons */}
                <div className="px-6 py-4 border-t border-stone-100 bg-[#fafcf9] flex items-center justify-end gap-2.5 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isSubmitting}
                    className="text-xs py-2.5 px-5 rounded-lg border-stone-200 text-stone-600 hover:bg-stone-50 font-bold cursor-pointer disabled:opacity-50"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="text-xs py-2.5 px-6 bg-[#326318] hover:bg-[#254b12] text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Đang tạo voucher...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={15} />
                        <span>Tạo Voucher Ngay</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

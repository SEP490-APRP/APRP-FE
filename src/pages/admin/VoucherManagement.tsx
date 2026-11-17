import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus,
  Loader2,
  Power,
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
  TrendingUp,
} from 'lucide-react'
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
import { globalShowAlert, globalShowConfirm } from '@/components/common/Popup'

type FilterTab = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'FREESHIP'

export default function VoucherManagement() {
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL')

  // Form State
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

  // Tính toán dự toán kinh tế sàn (Economic & Commission Estimator)
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

    // Hoa hồng sàn thu tối thiểu trên đơn hàng (10% tiền hàng từ Shop)
    const commission = minOrder * 0.1
    // Lợi nhuận ròng sàn trên 1 đơn hàng ở mức đơn tối thiểu:
    const netProfit = commission - maxSubsidy
    const netProfitMargin = minOrder > 0 ? (netProfit / minOrder) * 100 : 0

    // Giá trị đơn tối thiểu đề xuất để sàn hòa vốn:
    const breakEvenMinOrder = Math.ceil(maxSubsidy / 0.1)
    // Giá trị đơn tối thiểu đề xuất để sàn có lãi an toàn ~3%:
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


  // Helper chuẩn hóa ô số: không cho phép số 0 đứng đầu, chỉ cho phép số nguyên dương
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
      const data = await voucherService.getAdminVouchers()
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

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCreateModal) {
        setShowCreateModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCreateModal])

  const handleToggleStatus = async (voucherId: number) => {
    setTogglingId(voucherId)
    try {
      await voucherService.toggleAdminVoucher(voucherId)
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

  const handleDeleteVoucher = async (voucherId: number, code: string) => {
    const confirmed = await globalShowConfirm(
      'Xác nhận xóa vĩnh viễn',
      `Bạn có chắc chắn muốn xóa vĩnh viễn voucher "${code}" không? Thao tác này không thể hoàn tác.`,
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
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
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

  // Statistics & Filtered list
  const { activeCount, inactiveCount, freeshipCount, filteredVouchers } = useMemo(() => {
    let active = 0
    let inactive = 0
    let freeship = 0

    vouchers.forEach((vc) => {
      const isExpired = vc.expiryDate && new Date(vc.expiryDate) < new Date()
      const isActive = vc.active !== false && !isExpired
      if (isActive) active++
      else inactive++

      if (vc.voucherType === 'FREE_SHIPPING' || vc.voucherTarget === 'SHIPPING') {
        freeship++
      }
    })

    const filtered = vouchers.filter((vc) => {
      const isExpired = vc.expiryDate && new Date(vc.expiryDate) < new Date()
      const isActive = vc.active !== false && !isExpired

      if (filterTab === 'ACTIVE') return isActive
      if (filterTab === 'INACTIVE') return !isActive
      if (filterTab === 'FREESHIP') {
        return vc.voucherType === 'FREE_SHIPPING' || vc.voucherTarget === 'SHIPPING'
      }
      return true
    })

    return {
      activeCount: active,
      inactiveCount: inactive,
      freeshipCount: freeship,
      filteredVouchers: filtered,
    }
  }, [vouchers, filterTab])

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-200">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl shrink-0 shadow-xs">
            <Ticket size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Quản Lý Voucher Toàn Sàn (Admin Platform)
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Tạo và phân bổ mã giảm giá do hệ thống tài trợ cho toàn bộ đơn hàng trên sàn CapNong
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={loadVouchers}
            disabled={loading}
            className="text-xs py-2.5 px-3.5 gap-1.5 rounded-xl font-bold cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Tải lại</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="text-xs py-2.5 px-4.5 bg-purple-600 hover:bg-purple-700 text-white gap-1.5 rounded-xl font-bold shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Tạo Voucher Toàn Sàn</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilterTab('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${filterTab === 'ALL'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
        >
          <span>Tất cả</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'ALL' ? 'bg-purple-800/50 text-white' : 'bg-gray-100 text-gray-600'
              }`}
          >
            {vouchers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('ACTIVE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${filterTab === 'ACTIVE'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
        >
          <span>Đang bật</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'ACTIVE' ? 'bg-emerald-800/50 text-white' : 'bg-emerald-50 text-emerald-700'
              }`}
          >
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('INACTIVE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${filterTab === 'INACTIVE'
              ? 'bg-stone-600 text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
        >
          <span>Đã tắt / Hết hạn</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'INACTIVE' ? 'bg-stone-800/50 text-white' : 'bg-stone-100 text-stone-600'
              }`}
          >
            {inactiveCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('FREESHIP')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${filterTab === 'FREESHIP'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
        >
          <span>Freeship</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'FREESHIP' ? 'bg-teal-800/50 text-white' : 'bg-teal-50 text-teal-700'
              }`}
          >
            {freeshipCount}
          </span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-semibold">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Layout: Danh sách voucher bên trái, Khung tạo voucher bên phải */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Cột Trái: Danh sách Voucher dồn qua trái khi mở khung tạo */}
        <div className={`w-full transition-all duration-300 ${showCreateModal ? 'lg:flex-1 min-w-0' : 'w-full'}`}>
          {loading ? (
            <div className="py-20 text-center text-sm text-gray-500 space-y-3 bg-white rounded-3xl border border-gray-100 shadow-xs">
              <Loader2 size={32} className="animate-spin text-purple-600 mx-auto" />
              <p className="font-semibold text-gray-600">Đang tải danh sách voucher toàn sàn...</p>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="bg-white rounded-3xl p-14 text-center border border-dashed border-gray-200 space-y-3.5 shadow-xs">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                <Ticket size={28} />
              </div>
              <h4 className="font-black text-gray-800 text-base">Không tìm thấy voucher phù hợp</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                {vouchers.length === 0
                  ? 'Hệ thống chưa tạo mã giảm giá toàn sàn nào. Hãy bấm nút bên dưới để tạo chương trình ưu đãi mới.'
                  : 'Không có voucher nào trong danh mục lọc đã chọn.'}
              </p>
              {vouchers.length === 0 && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                  className="text-xs py-2 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Tạo ngay
                </Button>
              )}
            </div>
          ) : (
            <div className={`grid gap-6 ${showCreateModal ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {filteredVouchers.map((vc) => {
                const isPercent = vc.voucherType === 'PERCENTAGE'
                const isFreeship =
                  vc.voucherType === 'FREE_SHIPPING' || vc.voucherTarget === 'SHIPPING'
                const discountLabel = isPercent
                  ? `Giảm ${vc.discountValue}%`
                  : vc.voucherType === 'FREE_SHIPPING'
                    ? 'Freeship toàn sàn'
                    : `Giảm ${Number(vc.discountValue).toLocaleString('vi-VN')}đ`

                const isExpired = vc.expiryDate && new Date(vc.expiryDate) < new Date()
                const isActive = vc.active !== false && !isExpired

                const used = vc.usedCount || 0
                const limit = vc.claimLimit || 0
                const usagePercent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0

                return (
                  <div
                    key={vc.voucherId}
                    className={`bg-white rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md ${isActive
                        ? 'border-gray-200/90 hover:border-purple-300'
                        : 'border-gray-200/80 bg-stone-50/70 opacity-85'
                      }`}
                  >
                    <div>
                      {/* Top Row: Code + Badges + Status */}
                      <div className="flex items-center gap-2 flex-wrap justify-between mb-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-black text-sm text-purple-900 bg-purple-50/90 border border-purple-200/70 px-2.5 py-0.5 rounded-lg tracking-wide">
                            {vc.voucherCode}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${vc.voucherScope === 'WELCOME'
                                ? 'bg-pink-100 text-pink-700'
                                : vc.voucherScope === 'SYSTEM'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                          >
                            {vc.voucherScope === 'WELCOME'
                              ? 'Chào mừng'
                              : vc.voucherScope === 'SYSTEM'
                                ? 'Hệ thống'
                                : 'Toàn sàn'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isFreeship ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                              }`}
                          >
                            {isFreeship ? 'Freeship' : 'Đơn hàng'}
                          </span>
                        </div>

                        {/* Status badge with indicator dot */}
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${isExpired
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                : 'bg-stone-100 text-stone-600 border border-stone-200'
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${isExpired ? 'bg-amber-500' : isActive ? 'bg-emerald-500' : 'bg-stone-400'
                              }`}
                          />
                          <span>{isExpired ? 'Hết hạn' : isActive ? 'Đang bật' : 'Đã tắt'}</span>
                        </span>
                      </div>

                      {/* Value Row */}
                      <div className="flex items-center gap-2.5 my-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isFreeship
                              ? 'bg-teal-50 text-teal-700'
                              : isPercent
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                        >
                          {isFreeship ? (
                            <Truck size={18} />
                          ) : isPercent ? (
                            <Percent size={18} />
                          ) : (
                            <Tag size={18} />
                          )}
                        </div>
                        <div>
                          <div className="text-base font-black text-gray-900 tracking-tight leading-snug">
                            {discountLabel}
                          </div>
                          {vc.minOrderValue ? (
                            <p className="text-[11px] text-gray-500 font-medium">
                              Đơn tối thiểu: {Number(vc.minOrderValue).toLocaleString('vi-VN')}đ
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-400">Không yêu cầu đơn tối thiểu</p>
                          )}
                        </div>
                      </div>

                      {vc.maxDiscount ? (
                        <div className="text-xs text-purple-700 font-semibold bg-purple-50/60 rounded-xl px-2.5 py-1 mt-2 flex items-center gap-1.5">
                          <Sparkles size={13} className="shrink-0" />
                          <span>Giảm tối đa: {Number(vc.maxDiscount).toLocaleString('vi-VN')}đ</span>
                        </div>
                      ) : null}

                      {/* Usage Progress Bar */}
                      <div className="mt-4 pt-3.5 border-t border-gray-100 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-gray-500">Đã dùng:</span>
                          <span className="text-gray-900 font-bold">
                            {used} / {limit || '∞'}{' '}
                            {limit > 0 && (
                              <span className="text-gray-400 font-normal">({usagePercent}%)</span>
                            )}
                          </span>
                        </div>
                        {limit > 0 && (
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-purple-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        )}

                        {/* Expiry */}
                        <div className="flex items-center justify-between text-[11px] font-medium pt-1">
                          <span className="text-gray-500 flex items-center gap-1">
                            <Calendar size={12} className="text-gray-400" />
                            <span>Hạn sử dụng:</span>
                          </span>
                          <span className="text-gray-800 font-semibold">
                            {vc.expiryDate
                              ? new Date(vc.expiryDate).toLocaleDateString('vi-VN')
                              : 'Vô thời hạn'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-end gap-2">
                      {!vc.active && (
                        <button
                          type="button"
                          disabled={deletingId === vc.voucherId}
                          onClick={() => handleDeleteVoucher(vc.voucherId, vc.voucherCode)}
                          title="Xóa vĩnh viễn voucher đã tắt"
                          className="text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-600 shadow-2xs"
                        >
                          {deletingId === vc.voucherId ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                          <span>Xóa</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={togglingId === vc.voucherId}
                        onClick={() => handleToggleStatus(vc.voucherId)}
                        className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${vc.active
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50'
                            : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/50'
                          }`}
                      >
                        {togglingId === vc.voucherId ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Power size={13} />
                        )}
                        <span>{vc.active ? 'Tắt voucher' : 'Kích hoạt'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Cột Phải: Khung Tạo Voucher Admin (Hiển thị trực tiếp trong trang) */}
        {showCreateModal && (
          <div className="w-full lg:w-[480px] xl:w-[520px] shrink-0 bg-white rounded-3xl border border-gray-200 shadow-lg flex flex-col overflow-hidden animate-fadeIn sticky top-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Ticket size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 leading-tight">
                    Tạo Voucher Sàn Mới
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Thiết lập chương trình khuyến mãi tài trợ bởi sàn
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

            {/* Modal Body Form */}
            <form onSubmit={handleCreateVoucher} className="p-6 overflow-y-auto space-y-4 flex-1">
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

              {/* Loại giảm giá & Mục tiêu áp dụng */}
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-600"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-600 disabled:bg-gray-100 disabled:text-gray-500"
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
                    <span className="text-[11px] text-purple-700 font-semibold mt-1 block whitespace-nowrap">
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
                {minOrderValue > 0 && (
                  <span className="text-[11px] text-gray-500 font-medium mt-1 block whitespace-nowrap">
                    = {Number(minOrderValue).toLocaleString('vi-VN')}&nbsp;đ
                  </span>
                )}
              </div>

              {/* Hộp Cảnh Báo Lợi Nhuận Sàn & Dự Toán Chi Tiết */}
              {voucherScope !== 'WELCOME' && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-3 transition-all ${economicEstimate.status === 'LOSS'
                      ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-sm ring-1 ring-rose-200'
                      : economicEstimate.status === 'BREAK_EVEN'
                        ? 'bg-amber-50 border-amber-300 text-amber-950'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black">
                      {economicEstimate.status === 'LOSS' ? (
                        <AlertTriangle size={18} className="text-rose-600 animate-bounce shrink-0" />
                      ) : economicEstimate.status === 'BREAK_EVEN' ? (
                        <Calculator size={18} className="text-amber-600 shrink-0" />
                      ) : (
                        <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                      )}
                      <span className={economicEstimate.status === 'LOSS' ? 'text-rose-900 text-xs sm:text-sm font-black' : 'font-bold'}>
                        {economicEstimate.status === 'LOSS'
                          ? 'CẢNH BÁO: VOUCHER NÀY SẼ LÀM SÀN BỊ LỖ RÒNG!'
                          : economicEstimate.status === 'BREAK_EVEN'
                            ? 'Dự toán Lợi nhuận sàn: Hòa Vốn / Lãi Mỏng'
                            : 'Dự toán Lợi nhuận sàn: Biên Lãi An Toàn'}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${economicEstimate.status === 'LOSS'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : economicEstimate.status === 'BREAK_EVEN'
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                    >
                      {economicEstimate.status === 'LOSS'
                        ? `Lỗ ${economicEstimate.netProfit.toLocaleString('vi-VN')}\u00A0đ`
                        : economicEstimate.status === 'BREAK_EVEN'
                          ? `Hòa vốn (${economicEstimate.netProfitMargin.toFixed(1)}%)`
                          : `Lãi +${economicEstimate.netProfitMargin.toFixed(1)}%`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 py-2.5 px-3 bg-white/90 rounded-xl border border-gray-200/80 text-xs shadow-2xs">
                    <div>
                      <span className="text-gray-500 block text-[10px]">Hoa hồng shop (10%):</span>
                      <span className="font-bold text-gray-900 whitespace-nowrap">
                        +{economicEstimate.commission.toLocaleString('vi-VN')}&nbsp;đ
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Sàn tài trợ voucher:</span>
                      <span className="font-bold text-rose-600 whitespace-nowrap">
                        -{economicEstimate.maxSubsidy.toLocaleString('vi-VN')}&nbsp;đ
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Lợi nhuận ròng sàn:</span>
                      <span
                        className={`font-black text-xs sm:text-sm block whitespace-nowrap ${economicEstimate.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                      >
                        {economicEstimate.netProfit >= 0 ? '+' : ''}
                        {economicEstimate.netProfit.toLocaleString('vi-VN')}&nbsp;đ
                        <span className="text-[10px] font-normal block text-gray-500">
                          ({economicEstimate.netProfitMargin.toFixed(1)}% đơn tối thiểu)
                        </span>
                      </span>
                    </div>
                  </div>

                  {economicEstimate.status === 'LOSS' && (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs text-rose-800 font-medium leading-relaxed">
                        ⚠️ Số tiền voucher sàn bù (<strong className="whitespace-nowrap">{economicEstimate.maxSubsidy.toLocaleString('vi-VN')}&nbsp;đ</strong>) vượt quá 10% hoa hồng sàn thu được từ shop (<strong className="whitespace-nowrap">{economicEstimate.commission.toLocaleString('vi-VN')}&nbsp;đ</strong>).
                        Hệ thống sẽ <strong>chặn không cho tạo</strong> voucher này để bảo vệ ngân sách sàn.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setMinOrderValue(economicEstimate.breakEvenMinOrder)}
                          className="text-xs font-bold bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                        >
                          <span>👉 Tự sửa Đơn tối thiểu để Hòa vốn:</span>
                          <strong className="underline whitespace-nowrap">
                            {economicEstimate.breakEvenMinOrder.toLocaleString('vi-VN')}&nbsp;đ
                          </strong>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMinOrderValue(economicEstimate.profitableMinOrder)}
                          className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                        >
                          <span>👉 Gợi ý Đơn tối thiểu để Lãi 3%:</span>
                          <strong className="underline whitespace-nowrap">
                            {economicEstimate.profitableMinOrder.toLocaleString('vi-VN')}&nbsp;đ
                          </strong>
                        </button>
                      </div>
                    </div>
                  )}

                  {economicEstimate.status === 'BREAK_EVEN' && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                      <p className="text-[11px] text-amber-800 leading-tight">
                        ℹ️ Sàn hòa vốn hoặc lãi mỏng (&lt; 2%). Khuyến nghị đặt đơn tối thiểu để đạt biên lợi nhuận an toàn ~3%.
                      </p>
                      <button
                        type="button"
                        onClick={() => setMinOrderValue(economicEstimate.profitableMinOrder)}
                        className="shrink-0 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Gợi ý lãi 3% ({economicEstimate.profitableMinOrder.toLocaleString('vi-VN')}&nbsp;đ)
                      </button>
                    </div>
                  )}

                  {economicEstimate.status === 'PROFIT' && (
                    <p className="text-[11px] text-emerald-800 flex items-center gap-1 font-medium">
                      <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                      Biên lợi nhuận sàn an toàn. Không rủi ro tài chính khi áp dụng đơn lẻ hoặc tách đơn đa shop.
                    </p>
                  )}
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
                    placeholder="0"
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
                    placeholder="0"
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

              {/* Checkbox Công khai / Ẩn */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPublicPlatform"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-600"
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
                  className="text-xs py-2.5 px-4 cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="text-xs py-2.5 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin inline mr-1" />
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo Voucher'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

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
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterTab === 'ALL'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span>Tất cả</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filterTab === 'ALL' ? 'bg-purple-800/50 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {vouchers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('ACTIVE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterTab === 'ACTIVE'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span>Đang bật</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filterTab === 'ACTIVE' ? 'bg-emerald-800/50 text-white' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('INACTIVE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterTab === 'INACTIVE'
              ? 'bg-stone-600 text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span>Đã tắt / Hết hạn</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filterTab === 'INACTIVE' ? 'bg-stone-800/50 text-white' : 'bg-stone-100 text-stone-600'
            }`}
          >
            {inactiveCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('FREESHIP')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterTab === 'FREESHIP'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span>Freeship</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filterTab === 'FREESHIP' ? 'bg-teal-800/50 text-white' : 'bg-teal-50 text-teal-700'
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

      {/* Danh sách Voucher Grid */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                className={`bg-white rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md ${
                  isActive
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
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          vc.voucherScope === 'WELCOME'
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
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isFreeship ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isFreeship ? 'Freeship' : 'Đơn hàng'}
                      </span>
                    </div>

                    {/* Status badge with indicator dot */}
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                        isExpired
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-stone-100 text-stone-600 border border-stone-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isExpired ? 'bg-amber-500' : isActive ? 'bg-emerald-500' : 'bg-stone-400'
                        }`}
                      />
                      <span>{isExpired ? 'Hết hạn' : isActive ? 'Đang bật' : 'Đã tắt'}</span>
                    </span>
                  </div>

                  {/* Value Row */}
                  <div className="flex items-center gap-2.5 my-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isFreeship
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
                    className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      vc.active
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

      {/* Modal Tạo Voucher Admin via createPortal */}
      {showCreateModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCreateModal(false)
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
            >
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
                      type="number"
                      min={1}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      required
                    />
                  </div>
                  {voucherType === 'PERCENTAGE' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Giảm tối đa (VNĐ)
                      </label>
                      <Input
                        type="number"
                        placeholder="Không giới hạn"
                        value={maxDiscount ?? ''}
                        onChange={(e) =>
                          setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)
                        }
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Giá trị đơn hàng tối thiểu (VNĐ)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Tổng lượt nhận
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={claimLimit}
                      onChange={(e) => setClaimLimit(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Lượt dùng mỗi khách
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={perUserLimit}
                      onChange={(e) => setPerUserLimit(Number(e.target.value))}
                      required
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
          </div>,
          document.body,
        )}
    </div>
  )
}

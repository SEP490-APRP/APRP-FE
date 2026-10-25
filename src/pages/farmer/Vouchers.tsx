import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Gift, Loader2, Power, X, Calendar, DollarSign, Tag, Check, AlertCircle, Trash2, Sparkles, Percent, Truck } from 'lucide-react'
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

interface VouchersProps {
  onOpenCreateVoucher?: () => void
  onInfo?: (msg: string) => void
}

export default function Vouchers({ onInfo }: VouchersProps) {
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn voucher "${code}" không? Hành động này không thể hoàn tác.`)) {
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
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
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
      alert(err?.response?.data?.message || 'Không thể tạo voucher. Vui lòng kiểm tra lại thông tin.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f1f4ed]">
        <div>
          <h3 className="text-2xl font-black text-[#1c2216]">
            Mã Giảm Giá &amp; Khuyến Mãi Của Shop
          </h3>
          <p className="text-xs text-[#7e8779]">
            Tạo và quản lý các mã giảm giá dành cho khách mua nông sản tại shop của bạn
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-full bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-xs uppercase shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
        >
          <Plus size={15} />
          <span>Tạo Voucher Mới</span>
        </button>
      </div>

      {/* Danh sách Voucher */}
      {loading ? (
        <div className="py-16 text-center text-sm text-stone-500 space-y-2">
          <Loader2 size={32} className="animate-spin text-[#326318] mx-auto" />
          <p>Đang tải danh sách voucher của shop...</p>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-[#e8ece3] space-y-3">
          <Gift size={40} className="mx-auto text-stone-300" />
          <h4 className="font-bold text-stone-700">Chưa có mã giảm giá nào</h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Hãy tạo voucher đầu tiên để thu hút người mua và tăng số lượng đơn hàng nông sản.
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="mt-2 text-xs py-2 px-5 bg-[#326318] hover:bg-[#254b12] text-white rounded-full"
          >
            Tạo Voucher ngay
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vouchers.map((vc) => {
            const isPercent = vc.voucherType === 'PERCENTAGE'
            const discountLabel = isPercent
              ? `Giảm ${vc.discountValue}%`
              : vc.voucherType === 'FREE_SHIPPING'
                ? 'Freeship'
                : `Giảm ${Number(vc.discountValue).toLocaleString('vi-VN')}đ`

            const isExpired = vc.expiryDate && new Date(vc.expiryDate) < new Date()
            const isActive = vc.active !== false && !isExpired

            return (
              <div
                key={vc.voucherId}
                className={`bg-white rounded-3xl p-5 border transition-all flex items-start justify-between gap-3 shadow-xs ${isActive ? 'border-[#e8ece3] hover:border-[#326318]/40' : 'border-gray-200 bg-gray-50/50 opacity-70'
                  }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${isActive ? 'bg-[#326318]/10 text-[#326318]' : 'bg-gray-100 text-gray-400'
                      }`}
                  >
                    <Gift size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-[#1c2216] font-mono tracking-wide">
                        {vc.voucherCode}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Voucher Shop
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${vc.voucherTarget === 'SHIPPING' || vc.voucherType === 'FREE_SHIPPING'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-800'
                          }`}
                      >
                        {vc.voucherTarget === 'SHIPPING' || vc.voucherType === 'FREE_SHIPPING' ? 'Freeship Shop' : 'Đơn hàng'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-200 text-gray-600'
                          }`}
                      >
                        {isExpired ? 'Hết hạn' : isActive ? 'Đang bật' : 'Đã tắt'}
                      </span>
                      {vc.isPublic && (
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                          Công khai
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-bold text-[#8a4e1d] mt-1">
                      {discountLabel}
                      {vc.minOrderValue ? ` (Đơn từ ${Number(vc.minOrderValue).toLocaleString('vi-VN')}đ)` : ''}
                    </div>

                    <div className="text-[11px] text-[#869080] mt-1.5 space-y-0.5">
                      <p>
                        Đã dùng: <strong>{vc.usedCount || 0}</strong> / Giới hạn: {vc.claimLimit || '∞'}
                      </p>
                      <p>
                        HSD:{' '}
                        {vc.expiryDate
                          ? new Date(vc.expiryDate).toLocaleDateString('vi-VN')
                          : 'Vô thời hạn'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Nút xóa chỉ hiện khi voucher đã tạm dừng (!vc.active) */}
                  {!vc.active && (
                    <button
                      type="button"
                      disabled={deletingId === vc.voucherId}
                      onClick={() => handleDeleteVoucher(vc.voucherId, vc.voucherCode)}
                      title="Xóa vĩnh viễn voucher đã tạm dừng"
                      className="p-2.5 rounded-2xl transition-all cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-600 shadow-2xs"
                    >
                      {deletingId === vc.voucherId ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  )}

                  {/* Nút bật / tắt */}
                  <button
                    type="button"
                    disabled={togglingId === vc.voucherId}
                    onClick={() => handleToggleStatus(vc.voucherId)}
                    title={vc.active ? 'Bấm để tắt voucher' : 'Bấm để kích hoạt voucher'}
                    className={`p-2.5 rounded-2xl transition-all cursor-pointer ${vc.active
                        ? 'bg-red-50 hover:bg-red-100 text-red-600'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                      }`}
                  >
                    {togglingId === vc.voucherId ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Power size={16} />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Tạo Voucher Mới (Sử dụng createPortal để gắn trực tiếp vào body, không bị header/sidebar che khuất) */}
      {showCreateModal &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-voucher-title"
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSubmitting) setShowCreateModal(false)
            }}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-stone-200/90 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-scaleUp relative">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4.5 border-b border-stone-100 bg-[#fafcf9]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#326318] flex items-center justify-center border border-emerald-100/80 shadow-inner">
                    <Gift size={22} />
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

              {/* Form Body (Scrollable) */}
              <form onSubmit={handleCreateVoucher} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
                {/* 1. Thẻ xem trước Voucher trực tiếp (Live Preview Ticket) */}
                <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 p-4 shadow-xs relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Xem trước voucher
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-mono text-xs font-black uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      {voucherCode.trim() ? voucherCode.trim() : 'MÃ_VOUCHER'}
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Voucher Shop
                    </span>
                    {voucherType === 'FREE_SHIPPING' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        Freeship Shop
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Đơn hàng
                      </span>
                    )}
                    {isPublic ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                        Công khai
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
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
                      placeholder="VD: GIAM20K, RAUSACH15, FREESHIP"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      required
                      className="uppercase font-mono font-bold text-sm h-11 tracking-wider bg-stone-50/60 border-stone-200 focus:bg-white focus:ring-2 focus:ring-[#326318]/20 focus:border-[#326318] rounded-xl"
                    />
                  </div>
                </div>

                {/* 3. Phân loại ưu đãi (Segmented Control Tabs) */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Loại hình giảm giá <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-stone-100/80 rounded-2xl border border-stone-200/60">
                    <button
                      type="button"
                      onClick={() => {
                        setVoucherType('FIXED_AMOUNT')
                        if (discountValue > 500000) setDiscountValue(20000)
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        voucherType === 'FIXED_AMOUNT'
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
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        voucherType === 'PERCENTAGE'
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
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        voucherType === 'FREE_SHIPPING'
                          ? 'bg-white text-[#326318] shadow-sm font-black'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Truck size={14} />
                      <span>Freeship</span>
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
                      className={`py-2.5 px-3.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                        voucherTarget === 'ORDER' && voucherType !== 'FREE_SHIPPING'
                          ? 'border-[#326318] bg-[#f4f7f1] text-[#326318] font-bold ring-1 ring-[#326318]'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      Giảm trực tiếp vào tiền hàng
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoucherTarget('SHIPPING')}
                      className={`py-2.5 px-3.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                        voucherTarget === 'SHIPPING' || voucherType === 'FREE_SHIPPING'
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
                        className="h-10 text-xs font-bold rounded-xl pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                        {voucherType === 'PERCENTAGE' ? '%' : 'đ'}
                      </span>
                    </div>
                    {voucherType !== 'PERCENTAGE' && discountValue > 0 && (
                      <span className="text-[11px] text-[#326318] font-medium mt-1 block">
                        = {Number(discountValue).toLocaleString('vi-VN')} đ
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
                          className="h-10 text-xs font-bold rounded-xl pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                          đ
                        </span>
                      </div>
                      {maxDiscount && maxDiscount > 0 ? (
                        <span className="text-[11px] text-stone-500 font-medium mt-1 block">
                          Tối đa: {Number(maxDiscount).toLocaleString('vi-VN')} đ
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
                        step={1000}
                        value={minOrderValue ?? ''}
                        onChange={(e) => setMinOrderValue(Number(e.target.value))}
                        className="h-10 text-xs font-bold rounded-xl pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                        đ
                      </span>
                    </div>
                    {minOrderValue > 0 && (
                      <span className="text-[11px] text-stone-500 font-medium mt-1 block">
                        Áp dụng từ: {Number(minOrderValue).toLocaleString('vi-VN')} đ
                      </span>
                    )}
                  </div>
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
                      className="h-10 text-xs font-bold rounded-xl"
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
                      className="h-10 text-xs font-bold rounded-xl"
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
                    className="h-10 text-xs font-medium rounded-xl border-stone-200"
                  />
                </div>

                {/* 8. Tùy chọn hiển thị công khai */}
                <div
                  onClick={() => setIsPublic(!isPublic)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isPublic
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
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isSubmitting}
                    className="text-xs py-2.5 px-5 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50 font-bold cursor-pointer disabled:opacity-50"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="text-xs py-2.5 px-6 bg-[#326318] hover:bg-[#254b12] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
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
          document.body,
        )}
    </div>
  )
}

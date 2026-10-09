import React, { useState, useEffect } from 'react'
import { Plus, Gift, Loader2, Power, X, Calendar, DollarSign, Tag, Check, AlertCircle } from 'lucide-react'
import { voucherService, type VoucherResponse, type VoucherCreateRequest, type VoucherType } from '@/services'
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
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherType, setVoucherType] = useState<VoucherType>('FIXED_AMOUNT')
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

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voucherCode.trim()) return

    setIsSubmitting(true)
    try {
      const payload: VoucherCreateRequest = {
        voucherCode: voucherCode.trim().toUpperCase(),
        voucherType,
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
                className={`bg-white rounded-3xl p-5 border transition-all flex items-start justify-between gap-3 shadow-xs ${
                  isActive ? 'border-[#e8ece3] hover:border-[#326318]/40' : 'border-gray-200 bg-gray-50/50 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                      isActive ? 'bg-[#326318]/10 text-[#326318]' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Gift size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-[#1c2216] font-mono tracking-wide">
                        {vc.voucherCode}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
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

                {/* Nút bật / tắt */}
                <button
                  type="button"
                  disabled={togglingId === vc.voucherId}
                  onClick={() => handleToggleStatus(vc.voucherId)}
                  title={vc.active ? 'Bấm để tắt voucher' : 'Bấm để kích hoạt voucher'}
                  className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
                    vc.active
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
            )
          })}
        </div>
      )}

      {/* Modal Tạo Voucher Mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#f1f4ed]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#326318]/10 text-[#326318] rounded-xl">
                  <Gift size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#1c2216]">Tạo Mã Giảm Giá Mới</h3>
                  <p className="text-[11px] text-[#7e8779]">Cung cấp ưu đãi riêng cho cửa hàng của bạn</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Mã Voucher */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mã Voucher (Code) <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="VD: GIAM20K, RAUSACH15"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  required
                  className="uppercase font-mono font-bold"
                />
              </div>

              {/* Loại giảm giá */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Loại giảm giá
                </label>
                <select
                  value={voucherType}
                  onChange={(e) => setVoucherType(e.target.value as VoucherType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#326318]"
                >
                  <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                  <option value="PERCENTAGE">Phần trăm (%)</option>
                  <option value="FREE_SHIPPING">Miễn phí vận chuyển (Freeship)</option>
                </select>
              </div>

              {/* Giá trị giảm & Tối đa */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {voucherType === 'PERCENTAGE' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'} <span className="text-red-500">*</span>
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
                      onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                )}
              </div>

              {/* Đơn tối thiểu */}
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

              {/* Số lượng giới hạn */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tổng số lượt nhận
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
                    Mỗi khách được dùng
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

              {/* Hạn sử dụng */}
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

              {/* Checkbox Công khai */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-[#326318] rounded focus:ring-[#326318] accent-[#326318] cursor-pointer"
                />
                <span className="text-xs font-medium text-stone-700">
                  Hiển thị công khai trên gian hàng (Người mua có thể tự bấm lưu mã)
                </span>
              </label>

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
                  className="text-xs py-2.5 px-6 bg-[#326318] hover:bg-[#254b12] text-white font-bold rounded-xl cursor-pointer"
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
        </div>
      )}
    </div>
  )
}

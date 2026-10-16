import React, { useState, useEffect } from 'react'
import { Plus, Gift, Loader2, Power, X, Ticket, RefreshCw, AlertCircle, Layers, Target, Trash2 } from 'lucide-react'
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

export default function VoucherManagement() {
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

  const handleToggleStatus = async (voucherId: number) => {
    setTogglingId(voucherId)
    try {
      await voucherService.toggleAdminVoucher(voucherId)
      await loadVouchers()
    } catch (err: any) {
      console.error('Lỗi đổi trạng thái voucher:', err)
      alert('Lỗi: ' + (err?.response?.data?.message || err.message))
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
      await voucherService.deleteAdminVoucher(voucherId)
      await loadVouchers()
    } catch (err: any) {
      console.error('Lỗi xóa voucher:', err)
      alert('Không thể xóa voucher: ' + (err?.response?.data?.message || err.message))
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
      await loadVouchers()
    } catch (err: any) {
      console.error('Lỗi tạo voucher:', err)
      alert(err?.response?.data?.message || 'Không thể tạo voucher toàn sàn.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Ticket className="text-purple-600" size={24} />
            Quản Lý Voucher Toàn Sàn (Admin Platform)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Tạo và phân bổ mã giảm giá do hệ thống tài trợ cho toàn bộ đơn hàng trên sàn CapNong
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={loadVouchers}
            disabled={loading}
            className="text-xs py-2 px-3 gap-1.5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Tải lại</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="text-xs py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white gap-1.5 rounded-xl font-bold shadow-xs"
          >
            <Plus size={15} />
            <span>Tạo Voucher Toàn Sàn</span>
          </Button>
        </div>
      </div>

      {/* Danh sách */}
      {loading ? (
        <div className="py-16 text-center text-sm text-gray-500 space-y-2">
          <Loader2 size={32} className="animate-spin text-purple-600 mx-auto" />
          <p>Đang tải danh sách voucher toàn sàn...</p>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200 space-y-3">
          <Ticket size={40} className="mx-auto text-gray-300" />
          <h4 className="font-bold text-gray-700">Chưa có voucher toàn sàn nào</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Hệ thống chưa tạo mã giảm giá toàn sàn nào. Bấm nút bên dưới để tạo chương trình ưu đãi mới.
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="text-xs py-2 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
          >
            Tạo ngay
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vouchers.map((vc) => {
            const isPercent = vc.voucherType === 'PERCENTAGE'
            const discountLabel = isPercent
              ? `Giảm ${vc.discountValue}%`
              : vc.voucherType === 'FREE_SHIPPING'
                ? 'Freeship toàn sàn'
                : `Giảm ${Number(vc.discountValue).toLocaleString('vi-VN')}đ`

            const isExpired = vc.expiryDate && new Date(vc.expiryDate) < new Date()
            const isActive = vc.active !== false && !isExpired

            return (
              <div
                key={vc.voucherId}
                className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-xs ${isActive ? 'border-gray-200 hover:border-purple-300' : 'border-gray-200 bg-gray-50 opacity-70'
                  }`}
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-black text-base font-mono text-purple-900 tracking-wide">
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
                      {vc.voucherScope === 'WELCOME' ? 'Chào mừng' : vc.voucherScope === 'SYSTEM' ? 'Hệ thống' : 'Toàn sàn'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${vc.voucherTarget === 'SHIPPING' || vc.voucherType === 'FREE_SHIPPING'
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-amber-100 text-amber-800'
                        }`}
                    >
                      {vc.voucherTarget === 'SHIPPING' || vc.voucherType === 'FREE_SHIPPING' ? 'Freeship' : 'Đơn hàng'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto ${isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-600'
                        }`}
                    >
                      {isExpired ? 'Hết hạn' : isActive ? 'Đang bật' : 'Đã tắt'}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-gray-900 mb-1">
                    {discountLabel}
                  </div>
                  {vc.minOrderValue ? (
                    <p className="text-xs text-gray-500">
                      Đơn tối thiểu: {Number(vc.minOrderValue).toLocaleString('vi-VN')}đ
                    </p>
                  ) : null}
                  {vc.maxDiscount ? (
                    <p className="text-xs text-gray-500">
                      Giảm tối đa: {Number(vc.maxDiscount).toLocaleString('vi-VN')}đ
                    </p>
                  ) : null}

                  <div className="text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-100 space-y-1">
                    <div className="flex justify-between">
                      <span>Đã dùng:</span>
                      <strong className="text-gray-700">{vc.usedCount || 0} / {vc.claimLimit || '∞'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Hạn sử dụng:</span>
                      <strong className="text-gray-700">
                        {vc.expiryDate ? new Date(vc.expiryDate).toLocaleDateString('vi-VN') : '—'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  {!vc.active && (
                    <button
                      type="button"
                      disabled={deletingId === vc.voucherId}
                      onClick={() => handleDeleteVoucher(vc.voucherId, vc.voucherCode)}
                      title="Xóa vĩnh viễn voucher đã tạm dừng"
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
                    className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${vc.active
                        ? 'bg-red-50 hover:bg-red-100 text-red-600'
                        : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
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

      {/* Modal Tạo Voucher Admin */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Ticket className="text-purple-600" size={20} />
                <h3 className="font-bold text-base text-gray-900">Tạo Voucher Sàn Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

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
                <label htmlFor="isPublicPlatform" className="text-xs text-gray-700 cursor-pointer">
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
                  className="text-xs py-2.5 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer"
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

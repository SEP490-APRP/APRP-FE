import React, { useState, useEffect, useCallback } from 'react'
import {
  RotateCcw,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Camera,
  UploadCloud,
  Loader2,
  Phone,
  MapPin,
  Store,
  User,
  DollarSign,
  Package,
  RefreshCw,
  X,
} from 'lucide-react'
import { returnService } from '@/services/return.service'
import type { ReturnRequestResponse, ReturnStatus } from '@/services/return.types'
import { uploadService } from '@/services/upload.service'
import { globalShowAlert } from '@/components/common/Popup'

const RETURN_STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string; size?: number }> }
> = {
  RETURN_SHIPPING: {
    label: 'Cần lấy từ khách',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: Truck,
  },
  RETURN_PICKED_UP: {
    label: 'Đang chuyển về Shop',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Truck,
  },
  RETURN_DELIVERED: {
    label: 'Đã giao về Shop',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: 'Hoàn tất giao hoàn',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  RETURN_FAILED: {
    label: 'Giao/nhận thất bại',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
  },
  DISPUTED: {
    label: 'Khiếu nại / Tranh chấp',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertTriangle,
  },
}

export const ShipperReturnOrders: React.FC = () => {
  const [subTab, setSubTab] = useState<'AVAILABLE' | 'MY_RETURNS'>('AVAILABLE')
  const [availableReturns, setAvailableReturns] = useState<ReturnRequestResponse[]>([])
  const [myReturns, setMyReturns] = useState<ReturnRequestResponse[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  // Modal báo lỗi giao / nhận
  const [failModalReturn, setFailModalReturn] = useState<ReturnRequestResponse | null>(null)
  const [failReason, setFailReason] = useState<string>('')
  const [failProofImage, setFailProofImage] = useState<string>('')
  const [uploadingFailProof, setUploadingFailProof] = useState<boolean>(false)

  // Modal chụp ảnh bằng chứng hoàn thành (pickup / deliver)
  const [actionModal, setActionModal] = useState<{
    returnItem: ReturnRequestResponse
    actionType: 'PICKUP' | 'DELIVER'
  } | null>(null)
  const [proofImage, setProofImage] = useState<string>('')
  const [uploadingProof, setUploadingProof] = useState<boolean>(false)

  const fetchAvailableReturns = useCallback(async () => {
    try {
      setLoading(true)
      const res = await returnService.getShipperAvailableReturns(0, 50)
      if (res.result?.content) {
        setAvailableReturns(res.result.content)
      } else {
        setAvailableReturns([])
      }
    } catch (err) {
      console.error('Fetch available returns failed:', err)
      setAvailableReturns([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMyReturns = useCallback(async () => {
    try {
      setLoading(true)
      const res = await returnService.getShipperMyReturns(0, 50)
      if (res.result?.content) {
        setMyReturns(res.result.content)
      } else {
        setMyReturns([])
      }
    } catch (err) {
      console.error('Fetch my returns failed:', err)
      setMyReturns([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (subTab === 'AVAILABLE') {
      fetchAvailableReturns()
    } else {
      fetchMyReturns()
    }
  }, [subTab, fetchAvailableReturns, fetchMyReturns])

  // Nhận đơn hoàn
  const handleAcceptReturn = async (item: ReturnRequestResponse) => {
    const returnId = item.id || item.returnId || 0
    if (!returnId) return

    try {
      setActionLoadingId(returnId)
      await returnService.shipperAccept(returnId)
      globalShowAlert(
        `Đã nhận đơn hoàn trả #${returnId}! Vui lòng đến địa chỉ Người mua để lấy hàng.`,
        'Thành công',
        'success'
      )
      await fetchAvailableReturns()
      setSubTab('MY_RETURNS')
    } catch (err: any) {
      console.error('Accept return failed:', err)
      globalShowAlert(
        err?.response?.data?.message || err?.message || 'Không thể nhận đơn hoàn. Vui lòng kiểm tra lại số dư ví!',
        'Lỗi',
        'error'
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  // Tải ảnh bằng chứng lên Cloudinary
  const handleUploadImage = async (file: File, isFailModal: boolean) => {
    try {
      if (isFailModal) setUploadingFailProof(true)
      else setUploadingProof(true)

      const res = await uploadService.uploadImage(file, 'returns')
      const url = res.result?.url
      if (url) {
        if (isFailModal) setFailProofImage(url)
        else setProofImage(url)
      }
    } catch (err) {
      console.error('Upload proof image failed:', err)
      globalShowAlert('Tải ảnh thất bại. Vui lòng thử lại!', 'Lỗi', 'error')
    } finally {
      if (isFailModal) setUploadingFailProof(false)
      else setUploadingProof(false)
    }
  }

  // Xác nhận lấy hàng hoàn từ Người mua
  const handleConfirmPickup = async () => {
    if (!actionModal) return
    const returnId = actionModal.returnItem.id || actionModal.returnItem.returnId || 0

    try {
      setActionLoadingId(returnId)
      await returnService.shipperPickup(returnId, { proofImageUrl: proofImage || undefined })
      globalShowAlert('Đã xác nhận lấy hàng từ Người mua. Hãy chuyển hàng về cho Shop!', 'Thành công', 'success')
      setActionModal(null)
      setProofImage('')
      await fetchMyReturns()
    } catch (err: any) {
      console.error('Confirm pickup failed:', err)
      globalShowAlert(err?.response?.data?.message || err?.message || 'Thao tác thất bại!', 'Lỗi', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Xác nhận giao hàng hoàn về cho Shop
  const handleConfirmDeliver = async () => {
    if (!actionModal) return
    const returnId = actionModal.returnItem.id || actionModal.returnItem.returnId || 0

    try {
      setActionLoadingId(returnId)
      await returnService.shipperDeliver(returnId, { proofImageUrl: proofImage || undefined })
      globalShowAlert('Đã giao hàng hoàn về Shop thành công! Đơn hoàn đã hoàn tất.', 'Thành công', 'success')
      setActionModal(null)
      setProofImage('')
      await fetchMyReturns()
    } catch (err: any) {
      console.error('Confirm deliver failed:', err)
      globalShowAlert(err?.response?.data?.message || err?.message || 'Thao tác thất bại!', 'Lỗi', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Báo cáo thất bại
  const handleSubmitFail = async () => {
    if (!failModalReturn) return
    const returnId = failModalReturn.id || failModalReturn.returnId || 0
    if (!failReason.trim()) {
      globalShowAlert('Vui lòng nhập lý do giao/nhận không thành công!', 'Nhắc nhở', 'warning')
      return
    }

    try {
      setActionLoadingId(returnId)
      await returnService.shipperFail(returnId, {
        note: failReason.trim(),
        proofImageUrl: failProofImage || undefined,
      })
      globalShowAlert('Đã ghi nhận báo cáo sự cố giao/nhận hàng hoàn.', 'Đã ghi nhận', 'success')
      setFailModalReturn(null)
      setFailReason('')
      setFailProofImage('')
      await fetchMyReturns()
    } catch (err: any) {
      console.error('Report fail failed:', err)
      globalShowAlert(err?.response?.data?.message || err?.message || 'Gửi báo cáo thất bại!', 'Lỗi', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSubTab('AVAILABLE')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'AVAILABLE'
                ? 'bg-[#1a4d2e] text-white shadow-md shadow-[#1a4d2e]/20'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Package size={15} />
            <span>Đơn hoàn đang chờ ({availableReturns.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('MY_RETURNS')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'MY_RETURNS'
                ? 'bg-[#1a4d2e] text-white shadow-md shadow-[#1a4d2e]/20'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Truck size={15} />
            <span>Đơn hoàn tôi nhận ({myReturns.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => (subTab === 'AVAILABLE' ? fetchAvailableReturns() : fetchMyReturns())}
          className="size-9 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary transition-all cursor-pointer shadow-xs"
          title="Tải lại"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-xs font-bold uppercase tracking-wider">Đang tải danh sách đơn hoàn...</p>
        </div>
      )}

      {/* Danh sách Đơn hoàn đang chờ */}
      {!loading && subTab === 'AVAILABLE' && (
        <>
          {availableReturns.length === 0 ? (
            <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="size-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                <Package size={28} />
              </div>
              <h4 className="text-base font-black text-gray-800 uppercase">Hiện không có đơn hoàn nào đang chờ</h4>
              <p className="text-xs text-gray-400 max-w-sm">
                Khi Shop hoặc Admin duyệt yêu cầu hoàn hàng của Người mua, đơn hoàn mới sẽ hiển thị tại đây để bạn nhận.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableReturns.map((item) => {
                const returnId = item.id || item.returnId || 0
                const isAccepting = actionLoadingId === returnId
                const isCod = (item.shippingPaymentMethod || 'WALLET').toUpperCase() === 'COD'

                return (
                  <div
                    key={returnId}
                    className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5 relative overflow-hidden group"
                  >
                    {/* Header đơn */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-[10px] font-black uppercase tracking-wider border border-sky-100 flex items-center gap-1">
                          <RotateCcw size={11} />
                          <span>Đơn hoàn #{returnId}</span>
                        </span>
                        <span className="text-[11px] font-bold text-gray-400">
                          Đơn gốc: #{item.orderId}
                        </span>
                      </div>

                      {/* Tên sản phẩm & cước ship */}
                      <div className="flex items-start justify-between gap-3 pt-1">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="size-12 rounded-2xl object-cover border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div className="size-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                              <Package size={20} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-gray-900 truncate">{item.productName}</h4>
                            <p className="text-[11px] text-gray-500">
                              Hoàn tiền: <strong className="text-rose-600">{Number(item.refundAmount || 0).toLocaleString('vi-VN')} đ</strong>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block">Cước ship hoàn</span>
                          <span className="text-base font-black text-emerald-600">
                            +{Number(item.returnShippingFee || 20000).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>

                      {/* Thông báo thanh toán COD vs Ví */}
                      <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                        isCod ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      }`}>
                        <DollarSign size={15} className="shrink-0" />
                        <span className="text-[11px] font-bold">
                          {isCod
                            ? 'Hình thức COD: Thu 20.000 đ tiền mặt từ Shop khi giao hàng thành công (Sàn trừ 3% hoa hồng)'
                            : 'Hình thức Ví sàn: Cước phí được Sàn thanh toán trực tiếp vào Ví Shipper sau khi giao thành công'}
                        </span>
                      </div>

                      {/* Lộ trình: Khách -> Shop */}
                      <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2.5 text-xs">
                        <div className="flex items-start gap-2">
                          <div className="size-2 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800">
                              Lấy hàng: {item.buyerName || 'Người mua'} {item.buyerPhone ? `(${item.buyerPhone})` : ''}
                            </p>
                            <p className="text-gray-500 text-[11px] truncate">{item.buyerAddress || 'Chưa có địa chỉ'}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="size-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800">
                              Giao về Shop: {item.shopName || 'Gian hàng'} {item.shopPhone ? `(${item.shopPhone})` : ''}
                            </p>
                            <p className="text-gray-500 text-[11px] truncate">{item.shopAddress || 'Chưa có địa chỉ'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Nút hành động: Nhận đơn */}
                    <button
                      type="button"
                      onClick={() => handleAcceptReturn(item)}
                      disabled={isAccepting}
                      className="w-full py-3.5 rounded-2xl bg-[#1a4d2e] hover:bg-[#143d24] text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-60"
                    >
                      {isAccepting ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Đang nhận đơn...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Nhận đơn giao hoàn (+{Number(item.returnShippingFee || 20000).toLocaleString('vi-VN')} đ)</span>
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Danh sách Đơn hoàn tôi nhận */}
      {!loading && subTab === 'MY_RETURNS' && (
        <>
          {myReturns.length === 0 ? (
            <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="size-16 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mb-1">
                <Truck size={28} />
              </div>
              <h4 className="text-base font-black text-gray-800 uppercase">Bạn chưa nhận đơn hoàn nào</h4>
              <p className="text-xs text-gray-400 max-w-sm">
                Hãy chuyển sang tab "Đơn hoàn đang chờ" để nhận các đơn giao trả hàng từ người mua về cho shop.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myReturns.map((item) => {
                const returnId = item.id || item.returnId || 0
                const isCod = (item.shippingPaymentMethod || 'WALLET').toUpperCase() === 'COD'
                const statusCfg = RETURN_STATUS_CONFIG[item.status] || {
                  label: item.status,
                  badgeClass: 'bg-gray-50 text-gray-700 border-gray-200',
                  icon: Package,
                }
                const StatusIcon = statusCfg.icon

                return (
                  <div
                    key={returnId}
                    className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-xs flex flex-col justify-between gap-5 relative"
                  >
                    <div className="space-y-3">
                      {/* Badge trạng thái */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${statusCfg.badgeClass}`}>
                          <StatusIcon size={12} />
                          <span>{statusCfg.label}</span>
                        </span>
                        <span className="text-[11px] font-bold text-gray-400">
                          Mã hoàn #{returnId}
                        </span>
                      </div>

                      {/* Tên sản phẩm */}
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="size-12 rounded-2xl object-cover border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div className="size-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                              <Package size={20} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-gray-900 truncate">{item.productName}</h4>
                            <p className="text-[11px] text-gray-500">Đơn gốc #{item.orderId}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block">Cước ship</span>
                          <span className="text-base font-black text-emerald-600">
                            +{Number(item.returnShippingFee || 20000).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>

                      {/* Thông tin lộ trình */}
                      <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          <div className="size-2 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-800 flex items-center justify-between">
                              <span>Người mua: {item.buyerName || 'Khách hàng'}</span>
                              {item.buyerPhone && (
                                <a
                                  href={`tel:${item.buyerPhone}`}
                                  className="text-primary hover:underline text-[11px] flex items-center gap-1"
                                >
                                  <Phone size={11} /> {item.buyerPhone}
                                </a>
                              )}
                            </p>
                            <p className="text-gray-500 text-[11px]">{item.buyerAddress || 'Chưa có địa chỉ'}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="size-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-800 flex items-center justify-between">
                              <span>Shop: {item.shopName || 'Gian hàng'}</span>
                              {item.shopPhone && (
                                <a
                                  href={`tel:${item.shopPhone}`}
                                  className="text-primary hover:underline text-[11px] flex items-center gap-1"
                                >
                                  <Phone size={11} /> {item.shopPhone}
                                </a>
                              )}
                            </p>
                            <p className="text-gray-500 text-[11px]">{item.shopAddress || 'Chưa có địa chỉ'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Ghi chú tiền cước COD */}
                      {isCod && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-2">
                          <DollarSign size={14} className="shrink-0" />
                          <span>Thu 20.000 đ tiền mặt từ Shop khi giao hàng hoàn tới shop!</span>
                        </div>
                      )}
                    </div>

                    {/* Nút hành động tùy trạng thái */}
                    <div className="flex items-center gap-2.5 pt-2">
                      {item.status === 'RETURN_SHIPPING' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setActionModal({ returnItem: item, actionType: 'PICKUP' })
                              setProofImage('')
                            }}
                            className="flex-1 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Package size={15} />
                            <span>Đã lấy hàng từ khách</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setFailModalReturn(item)
                              setFailReason('')
                              setFailProofImage('')
                            }}
                            className="py-3 px-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                            title="Báo không lấy được hàng"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}

                      {item.status === 'RETURN_PICKED_UP' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setActionModal({ returnItem: item, actionType: 'DELIVER' })
                              setProofImage('')
                            }}
                            className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <CheckCircle2 size={15} />
                            <span>Đã giao về Shop thành công</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setFailModalReturn(item)
                              setFailReason('')
                              setFailProofImage('')
                            }}
                            className="py-3 px-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                            title="Shop từ chối nhận"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}

                      {item.status === 'COMPLETED' && (
                        <div className="w-full py-2.5 bg-emerald-50 text-emerald-800 rounded-2xl text-center text-xs font-bold border border-emerald-200">
                          ✓ Đơn hoàn đã hoàn thành &amp; nhận cước
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Modal xác nhận Lấy hàng / Giao hàng kèm ảnh chụp */}
      {actionModal && (
        <div
          role="dialog"
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !uploadingProof && actionLoadingId === null) {
              setActionModal(null)
            }
          }}
        >
          <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-md border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900">
                {actionModal.actionType === 'PICKUP'
                  ? 'Xác nhận lấy hàng từ Người mua'
                  : 'Xác nhận giao hàng về cho Shop'}
              </h3>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              {actionModal.actionType === 'PICKUP'
                ? 'Vui lòng kiểm tra kỹ tình trạng gói hàng từ người mua trước khi nhận.'
                : 'Vui lòng bàn giao gói hàng cho Shop và xác nhận đã giao thành công.'}
            </p>

            {/* Chụp ảnh bằng chứng */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">
                Ảnh chụp gói hàng (Không bắt buộc):
              </label>
              {proofImage ? (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-video bg-gray-50">
                  <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setProofImage('')}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-200 hover:border-primary rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-gray-50 hover:bg-white transition-all">
                  {uploadingProof ? (
                    <Loader2 size={24} className="animate-spin text-primary" />
                  ) : (
                    <>
                      <Camera size={22} className="text-gray-400" />
                      <span className="text-[11px] font-bold text-gray-600">Bấm để tải hoặc chụp ảnh</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingProof}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUploadImage(file, false)
                    }}
                  />
                </label>
              )}
            </div>

            {/* Nút gửi */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() =>
                  actionModal.actionType === 'PICKUP' ? handleConfirmPickup() : handleConfirmDeliver()
                }
                disabled={actionLoadingId !== null || uploadingProof}
                className="py-2.5 px-5 rounded-xl bg-[#1a4d2e] hover:bg-[#143d24] text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoadingId !== null ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>Xác nhận</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Báo cáo thất bại */}
      {failModalReturn && (
        <div
          role="dialog"
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !uploadingFailProof && actionLoadingId === null) {
              setFailModalReturn(null)
            }
          }}
        >
          <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-md border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-rose-700 flex items-center gap-2">
                <AlertTriangle size={18} />
                <span>Báo cáo sự cố giao/nhận hoàn</span>
              </h3>
              <button
                type="button"
                onClick={() => setFailModalReturn(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              {failModalReturn.status === 'RETURN_SHIPPING'
                ? 'Ghi rõ lý do không lấy được hàng từ Người mua (ví dụ: gọi 3 lần không nghe máy, khách không muốn trả nữa...).'
                : 'Ghi rõ lý do Shop từ chối nhận lại hàng (ví dụ: Shop đóng cửa, Shop từ chối trả COD...).'}
            </p>

            {/* Lý do */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Lý do thất bại (*):</label>
              <textarea
                rows={3}
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
                placeholder="Nhập chi tiết lý do sự cố..."
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 transition-all"
              />
            </div>

            {/* Ảnh chụp bằng chứng */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Ảnh chụp bằng chứng (nếu có):</label>
              {failProofImage ? (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-video bg-gray-50">
                  <img src={failProofImage} alt="Proof" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFailProofImage('')}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-200 hover:border-rose-400 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-gray-50 hover:bg-white transition-all">
                  {uploadingFailProof ? (
                    <Loader2 size={24} className="animate-spin text-rose-600" />
                  ) : (
                    <>
                      <Camera size={22} className="text-gray-400" />
                      <span className="text-[11px] font-bold text-gray-600">Bấm để tải ảnh bằng chứng</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingFailProof}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUploadImage(file, true)
                    }}
                  />
                </label>
              )}
            </div>

            {/* Nút gửi */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setFailModalReturn(null)}
                className="py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmitFail}
                disabled={actionLoadingId !== null || uploadingFailProof || !failReason.trim()}
                className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoadingId !== null ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <AlertTriangle size={14} />
                )}
                <span>Gửi báo cáo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


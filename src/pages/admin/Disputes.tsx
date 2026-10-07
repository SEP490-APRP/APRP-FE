import React, { useState, useEffect } from 'react'
import {
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ShieldCheck,
  Download,
  ZoomIn,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { returnService, ReturnRequestResponse } from '@/services/return.service'
import { useCheckDisputePayout, useDisputeAction, useDisputes } from '@/features/order'
import { globalShowAlert } from '@/components/common/Popup'

const Disputes: React.FC = () => {
  const [selectedDispute, setSelectedDispute] = useState<ReturnRequestResponse | null>(null)
  const [adminRemark, setAdminRemark] = useState('')
  const [payOSQR, setPayOSQR] = useState<{ qrCodeUrl: string; checkoutUrl: string } | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  const disputesQuery = useDisputes()
  const disputeAction = useDisputeAction()
  const checkPayout = useCheckDisputePayout()

  const disputes = disputesQuery.data ?? []
  // Giống bản cũ: hiện màn tải cả khi tải lại sau mỗi thao tác.
  const loading = disputesQuery.isFetching
  const submitting = disputeAction.isPending
  const checkingPayout = checkPayout.isPending
  const fetchDisputes = () => void disputesQuery.refetch()

  const filteredDisputes = disputes.filter((d) => {
    const matchesSearch =
      (d.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      d.id.toString().includes(searchTerm)
    if (statusFilter === 'ALL') return matchesSearch
    if (statusFilter === 'PENDING')
      return (
        matchesSearch &&
        (d.status === 'PENDING' ||
          d.status === 'SHOP_APPROVED' ||
          d.status === 'DISPUTED' ||
          d.status === 'REFUND_PENDING')
      )
    if (statusFilter === 'COMPLETED') return matchesSearch && d.status === 'COMPLETED'
    return matchesSearch && d.status === statusFilter
  })

  useEffect(() => {
    const checkReturnUrl = async () => {
      const params = new URLSearchParams(window.location.search)
      const orderCode = params.get('orderCode')
      const status = params.get('status')

      if (orderCode && status === 'PAID') {
        try {
          await returnService.autoCheckPayout(Number(orderCode))
          globalShowAlert(
            'Thanh toán hoàn tiền thành công và đã được ghi nhận!',
            'Thông báo',
            'success',
          )
        } catch (err) {
          console.error('Auto-check failed:', err)
        }
        window.history.replaceState({}, '', window.location.pathname)
      }
      // Danh sách tự tải khi mở trang; nếu vừa ghi nhận thanh toán thì tải lại.
      if (orderCode && status === 'PAID') fetchDisputes()
    }

    checkReturnUrl()
  }, [])

  const handleAdminAction = async (accept: boolean, refundPct: number = 100) => {
    if (!selectedDispute) return
    if (!adminRemark.trim()) {
      globalShowAlert('Vui lòng nhập ghi chú của Admin', 'Nhắc nhở', 'warning')
      return
    }

    try {
      const amount = selectedDispute.refundAmount * (refundPct / 100)
      const res = await disputeAction.mutateAsync({
        id: selectedDispute.id,
        accept,
        response: adminRemark,
        refundAmount: amount,
      })

      if (res.result?.request) {
        if (accept && res.result.checkoutUrl) {
          // Redirect to PayOS for actual money transfer
          window.location.href = res.result.checkoutUrl
          return // Stop further execution as we are redirecting
        }

        globalShowAlert(
          'Đã thực hiện thao tác ' + (accept ? 'phê duyệt' : 'từ chối'),
          'Thành công',
          'success',
        )
        setAdminRemark('')
        setSelectedDispute(res.result.request) // Update selected dispute with the latest status
      }
    } catch (err) {
      console.error('Action failed:', err)
      globalShowAlert('Thao tác thất bại', 'Lỗi', 'error')
    }
  }

  const handleCheckPayout = async () => {
    if (!selectedDispute) return
    try {
      const res = await checkPayout.mutateAsync(selectedDispute.id)
      if (res.result?.request?.status === 'COMPLETED') {
        globalShowAlert('Thanh toán thành công!', 'Thông báo', 'success')
        setSelectedDispute(res.result.request)
      } else {
        globalShowAlert('Giao dịch đang được xử lý hoặc chưa thanh toán.', 'Thông báo', 'info')
      }
    } catch {
      globalShowAlert('Không thể kiểm tra trạng thái.', 'Lỗi', 'error')
    }
  }

  const evidenceList = selectedDispute?.evidence ? selectedDispute.evidence.split(';') : []
  const [activeEvidence, setActiveEvidence] = useState(0)

  return (
    <div className="flex h-full animate-in fade-in duration-500 overflow-hidden bg-white">
      {/* List Sidebar */}
      <div className="w-96 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
        <div className="p-8 border-b border-gray-50 uppercase tracking-tighter">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-black text-gray-800 uppercase tracking-tight">
              Trung tâm khiếu nại
            </h4>
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">
              {disputes.length} đơn
            </span>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo ID, tên sp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-[11px] font-bold focus:bg-white focus:border-primary transition-all outline-none"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {['ALL', 'PENDING', 'COMPLETED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${statusFilter === f ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                  {f === 'ALL' ? 'Tất cả' : f === 'PENDING' ? 'Mới/Đang xử lý' : 'Đã xong'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-xs font-bold text-gray-400">Đang tải...</span>
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircle2 className="size-12 text-gray-200 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-400">Không có khiếu nại nào</p>
            </div>
          ) : (
            filteredDisputes.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedDispute(item)
                  setAdminRemark('')
                  setActiveEvidence(0)
                }}
                className={`p-6 rounded-3xl border transition-all cursor-pointer ${selectedDispute?.id === item.id ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                    #{item.id}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-black text-gray-900 text-sm mb-1">{item.productName}</h4>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs font-black text-gray-600">
                    {item.refundAmount.toLocaleString()}đ
                  </span>
                  <div
                    className={`flex items-center gap-1 text-[10px] font-black uppercase ${
                      item.status === 'COMPLETED'
                        ? 'text-emerald-500'
                        : item.status === 'REFUND_PENDING'
                          ? 'text-primary animate-pulse'
                          : item.status === 'SHOP_APPROVED'
                            ? 'text-blue-500'
                            : item.status === 'REJECTED'
                              ? 'text-red-500'
                              : 'text-orange-500'
                    }`}
                  >
                    {item.status === 'COMPLETED' && (
                      <>
                        <CheckCircle2 className="size-3" /> ĐÃ XONG
                      </>
                    )}
                    {item.status === 'REFUND_PENDING' && (
                      <>
                        <RefreshCw className="size-3 animate-spin" /> ĐANG HOÀN TIỀN
                      </>
                    )}
                    {item.status === 'SHOP_APPROVED' && (
                      <>
                        <CheckCircle2 className="size-3" /> SHOP ĐÃ DUYỆT
                      </>
                    )}
                    {item.status === 'REJECTED' && (
                      <>
                        <XCircle className="size-3" /> ĐÃ TỪ CHỐI
                      </>
                    )}
                    {item.status === 'DISPUTED' && (
                      <>
                        <AlertTriangle className="size-3" /> TRANH CHẤP
                      </>
                    )}
                    {item.status === 'PENDING' && (
                      <>
                        <Clock className="size-3" /> MỚI
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Evidence View */}
      {selectedDispute ? (
        <div className="flex-1 flex flex-col bg-gray-50/30 overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
              <div className="flex flex-col gap-6">
                <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
                  <div className="px-8 py-4 bg-gray-900 text-white flex items-center justify-between">
                    <h5 className="text-[10px] font-black uppercase tracking-widest opacity-70">
                      BẰNG CHỨNG TỪ NGƯỜI MUA
                    </h5>
                    <div className="flex gap-2">
                      <button className="size-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                        <ZoomIn className="size-4" />
                      </button>
                      <button className="size-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                        <Download className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 relative bg-black flex items-center justify-center">
                    {evidenceList.length > 0 ? (
                      <img
                        src={evidenceList[activeEvidence]}
                        className="max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-500 text-sm">Không có hình ảnh</div>
                    )}
                    <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
                      <div className="size-8 bg-red-500 rounded-full flex items-center justify-center text-white">
                        <AlertTriangle className="size-4" />
                      </div>
                      <p className="text-[11px] text-white/90 font-medium italic line-clamp-2">
                        {selectedDispute.reason}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 flex gap-4 overflow-x-auto bg-gray-900">
                    {evidenceList.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        onClick={() => setActiveEvidence(i)}
                        className={`size-16 rounded-xl object-cover cursor-pointer transition-all ${activeEvidence === i ? 'border-2 border-primary scale-110' : 'opacity-40 hover:opacity-100'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-3">
                    <div className="size-10 rounded-xl flex items-center justify-center text-blue-600 bg-blue-50">
                      <ShoppingBag className="size-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        Sản phẩm
                      </p>
                      <h4 className="text-sm font-black text-gray-900 line-clamp-1">
                        {selectedDispute.productName}
                      </h4>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-3">
                    <div className="size-10 rounded-xl flex items-center justify-center text-emerald-600 bg-emerald-50">
                      <Clock className="size-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        Số tiền hoàn (100%)
                      </p>
                      <h4 className="text-lg font-black text-gray-900">
                        {selectedDispute.refundAmount.toLocaleString()}đ
                      </h4>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="size-10 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                      <AlertTriangle className="size-6" />
                    </div>
                    <h4 className="font-black text-gray-800 uppercase tracking-tight">
                      {selectedDispute.status === 'SHOP_APPROVED'
                        ? 'Yêu cầu từ Shop'
                        : 'Chi tiết khiếu nại'}
                    </h4>
                  </div>

                  <div className="flex-1 space-y-10 relative">
                    <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-100" />
                    <div className="relative flex gap-6">
                      <div className="size-6 bg-orange-500 rounded-full border-4 border-white shadow-sm shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-gray-900 uppercase">
                            Người mua (Buyer)
                          </span>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-sm font-medium text-gray-600 italic">
                          {selectedDispute.reason}
                        </div>
                      </div>
                    </div>

                    {selectedDispute.shopResponse && (
                      <div className="relative flex gap-6">
                        <div className="size-6 bg-blue-500 rounded-full border-4 border-white shadow-sm shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-gray-900 uppercase">
                              Người bán (Shop Owner)
                            </span>
                          </div>
                          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-sm font-medium text-gray-600 italic">
                            {selectedDispute.shopResponse}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-auto pt-10 border-t border-gray-50 flex flex-col gap-6">
                      <div className="space-y-3">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">
                          Ghi chú & Quyết định Admin
                        </p>
                        <textarea
                          value={adminRemark}
                          onChange={(e) => setAdminRemark(e.target.value)}
                          placeholder="Nhập lý do cho quyết định của bạn..."
                          className="w-full h-24 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-medium outline-none focus:border-primary transition-all resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          onClick={() => handleAdminAction(true, 100)}
                          disabled={
                            submitting ||
                            selectedDispute.status === 'COMPLETED' ||
                            selectedDispute.status === 'REFUND_PENDING'
                          }
                          className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50"
                        >
                          {submitting ? (
                            <Loader2 className="size-5 animate-spin mx-auto" />
                          ) : selectedDispute.status === 'SHOP_APPROVED' ? (
                            'XÁC NHẬN HOÀN TIỀN 100%'
                          ) : (
                            'PHÊ DUYỆT HOÀN TIỀN 100%'
                          )}
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleAdminAction(true, 50)}
                            disabled={
                              submitting ||
                              selectedDispute.status === 'COMPLETED' ||
                              selectedDispute.status === 'REFUND_PENDING'
                            }
                            className="py-3 bg-green-50 text-primary font-black rounded-xl border border-primary/20 hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            HOÀN 50%
                          </button>
                          <button
                            onClick={() => handleAdminAction(false)}
                            disabled={
                              submitting ||
                              selectedDispute.status === 'COMPLETED' ||
                              selectedDispute.status === 'REFUND_PENDING'
                            }
                            className="py-3 bg-red-50 text-red-500 font-black rounded-xl border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            TỪ CHỐI
                          </button>
                        </div>
                      </div>
                      {selectedDispute.status === 'COMPLETED' && (
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300">
                          <div className="size-8 bg-emerald-500 rounded-full flex items-center justify-center text-white scale-75">
                            <ShieldCheck className="size-5" />
                          </div>
                          <p className="text-xs font-bold text-emerald-700">
                            Khiếu nại này đã được giải quyết thành công.
                          </p>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-400 font-medium italic text-center">
                        Hành động này sẽ giải quyết tranh chấp và cập nhật ví tiền của các bên liên
                        quan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50/10">
          <div className="text-center">
            <ShieldCheck className="size-20 text-gray-100 mx-auto mb-4" />
            <p className="text-lg font-black text-gray-300 uppercase tracking-widest">
              Chọn một khiếu nại để giải quyết
            </p>
          </div>
        </div>
      )}
      {/* PayOS QR Modal */}
      {payOSQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-primary text-white text-center relative">
              <button
                onClick={() => setPayOSQR(null)}
                className="absolute top-6 right-6 size-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <XCircle className="size-6" />
              </button>
              <div className="size-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="size-10" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Xác nhận chuyển khoản</h3>
              <p className="text-sm font-medium opacity-80 mt-2">
                Vui lòng quét mã QR bên dưới để hoàn tất giao dịch hoàn tiền cho khách hàng.
              </p>
            </div>
            <div className="p-10 flex flex-col items-center">
              <div className="p-4 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 mb-8 w-full flex justify-center">
                <img
                  src={payOSQR.qrCodeUrl}
                  alt="PayOS QR"
                  className="size-64 object-contain shadow-sm"
                />
              </div>
              <a
                href={payOSQR.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl text-center hover:bg-black transition-all shadow-xl shadow-gray-200 mb-4"
              >
                MỞ TRONG TRÌNH DUYỆT
              </a>
              <button
                onClick={() => {
                  setPayOSQR(null)
                  fetchDisputes()
                }}
                className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200"
              >
                ĐÃ HOÀN TẤT / ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Disputes

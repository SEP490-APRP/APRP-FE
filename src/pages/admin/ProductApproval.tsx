import React, { useState } from 'react'
import {
  Check,
  X,
  Eye,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Package,
  Star,
  Sparkles,
  ShieldCheck,
  Search,
} from 'lucide-react'
import { normalizeExpiryDate, type ProductResponse } from '@/services'
import {
  useApproveProduct,
  usePendingProducts,
  useProductImages,
  useRejectProduct,
  useApproveProductImage,
} from '@/features/product'
import { globalShowAlert, globalShowConfirm } from '@/components/common/Popup'
import { getErrorMessage } from '@/utils'

const ProductApproval: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingProductId, setRejectingProductId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [aiFilter, setAiFilter] = useState<'all' | 'flagged' | 'clean'>('all')
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null)
  // Ảnh đang xem gắn với sản phẩm: đổi sản phẩm thì tự quay về ảnh đầu.
  const [preview, setPreview] = useState<{ productId?: number; idx: number }>({ idx: 0 })

  const pendingQuery = usePendingProducts()
  const galleryQuery = useProductImages(selectedProduct?.id)
  const approve = useApproveProduct()
  const reject = useRejectProduct()
  const approveImage = useApproveProductImage()

  const handleApproveSingleImage = async (imageId: number) => {
    if (!selectedProduct) return
    if (!(await globalShowConfirm('Phê duyệt bức ảnh phụ này để hiển thị công khai cho khách mua hàng?'))) return
    try {
      await approveImage.mutateAsync({ productId: selectedProduct.id, imageId })
      globalShowAlert('Đã phê duyệt ảnh phụ thành công!', 'Thành công', 'success')
      void galleryQuery.refetch()
    } catch (err) {
      globalShowAlert(getErrorMessage(err, 'Có lỗi khi phê duyệt ảnh'), 'Lỗi', 'error')
    }
  }

  const products = pendingQuery.data ?? []
  const isLoading = pendingQuery.isLoading
  const isRefreshing = pendingQuery.isFetching && !pendingQuery.isLoading
  const error = pendingQuery.isError ? 'Mất kết nối tải dữ liệu. Vui lòng thử lại sau.' : null
  const isProcessing = approve.isPending || reject.isPending
  const galleryImages = galleryQuery.data ?? []
  const galleryLoading = galleryQuery.isFetching
  const previewIdx = preview.productId === selectedProduct?.id ? preview.idx : 0
  const setPreviewIdx = (idx: number) => setPreview({ productId: selectedProduct?.id, idx })
  const fetchProducts = () => void pendingQuery.refetch()

  const handleApprove = async (product: ProductResponse) => {
    if (!(await globalShowConfirm(`Duyệt sản phẩm "${product.productName}"?`))) return
    try {
      await approve.mutateAsync(product.id)
      globalShowAlert(`Đã duyệt sản phẩm "${product.productName}"`, 'Thành công', 'success')
      setSelectedProduct(null)
    } catch (err) {
      globalShowAlert(getErrorMessage(err, 'Có lỗi khi duyệt sản phẩm'), 'Lỗi', 'error')
    }
  }

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      globalShowAlert('Vui lòng nhập lý do từ chối', 'Lỗi', 'error')
      return
    }
    if (!rejectingProductId) return
    try {
      await reject.mutateAsync({ productId: rejectingProductId, reason: rejectReason })
      globalShowAlert(`Đã từ chối sản phẩm #${rejectingProductId}`, 'Thành công', 'success')
      setShowRejectModal(false)
      setRejectReason('')
      setRejectingProductId(null)
      setSelectedProduct(null)
    } catch (err) {
      globalShowAlert(getErrorMessage(err, 'Có lỗi khi từ chối sản phẩm'), 'Lỗi', 'error')
    }
  }

  const getAiStatus = (product: ProductResponse): 'flagged' | 'clean' | 'unscanned' => {
    if (product.moderationResult == null) return 'unscanned'
    return product.moderationResult.isFlagged ? 'flagged' : 'clean'
  }

  const flaggedCount = products.filter((p) => getAiStatus(p) === 'flagged').length
  const cleanCount = products.filter((p) => getAiStatus(p) === 'clean').length

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filtered = products.filter((p) => {
    if (aiFilter === 'flagged' && getAiStatus(p) !== 'flagged') return false
    if (aiFilter === 'clean' && getAiStatus(p) !== 'clean') return false
    if (!normalizedQuery) return true
    const shopText = (p.shopName || `Shop #${p.shopOwnerId || p.shopId || ''}`).toLowerCase()
    return (
      p.productName.toLowerCase().includes(normalizedQuery) ||
      p.id.toString().includes(normalizedQuery) ||
      shopText.includes(normalizedQuery)
    )
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <Loader2 className="size-10 text-primary animate-spin" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
          Đang tải danh sách chờ duyệt...
        </p>
      </div>
    )
  }

  if (selectedProduct) {
    const categoryLabel =
      typeof selectedProduct.category === 'string'
        ? selectedProduct.category
        : selectedProduct.category?.name
    const shopLabel =
      selectedProduct.shopName ||
      `#${selectedProduct.shopOwnerId || selectedProduct.shopId || '?'}`
    const currentPreviewUrl =
      galleryImages[previewIdx]?.imageUrl ||
      selectedProduct.imageUrl ||
      'https://picsum.photos/seed/product/400/400'
    const isAiFlagged = Boolean(
      selectedProduct.moderationResult?.isFlagged ||
        galleryImages.some((img) => img.isFlagged || img.isApproved === false),
    )
    const confidenceVal = Number(selectedProduct.moderationResult?.overallConfidence ?? 100)

    return (
      <div className="flex flex-col gap-6 p-6 lg:p-8 pb-24 animate-in fade-in duration-300">
        {/* Top Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-gray-200/80">
          <div className="flex flex-col gap-1.5">
            <div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>Quay lại danh sách</span>
              </button>
            </div>
            <div className="flex items-center gap-3 flex-wrap mt-0.5">
              <h2 className="text-2xl font-black font-display text-slate-900 tracking-tight">
                {selectedProduct.productName}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                <span className="size-1.5 rounded-full bg-amber-500" />
                Chờ duyệt
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 font-medium">
              <span>
                Mã <strong className="text-slate-700 font-semibold">#{selectedProduct.id}</strong>
              </span>
              {categoryLabel && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    Danh mục:{' '}
                    <strong className="text-slate-700 font-semibold">{categoryLabel}</strong>
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>
                Cửa hàng: <strong className="text-slate-700 font-semibold">{shopLabel}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                setRejectingProductId(selectedProduct.id)
                setShowRejectModal(true)
              }}
              className="px-4 py-2.5 bg-white text-red-600 text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-red-50 transition-colors flex items-center justify-center gap-2 border border-red-200 cursor-pointer disabled:opacity-50"
            >
              <X className="size-4" /> Từ Chối
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleApprove(selectedProduct)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Duyệt Sản Phẩm
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Sticky Column: Gallery + Compact Metadata */}
          <div className="lg:col-span-5 lg:sticky lg:top-6">
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-5">
              {galleryLoading ? (
                <div className="w-full aspect-square rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Loader2 className="size-8 text-primary animate-spin" />
                </div>
              ) : galleryImages.length > 0 ? (
                <div className="space-y-3">
                  <div
                    onClick={() => setZoomImageUrl(currentPreviewUrl)}
                    title="Nhấn để phóng to ảnh"
                    className="group relative w-full aspect-square rounded-xl overflow-hidden border border-gray-200 bg-slate-50 cursor-zoom-in"
                  >
                    <img
                      src={currentPreviewUrl}
                      alt={selectedProduct.productName}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    {galleryImages[previewIdx]?.isPrimary && (
                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-primary text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                        <Star className="size-3 fill-white" /> Ảnh chính
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <span className="bg-black/55 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                        {previewIdx + 1}/{galleryImages.length}
                      </span>
                      <span className="bg-black/55 text-white p-1.5 rounded-full backdrop-blur-xs opacity-80 group-hover:opacity-100">
                        <Eye className="size-3.5" />
                      </span>
                    </div>
                  </div>
                  {galleryImages.length > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                      {galleryImages.map((img, idx) => (
                        <button
                          type="button"
                          key={img.id}
                          onClick={() => setPreviewIdx(idx)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            idx === previewIdx
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-transparent opacity-65 hover:opacity-100'
                          }`}
                        >
                          <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                          {img.isPrimary && (
                            <div className="absolute inset-0 flex items-end justify-center pb-0.5">
                              <Star className="size-3 text-primary fill-primary drop-shadow" />
                            </div>
                          )}
                          {(img.isApproved === false || img.isFlagged) && (
                            <div className="absolute top-0 right-0 p-1 bg-amber-500 rounded-bl-md text-white">
                              <AlertTriangle className="size-2.5" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => setZoomImageUrl(currentPreviewUrl)}
                  className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-slate-50 cursor-zoom-in"
                >
                  <img
                    src={currentPreviewUrl}
                    alt={selectedProduct.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Info + AI Moderation */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6">
              <h3 className="text-base font-extrabold text-slate-900 mb-4">Thông Tin Sản Phẩm</h3>

              {/* 2x2 Key Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">Giá bán</p>
                  {selectedProduct.discountPercent != null &&
                  selectedProduct.discountPercent > 0 ? (
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-500 line-through font-semibold">
                          {(selectedProduct.sellingPrice || 0).toLocaleString('vi-VN')}đ
                        </span>
                        <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          -{selectedProduct.discountPercent}%
                        </span>
                      </div>
                      <p className="text-lg font-extrabold text-primary">
                        {(
                          selectedProduct.salePrice ??
                          Math.round(
                            ((selectedProduct.pricePerKg ?? selectedProduct.sellingPrice) || 0) *
                              (1 - selectedProduct.discountPercent / 100),
                          )
                        ).toLocaleString('vi-VN')}
                        đ / kg
                      </p>
                      {selectedProduct.discountEndDate && (
                        <p className="text-[11px] text-primary font-semibold">
                          Còn đến{' '}
                          {new Date(selectedProduct.discountEndDate).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-lg font-extrabold text-primary">
                      {(
                        (selectedProduct.pricePerKg ?? selectedProduct.sellingPrice) ||
                        0
                      ).toLocaleString('vi-VN')}
                      đ / kg
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">Tồn kho</p>
                  <p className="text-lg font-extrabold text-slate-900">
                    {(
                      (selectedProduct.stockKg ??
                        selectedProduct.stockQuantity ??
                        selectedProduct.stock) ||
                      0
                    ).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}{' '}
                    kg
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">Hạn sử dụng</p>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedProduct.expiryDate
                      ? normalizeExpiryDate(selectedProduct.expiryDate) ||
                        String(selectedProduct.expiryDate)
                      : '—'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">
                    Vùng trồng / Xuất xứ
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedProduct.origin || '—'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Mô tả sản phẩm</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                  {selectedProduct.description || '—'}
                </p>
              </div>
            </div>

            {/* Thẩm định AI Google Cloud Vision */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Thẩm Định AI (Google Cloud Vision)
                  </h3>
                </div>
                {selectedProduct.moderationResult == null ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 flex items-center gap-1.5 border border-slate-200">
                    <AlertTriangle size={12} className="text-slate-500" /> Chưa có dữ liệu AI
                  </span>
                ) : isAiFlagged ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle size={12} /> Cần Admin soi mắt
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                    <ShieldCheck size={12} /> Nông sản đạt chuẩn
                  </span>
                )}
              </div>

              {isAiFlagged && (
                <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                    <span>Cảnh Báo Từ Hệ Thống AI:</span>
                  </div>
                  <p className="font-semibold text-amber-800 pl-6">
                    {selectedProduct.moderationResult?.flagReason ||
                      galleryImages.find((img) => img.isFlagged || img.flagReason)?.flagReason ||
                      'Ảnh sản phẩm có dấu hiệu bất thường hoặc nghi ngờ lệch loại nông sản. Đề nghị Admin kiểm tra kỹ trước khi duyệt.'}
                  </p>
                </div>
              )}

              {selectedProduct.moderationResult ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>Độ tin cậy tổng thể</span>
                      <span className="text-slate-900 font-extrabold">
                        {confidenceVal.toFixed(2).replace(/\.00$/, '')}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isAiFlagged ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, confidenceVal))}%` }}
                      />
                    </div>
                  </div>
                  {selectedProduct.moderationResult.moderationLabels &&
                    selectedProduct.moderationResult.moderationLabels.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-slate-500 mb-2">
                          Nhãn AI nhận diện được (
                          {selectedProduct.moderationResult.moderationLabels.length} nhãn)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.moderationResult.moderationLabels.map((lbl) => (
                            <span
                              key={lbl.id}
                              title={`${lbl.labelNameVi || lbl.labelName} (${lbl.labelName}): ${lbl.confidence}%`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
                            >
                              <span>{lbl.labelNameVi || lbl.labelName}</span>
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                {lbl.confidence}%
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600">
                  <p className="font-bold text-slate-800">
                    Chưa có kết quả thẩm định tự động từ Google Cloud Vision.
                  </p>
                  <p className="mt-1 text-slate-500">
                    Sản phẩm này chưa có bản ghi cờ cảnh báo. Vui lòng kiểm tra kỹ hình ảnh và
                    thông tin nông sản bằng mắt thường trước khi phê duyệt.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Decision Bar (for convenience after reading bottom section) */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Quyết Định Kiểm Duyệt</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xác nhận niêm yết hoặc từ chối kèm lý do gửi nhà vườn.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    setRejectingProductId(selectedProduct.id)
                    setShowRejectModal(true)
                  }}
                  className="px-5 py-2.5 bg-white text-red-600 text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-red-50 transition-colors flex items-center justify-center gap-2 border border-red-200 cursor-pointer disabled:opacity-50"
                >
                  <X className="size-4" /> Từ Chối
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleApprove(selectedProduct)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Duyệt Sản Phẩm
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lightbox phóng to ảnh */}
        {zoomImageUrl && (
          <div
            onClick={() => setZoomImageUrl(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-zoom-out"
          >
            <button
              type="button"
              onClick={() => setZoomImageUrl(null)}
              aria-label="Đóng ảnh phóng to"
              className="absolute top-5 right-5 size-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <img
              src={zoomImageUrl}
              alt={selectedProduct.productName}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-[88vh] rounded-2xl object-contain shadow-2xl cursor-default"
            />
          </div>
        )}

        {/* Modal từ chối duyệt khi đang xem chi tiết sản phẩm */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
              <h3 className="text-2xl font-black text-gray-900 mb-2">Lý Do Từ Chối</h3>
              <p className="text-sm text-gray-400 mb-6">
                Nông dân sẽ nhận được thông báo kèm lý do này.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Ảnh sản phẩm không rõ ràng, sai loại nông sản..."
                className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all resize-none mb-6"
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectReason('')
                    setRejectingProductId(null)
                  }}
                  className="flex-1 py-4 bg-gray-50 text-gray-600 text-sm font-black rounded-2xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  disabled={isProcessing || !rejectReason.trim()}
                  onClick={confirmReject}
                  className="flex-[2] py-4 bg-red-600 text-white text-sm font-black rounded-2xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <X className="size-4" />
                  )}
                  Xác Nhận Từ Chối
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-gray-900 mb-2">Lý Do Từ Chối</h3>
            <p className="text-sm text-gray-400 mb-6">
              Nông dân sẽ nhận được thông báo kèm lý do này.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Ảnh sản phẩm không rõ ràng, thiếu thông tin..."
              className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all resize-none mb-6"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                disabled={isProcessing}
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                  setRejectingProductId(null)
                }}
                className="flex-1 py-4 bg-gray-50 text-gray-600 text-sm font-black rounded-2xl hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                disabled={isProcessing || !rejectReason.trim()}
                onClick={confirmReject}
                className="flex-[2] py-4 bg-red-600 text-white text-sm font-black rounded-2xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <X className="size-4" />
                )}
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 p-6 lg:p-8 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-gray-200/80">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-black font-display text-slate-900 tracking-tight">
                Duyệt Sản Phẩm
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                <span className="size-1.5 rounded-full bg-amber-500" />
                {products.length} chờ duyệt
              </span>
            </div>
            <p className="text-slate-500 font-medium text-sm mt-1">
              Các sản phẩm nông dân đăng lên đang chờ phê duyệt.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchProducts}
              disabled={isRefreshing}
              aria-label="Làm mới danh sách"
              title="Làm mới danh sách"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-gray-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200/80 p-4 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-semibold">
            <AlertCircle className="size-5 shrink-0" /> {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative w-full md:max-w-sm">
              <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                aria-label="Tìm theo tên, mã sản phẩm hoặc tên shop"
                placeholder="Tìm theo tên, mã SP hoặc tên shop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-gray-200/80 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div
              role="tablist"
              aria-label="Lọc theo kết quả thẩm định AI"
              className="inline-flex items-center p-1 rounded-xl bg-slate-100/80 border border-gray-200/60 self-start md:self-auto"
            >
              {(
                [
                  { id: 'all', label: 'Tất cả', count: products.length },
                  { id: 'flagged', label: 'Cần soi mắt', count: flaggedCount },
                  { id: 'clean', label: 'AI đạt chuẩn', count: cleanCount },
                ] as const
              ).map((tab) => {
                const active = aiFilter === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setAiFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                        active
                          ? tab.id === 'flagged' && tab.count > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/70 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Shop
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Giá / Tồn kho
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Hạn SD
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Thẩm định AI
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Package className="size-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600 font-semibold text-sm">
                        {products.length === 0
                          ? 'Không có sản phẩm nào đang chờ duyệt.'
                          : 'Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.'}
                      </p>
                      {(searchQuery || aiFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('')
                            setAiFilter('all')
                          }}
                          className="mt-3 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => {
                    const rowCategory =
                      typeof product.category === 'string'
                        ? product.category
                        : product.category?.name
                    const aiStatus = getAiStatus(product)
                    return (
                      <tr
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3.5">
                            <img
                              src={product.imageUrl || 'https://picsum.photos/seed/product/80/80'}
                              className="size-12 rounded-xl object-cover border border-gray-200/80 bg-slate-50 shrink-0"
                              alt={product.productName}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1 max-w-[220px]">
                                {product.productName}
                              </p>
                              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span>#{product.id}</span>
                                {rowCategory && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-slate-600">{rowCategory}</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-semibold text-slate-700 line-clamp-2 max-w-[190px]">
                            {product.shopName ||
                              `Shop #${product.shopOwnerId || product.shopId || '?'}`}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {product.discountPercent != null && product.discountPercent > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-red-500 line-through font-medium">
                                  {(product.sellingPrice || 0).toLocaleString('vi-VN')}đ
                                </span>
                                <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                  -{product.discountPercent}%
                                </span>
                              </div>
                              <p className="text-sm font-extrabold text-primary">
                                {(
                                  product.salePrice ??
                                  Math.round(
                                    (product.sellingPrice || 0) * (1 - product.discountPercent / 100),
                                  )
                                ).toLocaleString('vi-VN')}
                                đ
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm font-extrabold text-primary">
                              {(product.sellingPrice || 0).toLocaleString('vi-VN')}đ
                            </p>
                          )}
                          <p className="text-xs text-slate-500 font-medium">
                            {(
                              (product.stockKg ?? product.stockQuantity ?? product.stock) ||
                              0
                            ).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}{' '}
                            kg
                          </p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-600 tabular-nums whitespace-nowrap">
                            {normalizeExpiryDate(product.expiryDate) || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {aiStatus === 'flagged' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 whitespace-nowrap">
                              <span className="size-1.5 rounded-full bg-amber-500" />
                              Cần soi mắt
                            </span>
                          ) : aiStatus === 'clean' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 whitespace-nowrap">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              AI đạt chuẩn
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/80 whitespace-nowrap">
                              <span className="size-1.5 rounded-full bg-slate-400" />
                              Chưa quét
                            </span>
                          )}
                        </td>
                        <td
                          className="px-5 py-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedProduct(product)}
                              className="px-2.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200/80 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                            >
                              <Eye className="size-3.5 shrink-0" /> Xem
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleApprove(product)}
                              className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50 cursor-pointer"
                            >
                              <Check className="size-3.5 shrink-0" /> Duyệt
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => {
                                setRejectingProductId(product.id)
                                setShowRejectModal(true)
                              }}
                              className="px-2.5 py-1.5 bg-red-50 text-red-700 border border-red-200/70 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50 cursor-pointer"
                            >
                              <X className="size-3.5 shrink-0" /> Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProductApproval

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Camera,
  Upload,
  X,
  Loader2,
  AlertCircle,
  Sprout,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Search,
  ScanSearch,
} from 'lucide-react'
import { productService } from '@/services/product.service'
import type { ImageSearchResponse } from '@/services/product.types'

interface ImageSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectKeyword: (keyword: string) => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

const QUICK_SUGGESTIONS = [
  { label: 'Cà chua bi', keyword: 'cà chua' },
  { label: 'Bơ sáp 034', keyword: 'bơ' },
  { label: 'Bông cải xanh', keyword: 'bông cải' },
  { label: 'Bắp cải trái tim', keyword: 'bắp cải' },
  { label: 'Cà rốt Đà Lạt', keyword: 'cà rốt' },
  { label: 'Dưa hấu đỏ', keyword: 'dưa hấu' },
  { label: 'Thanh long', keyword: 'thanh long' },
  { label: 'Nấm đùi gà', keyword: 'nấm' },
]

export default function ImageSearchModal({
  isOpen,
  onClose,
  onSelectKeyword,
}: ImageSearchModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<ImageSearchResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCooldown, setIsCooldown] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<number | null>(null)
  const [dynamicSuggestions, setDynamicSuggestions] = useState<{ label: string; keyword: string }[]>([])

  // Lấy động danh sách nông sản thực tế từ CSDL để hiển thị gợi ý (không dùng dữ liệu tĩnh)
  useEffect(() => {
    productService
      .getAll({ page: 1, size: 8 })
      .then((res) => {
        if (res.result && res.result.length > 0) {
          const items = res.result
            .map((p) => {
              const name = p.productName || (p as any).name || ''
              const shortName = name.split(' ').slice(0, 3).join(' ')
              return { label: shortName || name, keyword: shortName || name }
            })
            .filter((item, idx, self) => item.label && self.findIndex((s) => s.label === item.label) === idx)
            .slice(0, 8)
          if (items.length > 0) {
            setDynamicSuggestions(items)
          }
        }
      })
      .catch(() => {})
  }, [])

  const suggestions = dynamicSuggestions.length > 0 ? dynamicSuggestions : QUICK_SUGGESTIONS

  // Reset toàn bộ state khi đóng/mở modal
  useEffect(() => {
    if (!isOpen) {
      handleReset()
    }
  }, [isOpen])

  // Khóa cuộn trang nền khi mở modal
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Lắng nghe phím ESC để đóng
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Hủy countdown timer khi unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Hỗ trợ Paste ảnh từ Clipboard (Ctrl + V)
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) {
          processFile(file)
          break
        }
      }
    }
  }, [])

  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setIsAnalyzing(false)
    setResult(null)
    setErrorMessage(null)
    setRedirectCountdown(null)
  }

  const processFile = (file: File) => {
    setErrorMessage(null)
    setResult(null)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setRedirectCountdown(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage('Định dạng ảnh không hỗ trợ. Vui lòng chọn ảnh JPG, PNG hoặc WEBP.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('Dung lượng ảnh vượt quá 5MB. Vui lòng nén hoặc chọn ảnh nhỏ hơn.')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(objectUrl)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      processFile(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files[0]) {
      processFile(files[0])
    }
  }

  // Thực hiện tìm kiếm ảnh qua API
  const handleSearch = async () => {
    if (!selectedFile || isAnalyzing || isCooldown) return

    setIsAnalyzing(true)
    setErrorMessage(null)
    setResult(null)

    // Cooldown 3s chống spam click
    setIsCooldown(true)
    setTimeout(() => setIsCooldown(false), 3000)

    try {
      const response = await productService.searchByImage(selectedFile)
      if (response.result) {
        setResult(response.result)

        // Nếu nhận diện thành công nông sản VÀ có sản phẩm khớp trong kho -> Bắt đầu đếm lùi 3s tự chuyển hướng
        const isAgri = Boolean(response.result.isAgricultural ?? (response.result as any).agricultural)
        if (isAgri && response.result.searchKeyword && response.result.totalMatches > 0) {
          const targetKeyword = response.result.searchKeyword
          setRedirectCountdown(3)

          timerRef.current = window.setInterval(() => {
            setRedirectCountdown((prev) => {
              if (prev === null || prev <= 1) {
                if (timerRef.current) clearInterval(timerRef.current)
                onSelectKeyword(targetKeyword)
                onClose()
                return null
              }
              return prev - 1
            })
          }, 1000)
        }
      } else {
        setErrorMessage('Không nhận được phản hồi từ hệ thống AI. Vui lòng thử lại.')
      }
    } catch (err: any) {
      if (err?.status === 429 || err?.data?.code === 3026) {
        setErrorMessage('Bạn đang tìm kiếm ảnh quá nhanh! Vui lòng chờ 1 phút trước khi thử lại.')
      } else {
        setErrorMessage(
          err?.message || 'Có lỗi xảy ra trong quá trình nhận diện hình ảnh. Vui lòng thử lại.',
        )
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleManualRedirect = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (result?.searchKeyword) {
      onSelectKeyword(result.searchKeyword)
      onClose()
    }
  }

  const handleCancelAutoRedirect = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setRedirectCountdown(null)
  }

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      onPaste={handlePaste}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-search-title"
    >
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
        <div
          className="relative bg-white rounded-xl overflow-hidden shadow-xl max-w-lg w-full border border-[#ede7d8] flex flex-col max-h-[90vh] animate-scaleUp text-[#1c2216]"
          onClick={(e) => e.stopPropagation()}
        >
        {/* ========================================================= */}
        {/* MODAL HEADER: Sang trọng, chuẩn nhận diện CapNong         */}
        {/* ========================================================= */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[#f0ebd9] bg-[#faf7ef]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#326318]/10 text-[#326318] flex items-center justify-center shadow-inner shrink-0">
              <ScanSearch size={20} className="text-[#326318]" />
            </div>
            <div>
              <h3 id="image-search-title" className="text-base font-extrabold text-[#1c2216]">
                Tìm kiếm bằng hình ảnh
              </h3>
              <p className="text-xs text-[#6e7766] mt-0.5">
                Chụp hoặc tải ảnh rau, củ, quả tươi để tìm sản phẩm tương đồng trong kho
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white hover:bg-[#eae3d2] text-[#6e7766] hover:text-[#1c2216] border border-[#e5dec9] flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Đóng cửa sổ"
          >
            <X size={16} />
          </button>
        </div>

        {/* ========================================================= */}
        {/* MODAL BODY: Cuộn linh hoạt, không bao giờ bị tràn màn hình */}
        {/* ========================================================= */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Thông báo lỗi (nếu có) */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50/90 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* TRƯỜNG HỢP 1: CHƯA CHỌN ẢNH (DROPZONE TRANG NHÃ) */}
          {!previewUrl ? (
            <div className="space-y-3.5">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-[#326318] bg-[#326318]/10 scale-[0.99]'
                    : 'border-[#326318]/25 hover:border-[#326318] bg-[#faf7ef]/50 hover:bg-[#326318]/5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="w-13 h-13 rounded-lg bg-white shadow-sm border border-[#ede5d4] text-[#326318] mx-auto flex items-center justify-center mb-3 group-hover:scale-105 group-hover:border-[#326318]/40 transition-all">
                  <ScanSearch size={24} className="text-[#326318]" />
                </div>

                <h4 className="text-sm font-extrabold text-[#1c2e17] mb-1">
                  Kéo thả hoặc tải ảnh nông sản lên đây
                </h4>
                <p className="text-xs text-[#6e7766] max-w-xs mx-auto mb-3.5 leading-relaxed">
                  Hỗ trợ định dạng JPG, PNG, WEBP (tối đa 5MB) &bull; Có thể dán ảnh từ clipboard (Ctrl + V)
                </p>

                <div
                  className="flex items-center justify-center gap-2.5 pt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-[#326318] hover:bg-[#254b12] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Upload size={15} />
                    <span>Chọn ảnh từ máy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg border border-[#d6cfbe] hover:border-[#326318] bg-white hover:bg-[#f6f2e8] text-[#2a3520] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Camera size={15} />
                    <span>Chụp ảnh mới</span>
                  </button>
                </div>
              </div>

              {/* Gợi ý tìm kiếm phổ biến (Interactive Chips từ DB) */}
              <div className="p-3.5 rounded-xl bg-[#faf7ef] border border-[#ede5d6] text-xs text-[#6a7463]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-[#2a3520] text-xs">
                    <Search size={13} className="text-[#326318]" />
                    <span>Gợi ý tìm nhanh nông sản trong kho:</span>
                  </div>
                  <span className="text-[10px] text-[#717b6a]">Bấm để tìm</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((item) => (
                    <button
                      key={item.keyword}
                      type="button"
                      onClick={() => {
                        onSelectKeyword(item.keyword)
                        onClose()
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#326318] text-[#343e2c] hover:text-white border border-[#e5dec9] hover:border-[#326318] text-xs font-semibold transition-all shadow-xs cursor-pointer group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#326318] group-hover:bg-white transition-colors" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#75806e] mt-2 leading-relaxed pt-2 border-t border-[#ede5d4]">
                  <strong>Mẹo:</strong> Chụp cận cảnh 1 loại củ, quả hoặc rau tươi với đủ ánh sáng để hệ thống nhận diện nhanh và chuẩn xác nhất.
                </p>
              </div>
            </div>
          ) : (
            /* TRƯỜNG HỢP 2: ĐÃ CHỌN ẢNH (PREVIEW GỌN GÀNG + KẾT QUẢ SANG TRỌNG) */
            <div className="space-y-4">
              {/* Khung ảnh Preview: Chiều cao cân đối, bo góc đẹp */}
              <div className="relative w-full h-44 sm:h-48 rounded-xl overflow-hidden bg-stone-100 border border-[#ede5d6] flex items-center justify-center group shadow-inner">
                <img
                  src={previewUrl}
                  alt="Ảnh tìm kiếm"
                  className="w-full h-full object-contain p-2"
                />

                {/* Tag tên file ở góc dưới */}
                {selectedFile && !isAnalyzing && (
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/60 text-white text-[11px] font-medium backdrop-blur-md max-w-[200px] truncate">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </div>
                )}

                {/* Nút đổi ảnh khác ở góc trên */}
                {!isAnalyzing && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1.5 rounded-lg bg-white/90 hover:bg-white text-[#2a3520] text-xs font-bold border border-stone-200 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-sm"
                  >
                    <RotateCcw size={13} />
                    <span>Đổi ảnh</span>
                  </button>
                )}

                {/* Hiệu ứng phân tích ảnh nhẹ nhàng */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-[#1c2e17]/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                    <div className="relative mb-2">
                      <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <ScanSearch
                        size={18}
                        className="absolute inset-0 m-auto text-emerald-300 animate-pulse"
                      />
                    </div>
                    <span className="text-xs font-bold tracking-wide drop-shadow">
                      Đang phân tích hình ảnh...
                    </span>
                    <span className="text-[10px] text-white/80 mt-1">
                      Đối soát tự động với danh mục nông sản CapNong
                    </span>
                  </div>
                )}
              </div>

              {/* KẾT QUẢ NHẬN DIỆN */}
              {result && (() => {
                const isAgri = Boolean(result.isAgricultural ?? (result as any).agricultural)
                return (
                  <div className="animate-fadeIn">
                    {isAgri ? (
                      /* KẾT QUẢ THÀNH CÔNG: XANH MÁT, TINH TẾ */
                      <div className="p-4 rounded-xl bg-gradient-to-br from-[#f2f7ed] to-[#e8f2e1] border border-[#cfe2c4] shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[#326318]">
                            <CheckCircle2 size={18} />
                            <span className="text-xs font-black uppercase tracking-wider">
                              Nhận diện thành công
                            </span>
                          </div>
                          {result.confidence !== null && result.confidence !== undefined && (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#326318] text-white shadow-xs">
                              Khớp {Math.round(result.confidence * 100)}%
                            </span>
                          )}
                        </div>

                        <div className="bg-white/80 rounded-lg p-3 border border-[#d6e5cd]">
                          <p className="text-[11px] text-[#6e7766] font-medium">Nông sản phát hiện:</p>
                          <h4 className="text-lg font-black text-[#1c2e17] mt-0.5 flex items-center gap-1.5">
                            <Sprout size={18} className="text-[#326318]" />
                            <span>{result.identifiedProduce}</span>
                          </h4>
                          <div className="flex items-center justify-between text-xs text-[#52604b] mt-2 pt-2 border-t border-stone-100">
                            <span>
                              {result.totalMatches > 0 ? (
                                <>Tìm thấy <strong>{result.totalMatches}</strong> sản phẩm đang bán khớp với từ khóa</>
                              ) : (
                                <>Hiện kho chưa có sẵn loại này &bull; Tìm các nông sản tương tự</>
                              )}
                            </span>
                            <span className="text-[11px] font-semibold text-[#326318] bg-[#326318]/10 px-2 py-0.5 rounded-md">
                              Từ khóa: “{result.searchKeyword}”
                            </span>
                          </div>
                        </div>

                        {/* Thanh chuyển hướng tự động */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleManualRedirect}
                            className="flex-1 py-2.5 px-4 rounded-lg bg-[#326318] hover:bg-[#254b12] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>
                              {result.totalMatches > 0
                                ? `Xem ngay ${result.totalMatches} sản phẩm`
                                : `Khám phá kho nông sản liên quan`}
                            </span>
                            <ArrowRight size={15} />
                          </button>
                          {redirectCountdown !== null && (
                            <button
                              type="button"
                              onClick={handleCancelAutoRedirect}
                              className="px-3 py-2.5 rounded-lg border border-[#d6cfbe] bg-white text-stone-600 hover:text-stone-900 text-xs font-semibold transition-colors"
                              title="Hủy tự động chuyển trang"
                            >
                              Dừng ({redirectCountdown}s)
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* KẾT QUẢ KHÔNG PHẢI NÔNG SẢN: CARD CẢNH BÁO THÂN THIỆN, HỮU ÍCH */
                      <div className="p-4 rounded-xl bg-[#fff9f2] border border-[#f5dfc6] text-[#7c4412] space-y-3 animate-fadeIn">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#fdecdb] text-[#c05621] flex items-center justify-center shrink-0 mt-0.5">
                            <AlertCircle size={18} />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-extrabold text-[#7c4412]">
                              Chưa nhận diện được nông sản
                            </h4>
                            <p className="text-xs text-[#8c5a2b] mt-1 leading-relaxed">
                              Hệ thống nhận thấy bức ảnh này có thể là người, đồ vật, thú cưng hoặc phong cảnh thay vì nông sản hoặc rau củ quả tươi.
                            </p>
                          </div>
                        </div>

                        {/* Hướng dẫn chụp ảnh đúng cách */}
                        <div className="p-3 rounded-lg bg-white/80 border border-[#f5dfc6] text-[11px] text-[#6d4c2b] space-y-1.5">
                          <p className="font-bold flex items-center gap-1 text-[#7c4412]">
                            <HelpCircle size={12} className="text-[#c05621]" />
                            <span>Để tìm được sản phẩm chính xác, bạn hãy thử:</span>
                          </p>
                          <p className="pl-4 leading-relaxed">
                            &bull; Chụp cận cảnh 1 loại rau, củ hoặc trái cây cụ thể.
                          </p>
                          <p className="pl-4 leading-relaxed">
                            &bull; Đảm bảo đủ ánh sáng, góc chụp thẳng và rõ nét.
                          </p>
                        </div>

                        {/* Các nút hành động */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleReset}
                            className="flex-1 py-2.5 px-4 rounded-lg bg-[#326318] hover:bg-[#254b12] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <RotateCcw size={14} />
                            <span>Thử lại với ảnh rau củ khác</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectKeyword('')
                              onClose()
                            }}
                            className="px-3.5 py-2.5 rounded-lg border border-[#d6cfbe] bg-white text-[#2a3520] hover:bg-[#f6f2e8] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Search size={14} />
                            <span>Xem toàn bộ kho</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Nút hành động khi chưa bấm nhận diện */}
              {!result && (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={isAnalyzing || isCooldown}
                    className="flex-1 py-2.5 rounded-lg bg-[#326318] hover:bg-[#254b12] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Đang phân tích hình ảnh...</span>
                      </>
                    ) : (
                      <>
                        <ScanSearch size={15} />
                        <span>Tìm sản phẩm tương đồng</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isAnalyzing}
                    className="px-4 py-2.5 rounded-lg border border-[#d6cfbe] bg-white hover:bg-[#f6f2e8] text-[#2a3520] text-xs font-bold transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>,
  document.body,
)
}

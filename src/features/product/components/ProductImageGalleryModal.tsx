import React, { useRef, useState } from 'react'
import {
  X,
  Upload,
  Star,
  Trash2,
  Sparkles,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ImageIcon,
} from 'lucide-react'
import {
  useProductImages,
  useUploadProductImage,
  useSetPrimaryProductImage,
  useDeleteProductImage,
} from '../hooks/useProductQueries'
import { getErrorMessage } from '@/utils'

interface ProductImageGalleryModalProps {
  productId: number
  productName: string
  isOpen: boolean
  onClose: () => void
  onInfo?: (msg: string) => void
}

export function ProductImageGalleryModal({
  productId,
  productName,
  isOpen,
  onClose,
  onInfo,
}: ProductImageGalleryModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [aiWarning, setAiWarning] = useState<string | null>(null)
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null)

  const { data: images = [], isLoading } = useProductImages(isOpen ? productId : undefined)
  const uploadMutation = useUploadProductImage()
  const setPrimaryMutation = useSetPrimaryProductImage()
  const deleteMutation = useDeleteProductImage()

  if (!isOpen) return null

  const handleFileChange = async (file: File) => {
    setAiWarning(null)
    setUploadSuccessMsg(null)

    // Kiểm tra định dạng cơ bản
    if (!file.type.startsWith('image/')) {
      setAiWarning('Vui lòng chỉ chọn tập tin hình ảnh (JPG, PNG, WEBP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setAiWarning('Dung lượng ảnh không được vượt quá 5MB')
      return
    }

    try {
      const isFirst = images.length === 0
      await uploadMutation.mutateAsync({
        productId,
        file,
        isPrimary: isFirst,
        displayOrder: images.length,
      })
      setUploadSuccessMsg('Đã thẩm định AI và thêm ảnh thành công!')
      onInfo?.('Tải lên ảnh nông sản thành công!')
      setTimeout(() => setUploadSuccessMsg(null), 4000)
    } catch (err: any) {
      const msg = getErrorMessage(err)
      // Bắt lỗi AI Rekognition không phải nông sản (mã 3022 từ BE)
      if (
        msg.includes('3022') ||
        msg.toLowerCase().includes('nông sản') ||
        msg.toLowerCase().includes('agricultural')
      ) {
        setAiWarning(
          '⚠️ AI phát hiện hình ảnh không phải là nông sản tươi sống hoặc chứa nội dung không phù hợp (xe cộ, đồ vật vô tri, thức ăn nhanh chế biến sẵn...). Vui lòng chọn ảnh chụp nông sản thật!',
        )
      } else {
        setAiWarning(msg || 'Lỗi khi tải ảnh lên. Vui lòng thử lại.')
      }
    }
  }

  const handleSetPrimary = async (imageId: number) => {
    try {
      await setPrimaryMutation.mutateAsync({ productId, imageId })
      onInfo?.('Đã đặt làm ảnh đại diện chính')
    } catch (err) {
      setAiWarning(getErrorMessage(err) || 'Không thể đặt làm ảnh chính')
    }
  }

  const handleDelete = async (imageId: number) => {
    if (window.confirm('Bạn có chắc muốn xóa ảnh này khỏi sản phẩm?')) {
      try {
        await deleteMutation.mutateAsync({ productId, imageId })
        onInfo?.('Đã xóa ảnh khỏi gallery')
      } catch (err) {
        setAiWarning(getErrorMessage(err) || 'Không thể xóa ảnh')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[32px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#e2dcce] relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#326318]/10 text-[#326318] flex items-center justify-center font-bold">
            <ImageIcon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-[#1c2216]">Thư Viện Ảnh Nông Sản</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#326318]/10 text-[#326318] flex items-center gap-1">
                <Sparkles size={11} /> AI Moderation
              </span>
            </div>
            <p className="text-xs text-[#7e8779] truncate max-w-md">
              Sản phẩm: <span className="font-bold text-[#1c2216]">{productName}</span>
            </p>
          </div>
        </div>

        {/* AI Notice / Feedback */}
        {aiWarning && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{aiWarning}</p>
            </div>
            <button
              type="button"
              onClick={() => setAiWarning(null)}
              className="text-amber-600 hover:text-amber-900 text-xs font-bold"
            >
              Đóng
            </button>
          </div>
        )}

        {uploadSuccessMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={16} className="text-green-600 shrink-0" />
            <span>{uploadSuccessMsg}</span>
          </div>
        )}

        {/* Scrollable Gallery Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragActive(false)
              if (e.dataTransfer.files?.[0]) {
                handleFileChange(e.dataTransfer.files[0])
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              dragActive
                ? 'border-[#326318] bg-[#f4f8f0]'
                : 'border-[#d8ded0] bg-[#fafcf8] hover:border-[#326318] hover:bg-[#f8fbf5]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileChange(e.target.files[0])
                  e.target.value = ''
                }
              }}
            />
            {uploadMutation.isPending ? (
              <div className="flex flex-col items-center gap-2 text-[#326318]">
                <Loader2 size={32} className="animate-spin" />
                <span className="text-xs font-bold">
                  Đang tải lên &amp; Thẩm định AI AWS Rekognition...
                </span>
                <span className="text-[10px] text-[#7e8779]">
                  Hệ thống đang kiểm tra tính xác thực của nông sản
                </span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-[#326318]/10 text-[#326318] flex items-center justify-center">
                  <Upload size={22} />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#1c2216]">
                    Nhấp để chọn ảnh hoặc kéo thả vào đây
                  </p>
                  <p className="text-[11px] text-[#7e8779] mt-0.5">
                    Hỗ trợ JPG, PNG, WEBP (tối đa 5MB). AI tự động kiểm duyệt nông sản.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Image Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#5b6454]">
                Hình ảnh hiện có ({images.length})
              </h4>
              <span className="text-[11px] text-[#7e8779]">
                Ảnh có sao vàng là ảnh đại diện chính
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-32 rounded-2xl bg-[#f0f4ec] animate-pulse border border-[#e4ebd9]"
                  />
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="p-8 text-center bg-[#fbfdfa] rounded-2xl border border-[#edf2e8]">
                <p className="text-xs text-[#7e8779]">
                  Chưa có hình ảnh nào. Hãy tải lên ảnh nông sản tươi chụp thực tế từ vườn!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={`group relative rounded-2xl overflow-hidden border-2 transition-all shadow-sm ${
                      img.isPrimary
                        ? 'border-[#326318] ring-2 ring-[#326318]/20'
                        : 'border-[#e4ebd9] hover:border-[#8ea27f]'
                    }`}
                  >
                    <img
                      src={img.imageUrl}
                      alt="Nông sản"
                      className="w-full h-32 object-cover"
                    />

                    {/* Primary Badge */}
                    {img.isPrimary && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#326318] text-white text-[10px] font-black flex items-center gap-1 shadow-md">
                        <Star size={10} className="fill-amber-300 text-amber-300" />
                        <span>Ảnh chính</span>
                      </div>
                    )}

                    {/* Hover Overlay Controls */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(Number(img.id))}
                          disabled={setPrimaryMutation.isPending}
                          title="Đặt làm ảnh chính"
                          className="p-2 rounded-xl bg-white text-[#326318] hover:bg-[#326318] hover:text-white transition-colors cursor-pointer shadow-md"
                        >
                          <Star size={16} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(Number(img.id))}
                        disabled={deleteMutation.isPending}
                        title="Xóa ảnh"
                        className="p-2 rounded-xl bg-white text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer shadow-md"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-[#f1f4ed] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
          >
            Hoàn Tất
          </button>
        </div>
      </div>
    </div>
  )
}

import React, { useEffect } from 'react'
import {
  AlertTriangle,
  X,
  PauseCircle,
  Trash2,
  Loader2,
  Layers,
  Sparkles,
} from 'lucide-react'

interface DeleteProductModalProps {
  isOpen: boolean
  item: any | null
  isDeleting: boolean
  isCombo?: boolean
  isBlindBox?: boolean
  onClose: () => void
  onConfirm: () => void
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
  isOpen,
  item,
  isDeleting,
  isCombo: isComboProp,
  isBlindBox: isBlindBoxProp,
  onClose,
  onConfirm,
}) => {
  // Đóng modal khi bấm phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isDeleting, onClose])

  if (!isOpen || !item) return null

  const isCombo =
    isComboProp !== undefined
      ? isComboProp
      : Boolean(item?.isCombo)

  const isBlindBox =
    isBlindBoxProp !== undefined
      ? isBlindBoxProp
      : Boolean(
          item?.isBlindBox ||
            (typeof item?.category === 'string' &&
              item.category.toLowerCase().includes('túi mù')) ||
            (typeof item?.category?.name === 'string' &&
              item.category.name.toLowerCase().includes('túi mù'))
        )

  const prodName = item.productName || item.name || 'Sản phẩm'
  const price = Number(item.sellingPrice ?? item.price ?? 0)
  const stock = Number(item.stockQuantity ?? item.stock ?? 0)
  const unit = item.unit || 'kg'
  const imgUrl =
    item.imageUrl ||
    item.image ||
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80'
  const catName =
    typeof item.category === 'object' && item.category !== null
      ? (item.category as any).name
      : item.category || (isCombo ? 'Combo món ngon' : isBlindBox ? 'Túi mù bí ẩn' : 'Nông sản')

  // Định nghĩa tiêu đề, mô tả và cấu hình nút theo từng loại mặt hàng
  const actionType = isCombo
    ? {
        title: 'Gỡ Combo Nông Sản?',
        badge: 'Combo',
        badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
        icon: <Layers size={24} className="text-teal-600" />,
        iconBg: 'bg-teal-100/70 border-teal-200',
        warningDesc:
          'Gói combo này sẽ bị gỡ khỏi danh sách bán. Khách hàng sẽ không thể tìm thấy hoặc đặt mua combo này nữa.',
        confirmText: 'Xác nhận gỡ Combo',
        confirmBtnBg: 'bg-teal-700 hover:bg-teal-800 focus:ring-teal-500',
      }
    : isBlindBox
    ? {
        title: 'Gỡ Túi Mù Khỏi Gian Hàng?',
        badge: 'Túi Mù',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <Sparkles size={24} className="text-amber-600" />,
        iconBg: 'bg-amber-100/70 border-amber-200',
        warningDesc:
          'Hộp/túi mù bí ẩn này sẽ ngừng mở bán trên sàn. Các đơn hàng đã đặt trước đó vẫn được đóng gói giao bình thường.',
        confirmText: 'Xác nhận gỡ Túi mù',
        confirmBtnBg: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
      }
    : {
        title: 'Tạm Dừng Bán Nông Sản?',
        badge: 'Nông sản',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <PauseCircle size={24} className="text-rose-600" />,
        iconBg: 'bg-rose-100/70 border-rose-200',
        warningDesc:
          'Nông sản sẽ được chuyển sang trạng thái "Tạm dừng" và ẩn khỏi gian hàng. Bạn có thể kích hoạt bán lại bất cứ lúc nào.',
        confirmText: 'Xác nhận tạm dừng',
        confirmBtnBg: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
      }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose()
        }
      }}
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200/90 animate-scaleUp relative overflow-hidden">
        {/* Nút đóng (X) */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          aria-label="Đóng hộp thoại"
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X size={18} />
        </button>

        {/* Header với Icon cảnh báo */}
        <div className="flex items-start gap-3.5 mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${actionType.iconBg}`}
          >
            {actionType.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3
                id="delete-modal-title"
                className="text-base sm:text-lg font-black text-[#1c2216]"
              >
                {actionType.title}
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Vui lòng kiểm tra lại thông tin nông sản trước khi thực hiện.
            </p>
          </div>
        </div>

        {/* Thẻ xem trước Nông sản (Product preview card) */}
        <div className="p-3 bg-[#fafcf9] border border-[#e3ebdc] rounded-2xl flex items-center gap-3.5 my-4">
          <img
            src={imgUrl}
            alt={prodName}
            className="w-14 h-14 rounded-xl object-cover border border-[#d6e0cc] shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-bold text-[#1c2216] truncate max-w-[200px]" title={prodName}>
                {prodName}
              </h4>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${actionType.badgeBg}`}>
                {actionType.badge}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-1 text-xs">
              <span className="font-black text-[#326318]">
                {price.toLocaleString('vi-VN')}đ / {unit}
              </span>
              <span className="text-stone-500 font-medium">
                Kho: <strong className="text-stone-800">{stock} {unit}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Hộp ghi chú / lưu ý */}
        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2 mb-5">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px] sm:text-xs text-amber-800">
            {actionType.warningDesc}
          </p>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            Giữ lại
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className={`flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 ${actionType.confirmBtnBg}`}
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>{actionType.confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useRef, type FormEvent } from 'react'
import { X, Sparkles, Loader2, Check, Upload } from 'lucide-react'
import { useAiSuggestDescription } from '@/features/product'
import { useMyProducts } from '@/features/product/hooks/useProductQueries'
import { useCreateMysteryBox } from '@/features/mystery-box'
import type { FarmerProduct } from './types'
import { uploadService, type ProductMysteryItemRequest } from '@/services'
import { getErrorMessage } from '@/utils'

interface BlindBoxToolProps {
  onAddBox?: (box: FarmerProduct) => void
  onClose: () => void
  onInfo?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void
}

interface SelectedMysteryProduct {
  productId: number
  productName: string
  unit: string
  stockAvailable: number
  quantity: number
  price: number
}

export default function BlindBoxTool({ onAddBox, onClose, onInfo }: BlindBoxToolProps) {
  // Form states mapping BE MysteryBoxCreationRequest
  const [name, setName] = useState('')
  const [price, setPrice] = useState('79000')
  const [note, setNote] = useState('Trọng lượng ~5kg, gồm rau củ quả tươi thu hoạch trong ngày')
  const [stock, setStock] = useState('10')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isAiGenerated, setIsAiGenerated] = useState(false)

  // Danh sách nông sản thành phần trong túi mù
  const [selectedItems, setSelectedItems] = useState<SelectedMysteryProduct[]>([])
  const [itemSearch, setItemSearch] = useState('')

  // Lấy danh sách nông sản đang bán trong kho của nhà vườn (hỗ trợ tìm kiếm & tải tối đa 100 mặt hàng)
  const { data: myProductsData, isLoading: isLoadingProducts } = useMyProducts({
    status: 'ACTIVE',
    keyword: itemSearch.trim() !== '' ? itemSearch.trim() : undefined,
    size: 100,
  })
  const availableProducts = myProductsData?.content || []

  // Hooks
  const aiSuggestMutation = useAiSuggestDescription()
  const createMysteryBoxMutation = useCreateMysteryBox()

  // Xử lý chọn / bỏ chọn nông sản thành phần
  const handleToggleProduct = (
    prodId: number,
    prodName: string,
    unit: string,
    stockQuantity: number,
    itemPrice: number = 0,
  ) => {
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.productId === prodId)
      if (existing) {
        return prev.filter((item) => item.productId !== prodId)
      } else {
        return [
          ...prev,
          {
            productId: prodId,
            productName: prodName,
            unit: unit || 'kg',
            stockAvailable: stockQuantity || 0,
            quantity: 1,
            price: itemPrice || 0,
          },
        ]
      }
    })
  }

  // Cập nhật số lượng của từng nông sản trong 1 hộp
  const handleQuantityChange = (prodId: number, newQty: number) => {
    if (newQty < 1) return
    setSelectedItems((prev) =>
      prev.map((item) => (item.productId === prodId ? { ...item, quantity: newQty } : item)),
    )
  }

  // Tính tổng giá trị thị trường của các nông sản được chọn trong 1 túi mù
  const totalMarketValue = selectedItems.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0,
  )
  const numPrice = Number(price) || 0
  const discountPercent =
    totalMarketValue > 0 && numPrice > 0 && totalMarketValue > numPrice
      ? Math.round(((totalMarketValue - numPrice) / totalMarketValue) * 100)
      : 0
  const isOverPriced = totalMarketValue > 0 && numPrice > totalMarketValue

  // AI gợi ý mô tả túi mù
  const handleAiSuggest = async () => {
    if (!name.trim()) {
      onInfo?.('Vui lòng nhập tên túi mù trước khi yêu cầu AI gợi ý mô tả!')
      return
    }

    try {
      const res = await aiSuggestMutation.mutateAsync({
        productName: name.trim(),
        productType: 'MYSTERY_BOX',
        categoryName: 'Hộp mù nông sản',
        origin: 'Đà Lạt & Lâm Đồng',
        currentDescription: description,
      })

      if (res.result?.suggestedDescription) {
        setDescription(res.result.suggestedDescription)
        setIsAiGenerated(true)
        onInfo?.('AI đã gợi ý mô tả! Vui lòng kiểm tra và xác minh lại thông tin trước khi lưu.')
      }
    } catch {
      onInfo?.('Không thể gợi ý mô tả lúc này, vui lòng thử lại sau.')
    }
  }

  // Tải ảnh đại diện túi mù từ file máy tính
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setFormError('Vui lòng chọn tập tin hình ảnh (JPG, PNG, WEBP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Dung lượng ảnh không được vượt quá 5MB')
      return
    }

    try {
      setIsUploadingImage(true)
      const res = await uploadService.uploadImage(file, 'mystery-boxes')
      if (res.result?.url) {
        setImageUrl(res.result.url)
        onInfo?.('Tải ảnh đại diện túi mù từ máy thành công!')
      }
    } catch (err: any) {
      setFormError(getErrorMessage(err) || 'Không thể tải ảnh lên. Vui lòng thử lại.')
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Submit tạo Túi Mù
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!name.trim()) {
      onInfo?.('Vui lòng nhập tên túi mù!')
      return
    }

    const numPrice = Number(price)
    const numTotalQty = Number(stock)

    if (isNaN(numPrice) || numPrice <= 0) {
      onInfo?.('Giá túi mù không hợp lệ!')
      return
    }

    if (isNaN(numTotalQty) || numTotalQty < 1) {
      onInfo?.('Số lượng hộp phát hành phải từ 1 trở lên!')
      return
    }

    if (selectedItems.length === 0) {
      onInfo?.('Vui lòng chọn ít nhất 1 loại nông sản thành phần trong kho đóng vào túi mù!')
      return
    }

    // Kiểm tra tồn kho khả dụng
    for (const item of selectedItems) {
      const needed = item.quantity * numTotalQty
      if (item.stockAvailable < needed) {
        onInfo?.(
          `Nông sản "${item.productName}" không đủ tồn kho (cần ${needed} ${item.unit}, hiện có ${item.stockAvailable} ${item.unit})!`,
        )
        return
      }
    }

    const itemsPayload: ProductMysteryItemRequest[] = selectedItems.map((item) => ({
      productId: item.productId,
      productQuantity: item.quantity,
    }))

    try {
      // 1. Gọi API thật của BE
      await createMysteryBoxMutation.mutateAsync({
        boxType: name.trim(),
        price: numPrice,
        totalQuantity: numTotalQty,
        description: description.trim() || undefined,
        note: note.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        items: itemsPayload,
      })

      onInfo?.(`Đã gửi duyệt và tạo thành công Túi Mù: ${name.trim()}`)
      onClose()
    } catch (err: any) {
      let friendlyMsg = getErrorMessage(err) || 'Không thể tạo túi mù'
      if (
        friendlyMsg.toLowerCase().includes('not agricultural') ||
        friendlyMsg.toLowerCase().includes('inappropriate') ||
        friendlyMsg.toLowerCase().includes('không phải là nông sản')
      ) {
        friendlyMsg = 'Ảnh sản phẩm không phải là nông sản hoặc không phù hợp với quy định kiểm duyệt của sàn. Vui lòng chọn ảnh nông sản hợp lệ!'
      }
      console.error('Mystery box API error:', err)
      setFormError(friendlyMsg)
      onInfo?.(friendlyMsg, 'error')
    }  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#e2dcce] relative overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#f1f4ed] flex items-center justify-between shrink-0 bg-[#fafcf9]">
          <div>
            <h3 className="text-base font-black text-[#1c2216]">Tạo Túi Mù Blind Box</h3>
            <p className="text-[11px] text-[#7e8779]">
              Đóng gói nông sản thành hộp bí ẩn giải cứu nhanh cuối ngày
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span className="font-semibold">{formError}</span>
            </div>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="text-red-400 hover:text-red-700 font-bold px-1.5 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Tên túi mù */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-[#353d2f]">Tên túi mù / Hộp quà bí ẩn *</label>
              <span className="text-[10px] text-gray-400">{name.length}/50 ký tự</span>
            </div>
            <input
              type="text"
              required
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Túi Mù Nông Sản Giải Cứu 5kg"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f7f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs text-[#1e2319] outline-none"
            />
          </div>

          {/* Giá bán túi mù & Tổng giá trị thị trường tự động tính */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#353d2f] mb-1">Giá bán túi mù (đ) *</label>
              <input
                type="number"
                required
                min={1000}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="VD: 79000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f7f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs text-[#1e2319] outline-none font-semibold"
              />
              <span className="block text-[10px] text-[#7e8779] mt-1 leading-tight">
                Giá thực tế khách thanh toán
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-[#353d2f]">
                  Tổng giá thị trường
                </label>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">
                  Tự động tính
                </span>
              </div>
              <input
                type="text"
                readOnly
                value={totalMarketValue > 0 ? `${totalMarketValue.toLocaleString('vi-VN')} đ` : '0 đ'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#eef2e9] border border-[#d5ded0] text-xs text-[#2d3a24] font-bold outline-none cursor-default select-none"
              />
              <span className="block text-[10px] text-[#7e8779] mt-1 leading-tight">
                Ước tính khi mua lẻ từng món
              </span>
            </div>
          </div>

          {/* Gợi ý mức tiết kiệm / cảnh báo định giá thông minh */}
          {totalMarketValue > 0 && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all ${
                discountPercent > 0
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : isOverPriced
                  ? 'bg-amber-50 border border-amber-200 text-amber-900'
                  : 'bg-gray-50 border border-gray-200 text-gray-700'
              }`}
            >
              <span className="text-base shrink-0">
                {discountPercent > 0 ? '🎉' : isOverPriced ? '⚠️' : '💡'}
              </span>
              <div className="flex-1 text-[11px] leading-snug">
                {discountPercent > 0 ? (
                  <span>
                    Tổng giá trị <strong>{totalMarketValue.toLocaleString('vi-VN')} đ</strong>. Khách mua túi mù sẽ <strong>tiết kiệm {discountPercent}%</strong> ({(totalMarketValue - numPrice).toLocaleString('vi-VN')} đ) so với mua lẻ!
                  </span>
                ) : isOverPriced ? (
                  <span>
                    Giá bán ({numPrice.toLocaleString('vi-VN')} đ) đang cao hơn tổng giá thị trường ({totalMarketValue.toLocaleString('vi-VN')} đ). Hãy cân nhắc giảm giá để giải cứu nhanh hơn!
                  </span>
                ) : (
                  <span>
                    Giá bán bằng đúng tổng giá thị trường của các nông sản được chọn ({totalMarketValue.toLocaleString('vi-VN')} đ).
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Số lượng phát hành & Ghi chú/Trọng lượng */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#353d2f] mb-1">
                Số lượng hộp phát hành *
              </label>
              <input
                type="number"
                required
                min={1}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="VD: 10"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f7f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs text-[#1e2319] outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-[#353d2f] mb-1">
                Ghi chú & Trọng lượng
              </label>
              <input
                type="text"
                maxLength={255}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Trọng lượng ~5kg, gồm rau củ quả tươi trong ngày"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f7f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs text-[#1e2319] outline-none"
              />
            </div>
          </div>

          {/* Chọn Nông sản thành phần trong kho */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-[#353d2f]">
                Nông sản đóng gói trong túi mù *
              </label>
              <span className="text-[11px] text-[#7e8779]">
                Đã chọn: <strong className="text-[#8a4e1d]">{selectedItems.length}</strong> loại
              </span>
            </div>

            {/* Ô tìm kiếm nhanh nông sản trong kho */}
            <div className="mb-2">
              <input
                type="text"
                placeholder="Tìm nhanh nông sản theo tên..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#f4f7f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs outline-none transition-colors"
              />
            </div>

            {isLoadingProducts ? (
              <div className="p-4 text-center text-gray-400 bg-[#f4f7f1] rounded-xl">
                Đang tải danh sách nông sản trong kho...
              </div>
            ) : availableProducts.length === 0 ? (
              <div className="p-3 text-center text-gray-500 bg-[#fdf5eb] border border-[#f5ddbd] rounded-xl text-[11px]">
                Kho chưa có nông sản nào đang bán để đóng gói. Vui lòng đăng bán nông sản trước!
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-[#e2e8dc] rounded-xl p-2 divide-y divide-[#f1f4ed] bg-[#fafcf9]">
                {availableProducts.map((p) => {
                  const pId = p.productId || p.id
                  const isSelected = selectedItems.some((item) => item.productId === pId)
                  const currentItem = selectedItems.find((item) => item.productId === pId)
                  const unitStr = p.unit || 'kg'
                  const availStock = p.stockQuantity ?? 0
                  const itemPrice = Number(p.sellingPrice ?? p.price ?? 0)
                  const totalNeeded = (currentItem?.quantity || 1) * (Number(stock) || 1)
                  const isOverStock = isSelected && availStock < totalNeeded

                  return (
                    <div
                      key={pId}
                      className="py-2 flex items-center justify-between gap-2 px-1 hover:bg-white rounded-lg transition-colors"
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            handleToggleProduct(pId, p.productName, unitStr, availStock, itemPrice)
                          }
                          className="w-4 h-4 rounded text-[#8a4e1d] accent-[#8a4e1d] cursor-pointer"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-[#1c2216] truncate">{p.productName}</p>
                          <p className="text-[10px] text-[#7e8779]">
                            Tồn kho: {availStock} {unitStr}
                            {itemPrice > 0 && (
                              <span className="text-[#8a4e1d] font-semibold ml-1.5">
                                • {itemPrice.toLocaleString('vi-VN')} đ/{unitStr}
                              </span>
                            )}
                            {isOverStock && (
                              <span className="text-red-600 font-bold ml-1.5">
                                (Thiếu: cần {totalNeeded} {unitStr})
                              </span>
                            )}
                          </p>
                        </div>
                      </label>

                      {isSelected && (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-[#5b6454]">SL/hộp:</span>
                          <input
                            type="number"
                            min={1}
                            value={currentItem?.quantity || 1}
                            onChange={(e) =>
                              handleQuantityChange(pId, Math.max(1, Number(e.target.value) || 1))
                            }
                            className="w-14 px-2 py-1 bg-white border border-[#cae4e7] rounded-lg text-center font-bold text-xs outline-none"
                          />
                          <span className="text-[10px] text-[#7e8779]">{unitStr}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Ảnh đại diện túi mù */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-[#353d2f]">Ảnh đại diện túi mù</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="text-[11px] font-bold text-[#8a4e1d] hover:text-[#6a3b14] flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                title="Chọn ảnh từ máy tính"
              >
                {isUploadingImage ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Upload size={12} />
                )}
                <span>{isUploadingImage ? 'Đang tải lên...' : 'Tải từ máy'}</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              {imageUrl && (
                <div className="relative shrink-0 w-9 h-9 rounded-xl overflow-hidden border border-[#f5ddbd] bg-[#fdf5eb]">
                  <img src={imageUrl} alt="Blind box preview" className="w-full h-full object-cover" />
                </div>
              )}
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Dán link ảnh hoặc bấm Tải từ máy..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#f4f7f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs text-[#1e2319] outline-none"
              />
            </div>
          </div>

          {/* Mô tả túi mù & Nút Trợ lý AI */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-[#353d2f]">Mô tả túi mù</label>

              {/* Nút Trợ lý AI tinh gọn, không icon/emoji rườm rà */}
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiSuggestMutation.isPending}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[#8a4e1d] bg-[#fdf5eb] hover:bg-[#faeedd] border border-[#f5ddbd] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                title="Sử dụng Trợ lý AI tạo mô tả túi mù"
              >
                {aiSuggestMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8a4e1d]" />
                    <span>AI đang viết...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#8a4e1d]" />
                    <span>Trợ lý AI gợi ý mô tả</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Trải nghiệm hộp quà bí ẩn gồm các loại nông sản tươi ngon theo mùa được thu hoạch trực tiếp tại vườn..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f7f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs text-[#1e2319] outline-none resize-none"
            />
            <p className="text-[10px] text-gray-400 text-right mt-0.5">
              {description.length}/500 ký tự
            </p>
            {isAiGenerated && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-800 text-[11px] flex items-start justify-between gap-2 shadow-sm animate-fadeIn">
                <div className="flex-1 leading-relaxed">
                  <span className="font-bold text-amber-900">Lưu ý xác minh:</span> Nội dung mô tả túi mù được gợi ý tự động bởi Trợ lý AI. Vui lòng rà soát và điều chỉnh lại thông tin cho phù hợp với nông sản thực tế trước khi xác nhận.
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiGenerated(false)}
                  className="text-amber-500 hover:text-amber-800 font-bold px-1 cursor-pointer transition-colors shrink-0"
                  title="Đóng thông báo"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Nút Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={createMysteryBoxMutation.isPending}
              className="w-full py-3 rounded-xl bg-[#8a4e1d] hover:bg-[#6c3911] disabled:opacity-60 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              {createMysteryBoxMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tạo túi mù...</span>
                </>
              ) : (
                <span>Đăng Bán Túi Mù</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

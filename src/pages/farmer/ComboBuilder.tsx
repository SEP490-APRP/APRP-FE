import React, { useState, useRef, useEffect, type FormEvent } from 'react'
import { X, Sparkles, Loader2, Upload } from 'lucide-react'
import { useAiSuggestDescription, useMyProducts, useCreateCombo, useUpdateCombo } from '@/features/product'
import type { FarmerProduct } from './types'
import { comboService, uploadService, type MealType, type ProductComboItemRequest } from '@/services'
import { getErrorMessage } from '@/utils'

interface ComboBuilderProps {
  initialCombo?: any
  onAddCombo?: (combo: FarmerProduct) => void
  onClose: () => void
  onInfo?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void
}

interface SelectedComboProduct {
  productId: number
  productName: string
  unit: string
  stockAvailable: number
  quantity: number
}

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'DINNER', label: 'Bữa cơm gia đình ấm cúng' },
  { value: 'LUNCH', label: 'Bữa trưa nhanh & tiện lợi' },
  { value: 'BREAKFAST', label: 'Bữa sáng dinh dưỡng' },
  { value: 'SNACK', label: 'Ăn nhẹ & tráng miệng' },
]

export default function ComboBuilder({ initialCombo: rawInitialCombo, onAddCombo, onClose, onInfo }: ComboBuilderProps) {
  // Loại trừ React SyntheticEvent nếu bị truyền nhầm qua onClick
  const isEvent =
    rawInitialCombo &&
    typeof rawInitialCombo === 'object' &&
    ('nativeEvent' in rawInitialCombo || 'bubbles' in rawInitialCombo || 'target' in rawInitialCombo)
  const initialCombo = isEvent ? null : rawInitialCombo
  const isEditMode = Boolean(
    initialCombo &&
      (initialCombo.id || initialCombo.comboId || initialCombo.productId || initialCombo.productName || initialCombo.comboName)
  )

  // Form states mapping BE BuildComboCreationRequest / BuildComboUpdateRequest
  const [comboName, setComboName] = useState(
    initialCombo?.productName || initialCombo?.comboName || initialCombo?.name || '',
  )
  const [comboPrice, setComboPrice] = useState(
    String(initialCombo?.sellingPrice || initialCombo?.price || '149000'),
  )
  const [totalQuantity, setTotalQuantity] = useState(
    String(initialCombo?.stockQuantity || initialCombo?.totalQuantity || initialCombo?.stock || '20'),
  )
  const [mealType, setMealType] = useState<MealType>(initialCombo?.mealType || 'DINNER')
  const [type, setType] = useState(initialCombo?.type || 'Món lẩu & xào')
  const [region, setRegion] = useState(initialCombo?.region || 'Đà Lạt & Lâm Đồng')
  const [description, setDescription] = useState(initialCombo?.description || '')
  const [imageUrl, setImageUrl] = useState(
    initialCombo?.imageUrl ||
      initialCombo?.image ||
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const updateComboMutation = useUpdateCombo()
  const [isAiGenerated, setIsAiGenerated] = useState(false)

  // Danh sách nông sản thành phần trong combo (khởi tạo từ combo đang sửa nếu có)
  const [selectedItems, setSelectedItems] = useState<SelectedComboProduct[]>(() => {
    if (initialCombo?.items && Array.isArray(initialCombo.items)) {
      return initialCombo.items.map((it: any) => ({
        productId: Number(it.productId),
        productName: it.productName || `Sản phẩm #${it.productId}`,
        unit: it.unit || 'kg',
        stockAvailable: 999,
        quantity: Number(it.productQuantity || it.quantity || 1),
      }))
    }
    return []
  })

  const [itemSearch, setItemSearch] = useState('')

  // Lấy danh sách nông sản đang bán trong kho của nhà vườn
  const { data: myProductsData, isLoading: isLoadingProducts } = useMyProducts({
    status: 'ACTIVE',
    keyword: itemSearch.trim() !== '' ? itemSearch.trim() : undefined,
    size: 100,
  })
  const availableProducts = myProductsData?.content || []

  // Đồng bộ hoặc lấy chi tiết nguyên liệu thành phần khi ở chế độ chỉnh sửa combo
  useEffect(() => {
    const comboId = Number(initialCombo?.id || initialCombo?.comboId || initialCombo?.productId)
    if (!comboId) return

    if (initialCombo?.items && Array.isArray(initialCombo.items) && initialCombo.items.length > 0) {
      setSelectedItems((prev) =>
        initialCombo.items.map((it: any) => {
          const matched = availableProducts.find((p) => (p.productId || p.id) === it.productId)
          const existingInState = prev.find((p) => p.productId === Number(it.productId))
          return {
            productId: Number(it.productId),
            productName: it.productName || matched?.productName || `Sản phẩm #${it.productId}`,
            unit: it.unit || matched?.unit || 'kg',
            stockAvailable: matched?.stockQuantity ?? 999,
            quantity: existingInState?.quantity ?? Number(it.productQuantity || it.quantity || 1),
          }
        }),
      )
      return
    }

    let isCancelled = false
    comboService
      .getComboById(comboId)
      .then((res: any) => {
        const items = res.result?.items || res.items
        if (isCancelled || !items) return
        setSelectedItems((prev) =>
          items.map((it: any) => {
            const matched = availableProducts.find((p) => (p.productId || p.id) === it.productId)
            const existingInState = prev.find((p) => p.productId === Number(it.productId))
            return {
              productId: Number(it.productId),
              productName: it.productName || matched?.productName || `Sản phẩm #${it.productId}`,
              unit: it.unit || matched?.unit || 'kg',
              stockAvailable: matched?.stockQuantity ?? 999,
              quantity: existingInState?.quantity ?? Number(it.productQuantity || 1),
            }
          }),
        )
      })
      .catch((err) => {
        console.warn('Could not fetch combo items detail:', err)
      })

    return () => {
      isCancelled = true
    }
  }, [initialCombo, availableProducts])


  // Hooks
  const aiSuggestMutation = useAiSuggestDescription()
  const createComboMutation = useCreateCombo()

  // Xử lý chọn / bỏ chọn nông sản thành phần
  const handleToggleProduct = (prodId: number, prodName: string, unit: string, stockQuantity: number) => {
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
          },
        ]
      }
    })
  }

  // Cập nhật số lượng của từng nông sản trong 1 combo
  const handleQuantityChange = (prodId: number, newQty: number) => {
    if (newQty < 1) return
    setSelectedItems((prev) =>
      prev.map((item) => (item.productId === prodId ? { ...item, quantity: newQty } : item)),
    )
  }

  // AI gợi ý mô tả combo
  const handleAiSuggest = async () => {
    if (!comboName.trim()) {
      onInfo?.('Vui lòng nhập tên combo trước khi yêu cầu AI gợi ý mô tả!')
      return
    }

    try {
      const res = await aiSuggestMutation.mutateAsync({
        productName: comboName.trim(),
        productType: 'COMBO',
        mealType: mealType,
        categoryName: 'Combo món ăn tiện lợi',
        origin: region,
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

  // Tải ảnh từ file máy tính lên Cloudinary
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
      const res = await uploadService.uploadImage(file, 'combos')
      if (res.result?.url) {
        setImageUrl(res.result.url)
        onInfo?.('Tải ảnh đại diện combo từ máy thành công!')
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

  // Submit tạo hoặc cập nhật Combo
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!comboName.trim()) {
      setFormError('Vui lòng nhập tên combo!')
      return
    }

    const numPrice = Number(comboPrice)
    const numTotalQty = Number(totalQuantity)

    if (isNaN(numPrice) || numPrice <= 0) {
      setFormError('Giá bán combo không hợp lệ!')
      return
    }

    if (isNaN(numTotalQty) || numTotalQty < 1) {
      setFormError('Số lượng combo phát hành phải từ 1 trở lên!')
      return
    }

    if (selectedItems.length === 0) {
      setFormError('Vui lòng chọn ít nhất 1 loại nông sản thành phần đóng gói vào combo!')
      return
    }

    // Kiểm tra tồn kho khả dụng (tính cả số lượng đang nằm sẵn trong combo cũ nếu đang chỉnh sửa)
    for (const item of selectedItems) {
      const needed = item.quantity * numTotalQty
      let allocatedInOldCombo = 0
      if (isEditMode && initialCombo) {
        const oldTotal = Number(
          initialCombo.stockQuantity || initialCombo.totalQuantity || initialCombo.stock || 0,
        )
        const oldSold = Number(initialCombo.soldQuantity || 0)
        const oldUnsold = Math.max(0, oldTotal - oldSold)
        const oldItem = initialCombo.items?.find((it: any) => Number(it.productId) === item.productId)
        if (oldItem) {
          allocatedInOldCombo = Number(oldItem.productQuantity || oldItem.quantity || 0) * oldUnsold
        }
      }
      const effectiveStock = item.stockAvailable + allocatedInOldCombo
      if (effectiveStock < needed) {
        setFormError(
          `Nông sản "${item.productName}" không đủ tồn kho (cần ${needed} ${item.unit}, hiện có ${effectiveStock} ${item.unit})!`,
        )
        return
      }
    }

    const itemsPayload: ProductComboItemRequest[] = selectedItems.map((item) => ({
      productId: item.productId,
      productQuantity: item.quantity,
    }))

    try {
      // 1. Gọi API thật của BE (Cập nhật nếu có initialCombo, ngược lại tạo mới)
      const comboId = Number(initialCombo?.id || initialCombo?.comboId || initialCombo?.productId)
      if (comboId) {
        await updateComboMutation.mutateAsync({
          id: comboId,
          data: {
            comboName: comboName.trim(),
            price: numPrice,
            totalQuantity: numTotalQty,
            mealType,
            type: type.trim() || undefined,
            region: region.trim() || undefined,
            description: description.trim() || undefined,
            imageUrl: imageUrl.trim() || undefined,
            items: itemsPayload,
          },
        })
        onInfo?.(`Đã cập nhật Combo: ${comboName.trim()}`)
      } else {
        await createComboMutation.mutateAsync({
          comboName: comboName.trim(),
          price: numPrice,
          totalQuantity: numTotalQty,
          mealType,
          type: type.trim() || undefined,
          region: region.trim() || undefined,
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          items: itemsPayload,
        })
        onInfo?.(`Đã gửi duyệt và tạo thành công Combo: ${comboName.trim()}`)
      }
      onClose()
    } catch (err: any) {
      let friendlyMsg = getErrorMessage(err) || 'Không thể lưu combo'
      if (
        friendlyMsg.toLowerCase().includes('not agricultural') ||
        friendlyMsg.toLowerCase().includes('inappropriate') ||
        friendlyMsg.toLowerCase().includes('không phải là nông sản')
      ) {
        friendlyMsg = 'Ảnh sản phẩm không phải là nông sản hoặc không phù hợp với quy định kiểm duyệt của sàn. Vui lòng chọn ảnh nông sản hợp lệ!'
      }
      console.error('Combo API error:', err)
      setFormError(friendlyMsg)
      onInfo?.(friendlyMsg, 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#e2dcce] relative overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#f1f4ed] flex items-center justify-between shrink-0 bg-[#fafcf9]">
          <div>
            <h3 className="text-base font-black text-[#1c2216]">
              {isEditMode ? 'Chỉnh Sửa Combo Nông Sản' : 'Tạo Combo Nông Sản'}
            </h3>
            <p className="text-[11px] text-[#7e8779]">
              {isEditMode
                ? 'Cập nhật thông tin, ảnh và nguyên liệu của combo'
                : 'Ghép nhiều loại rau củ thành set món ăn tiện lợi'}
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
          {/* Tên combo */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-[#353d2f]">Tên combo món ăn *</label>
              <span className="text-[10px] text-gray-400">{comboName.length}/255 ký tự</span>
            </div>
            <input
              type="text"
              required
              maxLength={255}
              value={comboName}
              onChange={(e) => setComboName(e.target.value)}
              placeholder="VD: Combo Lẩu Nấm & Rau Vườn Cuối Tuần"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f7f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none"
            />
          </div>

          {/* Giá bán combo & Số lượng phát hành */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#353d2f] mb-1">Giá bán combo (đ) *</label>
              <input
                type="number"
                required
                min={1000}
                value={comboPrice}
                onChange={(e) => setComboPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f7f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-[#353d2f] mb-1">
                Số lượng combo phát hành *
              </label>
              <input
                type="number"
                required
                min={1}
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f7f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none"
              />
            </div>
          </div>

          {/* Kiểu bữa ăn & Thể loại món */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#353d2f] mb-1">
                Kiểu bữa ăn (Meal Type) *
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#f4f7f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none cursor-pointer"
              >
                {MEAL_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#353d2f] mb-1">Thể loại combo</label>
              <input
                type="text"
                maxLength={50}
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="VD: Món lẩu, Nấu canh..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f7f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none"
              />
            </div>
          </div>

          {/* Vùng miền & Ảnh đại diện */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#353d2f] mb-1">Vùng miền xuất xứ</label>
              <input
                type="text"
                maxLength={100}
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Đà Lạt & Lâm Đồng"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f7f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-[#353d2f]">Ảnh đại diện combo</label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="text-[11px] font-bold text-[#326318] hover:text-[#254b12] flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                  title="Chọn file ảnh từ máy tính"
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
                  <div className="relative shrink-0 w-9 h-9 rounded-xl overflow-hidden border border-[#e4ebd9] bg-[#f4f7f1]">
                    <img src={imageUrl} alt="Combo preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Dán link ảnh hoặc bấm Tải từ máy..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#f4f7f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Chọn Nông sản thành phần trong kho */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-[#353d2f]">
                Nông sản đóng gói trong combo *
              </label>
              <span className="text-[11px] text-[#7e8779]">
                Đã chọn: <strong className="text-[#326318]">{selectedItems.length}</strong> loại
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
              <div className="p-3 text-center text-gray-500 bg-[#edf6f7] border border-[#cae4e7] rounded-xl text-[11px]">
                Kho chưa có nông sản nào đang bán để đóng combo. Vui lòng đăng bán nông sản trước!
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-[#e2e8dc] rounded-xl p-2 divide-y divide-[#f1f4ed] bg-[#fafcf9]">
                {availableProducts.map((p) => {
                  const pId = p.productId || p.id
                  const isSelected = selectedItems.some((item) => item.productId === pId)
                  const currentItem = selectedItems.find((item) => item.productId === pId)
                  const unitStr = p.unit || 'kg'
                  const availStock = p.stockQuantity ?? 0
                  const totalNeeded = (currentItem?.quantity || 1) * (Number(totalQuantity) || 1)
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
                            handleToggleProduct(pId, p.productName, unitStr, availStock)
                          }
                          className="w-4 h-4 rounded text-[#326318] accent-[#326318] cursor-pointer"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-[#1c2216] truncate">{p.productName}</p>
                          <p className="text-[10px] text-[#7e8779]">
                            Tồn kho: {availStock} {unitStr}
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
                          <span className="text-[10px] text-[#5b6454]">SL/combo:</span>
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

          {/* Mô tả combo & Nút Trợ lý AI */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-[#353d2f]">Mô tả chi tiết combo</label>

              {/* Nút Trợ lý AI phẳng, tinh gọn, không emoji gây nhiễu */}
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiSuggestMutation.isPending}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[#195962] bg-[#edf6f7] hover:bg-[#deeff0] border border-[#cae4e7] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                title="Sử dụng Trợ lý AI tạo mô tả combo"
              >
                {aiSuggestMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#195962]" />
                    <span>AI đang viết...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#195962]" />
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
              placeholder="Set nguyên liệu tươi ngon được tuyển chọn cẩn thận cho bữa ăn gia đình..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f7f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none resize-none"
            />
            <p className="text-[10px] text-gray-400 text-right mt-0.5">
              {description.length}/500 ký tự
            </p>
            {isAiGenerated && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-800 text-[11px] flex items-start justify-between gap-2 shadow-sm animate-fadeIn">
                <div className="flex-1 leading-relaxed">
                  <span className="font-bold text-amber-900">Lưu ý xác minh:</span> Nội dung mô tả combo được gợi ý tự động bởi Trợ lý AI. Vui lòng rà soát và điều chỉnh lại thông tin (nguyên liệu, cách chế biến, khẩu phần...) cho đúng thực tế trước khi xác nhận.
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
              disabled={createComboMutation.isPending || updateComboMutation.isPending || isUploadingImage}
              className="w-full py-3.5 rounded-2xl bg-[#326318] hover:bg-[#254b12] disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {createComboMutation.isPending || updateComboMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isEditMode ? 'Đang lưu combo...' : 'Đang tạo combo...'}</span>
                </>
              ) : (
                <span>{isEditMode ? 'Lưu Thay Đổi' : 'Đăng Bán Combo'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

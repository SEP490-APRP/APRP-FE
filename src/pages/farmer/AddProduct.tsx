import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Sparkles, Loader2, ImagePlus, Star, Trash2 } from 'lucide-react'
import {
  productFormSchema,
  type ProductFormInput,
  type ProductFormValues,
} from '@/features/product'
import { useCategories, filterFreshCategories } from '@/features/product/hooks/useCategoryQueries'
import { useCreateProduct, useUploadProductImage, useDeleteProduct, useAiSuggestDescription } from '@/features/product/hooks/useProductQueries'
import type { FarmerProduct } from './types'
import { getErrorMessage } from '@/utils'
import { globalShowAlert } from '@/components/common/Popup'
import { CustomSelect } from '@/components/common/CustomSelect'

const PRESET_REGIONS = [
  'Đà Lạt (Lâm Đồng)',
  'Gia Lai',
  'Bến Tre',
  'Đắk Lắk',
  'Mộc Châu (Sơn La)',
  'Tiền Giang',
  'Đồng Nai',
  'Bình Thuận',
  'Miền Tây',
]

const REGION_OPTIONS = [
  ...PRESET_REGIONS.map((r) => ({ value: r, label: r })),
  { value: 'KHAC', label: 'Vùng khác (Tự nhập...)' },
]

interface AddProductProps {
  onAddProduct?: (prod: FarmerProduct) => void
  onClose: () => void
  onInfo?: (msg: string) => void
}

const MAX_PRODUCT_IMAGES = 8
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

interface SelectedProductImage {
  id: string
  file: File
  previewUrl: string
}

const INPUT_CLASS =
  'w-full px-4 py-2.5 rounded-2xl bg-[#f4f7f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none transition-colors'
const SELECT_CLASS =
  'w-full px-3 py-2.5 rounded-2xl bg-[#f4f7f1] text-xs text-[#1e2319] outline-none border border-transparent focus:border-[#326318] focus:bg-white'

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-1 text-[11px] font-semibold text-[#c5221f]">
      {message}
    </p>
  ) : null
}

export default function AddProduct({ onAddProduct, onClose, onInfo }: AddProductProps) {
  const { data: rawCategories = [] } = useCategories()
  const categories = filterFreshCategories(rawCategories)
  const createMutation = useCreateProduct()
  const deleteMutation = useDeleteProduct()
  const uploadImageMutation = useUploadProductImage()
  const aiSuggestMutation = useAiSuggestDescription()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImages, setSelectedImages] = useState<SelectedProductImage[]>([])
  const [primaryIndex, setPrimaryIndex] = useState(0)
  const selectedImagesRef = useRef<SelectedProductImage[]>([])
  const [aiError, setAiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [isAiGenerated, setIsAiGenerated] = useState(false)

  useEffect(() => {
    selectedImagesRef.current = selectedImages
  }, [selectedImages])

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    }
  }, [])

  const defaultExpiry = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 10)
    return d.toISOString().split('T')[0]
  })()

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      categoryId: categories[0]?.categoryId || 1,
      unit: 'kg',
      price: 18000,
      stock: 50,
      expiryDate: defaultExpiry,
      description: '',
      discountPercent: 0,
      region: 'Đà Lạt (Lâm Đồng)',
      farmingType: 'Hữu cơ Organic',
    },
  })

  const currentRegion = watch('region') || 'Đà Lạt (Lâm Đồng)'
  const [isCustomRegion, setIsCustomRegion] = useState(() => !PRESET_REGIONS.includes(currentRegion))

  const handleAiSuggestDescription = async () => {
    const currentName = getValues('name')?.trim()
    if (!currentName) {
      setAiError('Vui lòng nhập Tên nông sản trước để AI có thể phân tích và viết mô tả gợi ý!')
      return
    }
    setAiError(null)
    const catId = getValues('categoryId')
    const catName = categories.find((c) => c.categoryId === catId)?.name || 'Nông sản'
    const reg = getValues('region') || 'Đà Lạt & Lâm Đồng'

    try {
      const res = await aiSuggestMutation.mutateAsync({
        productName: currentName,
        categoryId: catId,
        categoryName: catName,
        origin: reg,
      })
      if (res.result?.suggestedDescription) {
        setValue('description', res.result.suggestedDescription, { shouldDirty: true })
        setIsAiGenerated(true)
        onInfo?.('AI đã gợi ý mô tả! Vui lòng kiểm tra và xác minh lại thông tin trước khi đăng bán.')
      }
    } catch (err: any) {
      setAiError(getErrorMessage(err) || 'Không thể tạo mô tả AI lúc này. Vui lòng thử lại.')
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAiError(null)
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return

    const remainingSlots = MAX_PRODUCT_IMAGES - selectedImages.length
    if (remainingSlots <= 0) {
      setAiError(`Mỗi sản phẩm chỉ được tải lên tối đa ${MAX_PRODUCT_IMAGES} ảnh.`)
      return
    }

    const errorsList: string[] = []
    const accepted: SelectedProductImage[] = []

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        errorsList.push(`"${file.name}" không phải tệp hình ảnh hợp lệ`)
        continue
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        errorsList.push(`"${file.name}" vượt quá 10MB`)
        continue
      }
      if (accepted.length >= remainingSlots) {
        errorsList.push(`chỉ nhận tối đa ${MAX_PRODUCT_IMAGES} ảnh cho mỗi sản phẩm`)
        break
      }
      accepted.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })
    }

    if (accepted.length > 0) {
      setSelectedImages((prev) => [...prev, ...accepted])
    }
    if (errorsList.length > 0) {
      setAiError(`Một số ảnh chưa được thêm: ${errorsList.join('; ')}.`)
    }
  }

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => {
      const target = prev[index]
      if (target) {
        URL.revokeObjectURL(target.previewUrl)
      }
      const next = prev.filter((_, idx) => idx !== index)
      if (index === primaryIndex || primaryIndex >= next.length) {
        setPrimaryIndex(0)
      } else if (index < primaryIndex) {
        setPrimaryIndex((curr) => Math.max(0, curr - 1))
      }
      return next
    })
  }

  const mapUploadError = (imgErr: any) => {
    const code = imgErr?.response?.data?.code ?? imgErr?.data?.code
    const rawMsg = getErrorMessage(imgErr)
    const isNotAgri =
      code === 3022 ||
      rawMsg.includes('3022') ||
      rawMsg.toLowerCase().includes('nông sản') ||
      rawMsg.toLowerCase().includes('agricultural') ||
      rawMsg.toLowerCase().includes('inappropriate')

    if (isNotAgri) {
      return 'Google Cloud Vision không nhận diện được nông sản thực tế trong ảnh'
    }
    if (code === 3024 || rawMsg.toLowerCase().includes('tối đa 8') || rawMsg.toLowerCase().includes('maximum of 8')) {
      return 'Mỗi sản phẩm chỉ được tối đa 8 hình ảnh'
    }
    if (code === 4002 || rawMsg.toLowerCase().includes('size') || rawMsg.toLowerCase().includes('dung lượng')) {
      return 'Dung lượng ảnh vượt quá 10MB'
    }
    return rawMsg || 'Tải ảnh thất bại'
  }

  const onSubmit = async (values: ProductFormValues) => {
    if (selectedImages.length === 0) {
      setAiError('Vui lòng chọn ít nhất 1 hình ảnh nông sản trước khi đăng bán!')
      return
    }

    setSubmitting(true)
    setAiError(null)
    setUploadProgress(null)

    try {
      // 1. Tạo bản ghi sản phẩm ở Backend (Trạng thái ban đầu PENDING)
      const res = await createMutation.mutateAsync({
        productName: values.name,
        categoryId: values.categoryId,
        unit: 'kg',
        sellingPrice: values.price,
        stockQuantity: values.stock,
        expiryDate: values.expiryDate,
        description: values.description,
        discountPercent: values.discountPercent,
        origin: values.region,
      })

      const newProductId = res.result?.productId ?? res.result?.id

      // 2. Sắp xếp ảnh chính lên đầu để thẩm định AI trước, sau đó tải tuần tự các ảnh còn lại
      const orderedImages = [
        selectedImages[primaryIndex] || selectedImages[0],
        ...selectedImages.filter((_, idx) => idx !== primaryIndex),
      ].filter(Boolean)

      let uploadedCount = 0
      let primarySucceeded = false
      const failedImages: string[] = []

      if (newProductId) {
        for (let i = 0; i < orderedImages.length; i++) {
          const item = orderedImages[i]
          setUploadProgress(`Đang tải & thẩm định AI ảnh ${i + 1}/${orderedImages.length}...`)
          try {
            await uploadImageMutation.mutateAsync({
              productId: newProductId,
              file: item.file,
              isPrimary: i === 0,
              displayOrder: i,
            })
            uploadedCount += 1
            if (i === 0) primarySucceeded = true
          } catch (imgErr: any) {
            const reason = mapUploadError(imgErr)
            failedImages.push(`${item.file.name} (${reason})`)
            // Nếu ảnh đại diện chính bị từ chối ngay đầu tiên -> rollback ngay
            if (i === 0) {
              break
            }
          }
        }

        if (!primarySucceeded || uploadedCount === 0) {
          try {
            await deleteMutation.mutateAsync(newProductId)
          } catch (deleteErr) {
            console.error('Lỗi khi rollback sản phẩm chưa có ảnh hợp lệ:', deleteErr)
          }
          setAiError(`❌ Ảnh bị từ chối: ${failedImages[0] || 'Vui lòng chọn ảnh nông sản rõ nét hơn.'}`)
          return
        }
      }

      // 3. Fallback callback cho component cha
      if (onAddProduct && res.result) {
        onAddProduct({
          id: String(newProductId),
          name: values.name,
          category: (categories.find((c) => c.categoryId === values.categoryId)?.name ||
            'Nông sản') as any,
          price: values.price,
          originalPrice: values.price,
          discount: null,
          status: 'Chờ duyệt' as any,
          stock: values.stock,
          unit: 'kg',
          region: values.region || 'Đà Lạt',
          farmingType: values.farmingType || 'Hữu cơ',
          image:
            orderedImages[0]?.previewUrl ||
            'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80',
        })
      }

      if (failedImages.length > 0) {
        const warnMsg = `Đã tạo "${values.name}" với ${uploadedCount} ảnh hợp lệ. Một số ảnh bị bỏ qua: ${failedImages.join('; ')}`
        onInfo?.(warnMsg)
        void globalShowAlert(warnMsg, 'Tạo sản phẩm thành công (có ảnh bị từ chối)', 'warning')
      } else {
        onInfo?.(`Đã gửi yêu cầu đăng bán: ${values.name}. Sản phẩm đang chờ Admin duyệt!`)
        void globalShowAlert(
          `Đăng bán nông sản "${values.name}" thành công với ${uploadedCount} ảnh! Sản phẩm đã được gửi và đang chờ Admin duyệt.`,
          'Thành công',
          'success',
        )
      }
      onClose()
    } catch (err) {
      setAiError(getErrorMessage(err) || 'Không thể tạo sản phẩm. Vui lòng thử lại.')
    } finally {
      setUploadProgress(null)
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#e2dcce] relative max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl font-black text-[#1c2216]">Đăng Bán Nông Sản Mới</h3>
          <p className="text-xs text-[#757f70]">
            Điền thông tin và tải ảnh nông sản để niêm yết lên sàn CapNong
          </p>
        </div>

        {/* AI Error Alert */}
        {aiError && (
          <div className="mb-3 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
            {aiError}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 flex-1 overflow-y-auto pr-1">
          {/* Image Picker Dropzone */}
          <div>
            <label className="block text-xs font-bold text-[#353d2f] mb-1.5 flex items-center justify-between">
              <span>
                Hình ảnh nông sản ({selectedImages.length}/{MAX_PRODUCT_IMAGES}) *
              </span>
              <span className="text-[10px] text-[#326318] flex items-center gap-1 font-extrabold">
                <Sparkles size={11} /> AI Moderation
              </span>
            </label>

            <div
              onClick={() => {
                if (selectedImages.length < MAX_PRODUCT_IMAGES) {
                  fileInputRef.current?.click()
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-3 flex items-center gap-3 transition-colors ${
                selectedImages.length >= MAX_PRODUCT_IMAGES
                  ? 'border-amber-200 bg-amber-50/40 cursor-not-allowed'
                  : 'border-[#d8ded0] hover:border-[#326318] bg-[#fbfdfa] cursor-pointer'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageSelect}
              />
              <div className="w-12 h-12 rounded-xl bg-[#f4f7f1] text-[#326318] flex items-center justify-center shrink-0">
                <ImagePlus size={22} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold text-[#1c2216]">
                  {selectedImages.length >= MAX_PRODUCT_IMAGES
                    ? `Đã chọn đủ tối đa ${MAX_PRODUCT_IMAGES} ảnh`
                    : selectedImages.length > 0
                      ? `Đã chọn ${selectedImages.length} ảnh — nhấn để thêm ảnh`
                      : 'Nhấp để chọn một hoặc nhiều ảnh nông sản'}
                </p>
                <p className="text-[10px] text-[#7e8779] mt-0.5">
                  Hỗ trợ JPG, PNG, WEBP (tối đa 10MB/ảnh, chọn tối đa {MAX_PRODUCT_IMAGES} ảnh). Hệ thống tự động thẩm định AI.
                </p>
              </div>
            </div>

            {selectedImages.length > 0 && (
              <div className="mt-2.5 grid grid-cols-4 gap-2">
                {selectedImages.map((item, idx) => {
                  const isPrimary = idx === primaryIndex
                  return (
                    <div
                      key={item.id}
                      className={`group relative aspect-square rounded-xl overflow-hidden border-2 bg-[#f4f7f1] ${
                        isPrimary ? 'border-[#326318] ring-2 ring-[#326318]/20' : 'border-[#e2e8dc]'
                      }`}
                    >
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="w-full h-full object-cover"
                      />
                      {isPrimary && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-[#326318] text-white text-[9px] font-black flex items-center gap-0.5 shadow">
                          <Star size={8} className="fill-amber-300 text-amber-300" />
                          <span>Chính</span>
                        </span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-1 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPrimaryIndex(idx)
                            }}
                            title="Đặt làm ảnh chính"
                            className="p-1 rounded-lg bg-white text-[#326318] hover:bg-[#326318] hover:text-white cursor-pointer"
                          >
                            <Star size={11} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveImage(idx)
                          }}
                          title="Xóa ảnh"
                          className="p-1 rounded-lg bg-white text-rose-600 hover:bg-rose-600 hover:text-white cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="product-name" className="block text-xs font-bold text-[#353d2f] mb-1">
              Tên nông sản *
            </label>
            <input
              id="product-name"
              type="text"
              required
              {...register('name')}
              aria-invalid={!!errors.name}
              placeholder="VD: Cà chua bi hữu cơ Đà Lạt"
              className={INPUT_CLASS}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="product-category" className="block text-xs font-bold text-[#353d2f] mb-1">
                Danh mục *
              </label>
              <CustomSelect
                id="product-category"
                value={watch('categoryId') ?? (categories[0]?.categoryId || 1)}
                onChange={(val) => setValue('categoryId', Number(val), { shouldValidate: true })}
                options={categories.map((c) => ({
                  value: c.categoryId,
                  label: c.name,
                }))}
                placeholder="Chọn danh mục"
                error={!!errors.categoryId}
              />
              <FieldError message={errors.categoryId?.message} />
            </div>

            <div>
              <label htmlFor="product-unit" className="block text-xs font-bold text-[#353d2f] mb-1">
                Đơn vị tính *
              </label>
              <input
                id="product-unit"
                type="text"
                value="kg (Kilogram)"
                readOnly
                disabled
                className="w-full px-4 py-2.5 rounded-2xl bg-[#eef2e9] border border-[#dce4d5] text-xs font-bold text-[#326318] outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="product-price" className="block text-xs font-bold text-[#353d2f] mb-1">
                Giá bán (đồng / kg) *
              </label>
              <input
                id="product-price"
                type="number"
                required
                {...register('price', { valueAsNumber: true })}
                aria-invalid={!!errors.price}
                placeholder="18000"
                className={INPUT_CLASS}
              />
              <FieldError message={errors.price?.message} />
            </div>

            <div>
              <label htmlFor="product-stock" className="block text-xs font-bold text-[#353d2f] mb-1">
                Số lượng tồn kho (kg) *
              </label>
              <input
                id="product-stock"
                type="number"
                required
                {...register('stock', { valueAsNumber: true })}
                aria-invalid={!!errors.stock}
                placeholder="100"
                className={INPUT_CLASS}
              />
              <FieldError message={errors.stock?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="product-expiry" className="block text-xs font-bold text-[#353d2f] mb-1">
                Hạn sử dụng ước tính *
              </label>
              <input
                id="product-expiry"
                type="date"
                required
                {...register('expiryDate')}
                aria-invalid={!!errors.expiryDate}
                className={INPUT_CLASS}
              />
              <FieldError message={errors.expiryDate?.message} />
            </div>

            <div>
              <label htmlFor="product-discount" className="block text-xs font-bold text-[#353d2f] mb-1">
                Giảm giá (%)
              </label>
              <input
                id="product-discount"
                type="number"
                min={0}
                max={100}
                {...register('discountPercent', { valueAsNumber: true })}
                placeholder="0"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label htmlFor="product-region" className="block text-xs font-bold text-[#353d2f] mb-1">
              Vùng trồng / Xuất xứ *
            </label>
            <CustomSelect
              id="product-region"
              value={isCustomRegion ? 'KHAC' : currentRegion}
              onChange={(val) => {
                if (val === 'KHAC') {
                  setIsCustomRegion(true)
                  setValue('region', '', { shouldValidate: true })
                } else {
                  setIsCustomRegion(false)
                  setValue('region', String(val), { shouldValidate: true })
                }
              }}
              options={REGION_OPTIONS}
              placeholder="Chọn vùng trồng"
              error={!!errors.region}
            />
            {isCustomRegion && (
              <input
                type="text"
                value={watch('region') || ''}
                onChange={(e) => setValue('region', e.target.value, { shouldValidate: true })}
                placeholder="Nhập tên vùng trồng / tỉnh thành cụ thể (VD: Đức Trọng, Lâm Đồng)"
                className={`${INPUT_CLASS} mt-2`}
                autoFocus
              />
            )}
            <FieldError message={errors.region?.message} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="product-desc" className="text-xs font-bold text-[#353d2f]">
                Mô tả nguồn gốc &amp; chất lượng
              </label>
              <button
                type="button"
                onClick={handleAiSuggestDescription}
                disabled={aiSuggestMutation.isPending}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f4f7f1] hover:bg-[#e8eee3] text-[#326318] text-[11px] font-semibold transition-colors border border-[#e2e8dc] cursor-pointer disabled:opacity-50"
              >
                {aiSuggestMutation.isPending ? (
                  <Loader2 size={12} className="animate-spin text-[#326318]" />
                ) : (
                  <Sparkles size={12} className="text-amber-500" />
                )}
                <span>{aiSuggestMutation.isPending ? 'Đang viết mô tả...' : 'Trợ lý AI gợi ý mô tả'}</span>
              </button>
            </div>
            <textarea
              id="product-desc"
              rows={2}
              {...register('description')}
              placeholder="VD: Nông sản thu hoạch sáng nay tại vườn hữu cơ, vỏ hơi đốm nhẹ nhưng ruột giòn ngọt..."
              className={INPUT_CLASS}
            />
            {isAiGenerated && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-800 text-[11px] flex items-start justify-between gap-2 shadow-sm animate-fadeIn">
                <div className="flex-1 leading-relaxed">
                  <span className="font-bold text-amber-900">Lưu ý xác minh:</span> Nội dung mô tả được gợi ý tự động bởi Trợ lý AI. Vui lòng rà soát và điều chỉnh lại thông tin (vùng trồng, quy cách, chất lượng...) cho đúng thực tế nông sản của bạn trước khi xác nhận đăng bán.
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

          <button
            type="submit"
            disabled={submitting || createMutation.isPending}
            className="w-full py-3.5 rounded-2xl bg-[#326318] hover:bg-[#254b12] text-white font-black text-xs uppercase tracking-wider transition-all shadow-md mt-4 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {(submitting || createMutation.isPending) && (
              <Loader2 size={16} className="animate-spin" />
            )}
            <span>{uploadProgress || 'Đăng Bán Nông Sản'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}

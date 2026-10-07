import React, { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Upload, Sparkles, Loader2, ImagePlus } from 'lucide-react'
import {
  productFormSchema,
  type ProductFormInput,
  type ProductFormValues,
} from '@/features/product'
import { useCategories } from '@/features/product/hooks/useCategoryQueries'
import { useCreateProduct, useUploadProductImage } from '@/features/product/hooks/useProductQueries'
import type { FarmerProduct } from './types'
import { getErrorMessage } from '@/utils'

interface AddProductProps {
  onAddProduct?: (prod: FarmerProduct) => void
  onClose: () => void
  onInfo?: (msg: string) => void
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
  const { data: categories = [] } = useCategories()
  const createMutation = useCreateProduct()
  const uploadImageMutation = useUploadProductImage()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const defaultExpiry = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 10)
    return d.toISOString().split('T')[0]
  })()

  const {
    register,
    handleSubmit,
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
      region: 'Đà Lạt & Lâm Đồng',
      farmingType: 'Hữu cơ Organic',
    },
  })

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAiError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAiError('Vui lòng chọn tập tin hình ảnh')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAiError('Dung lượng ảnh tối đa 5MB')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const onSubmit = async (values: ProductFormValues) => {
    setSubmitting(true)
    setAiError(null)

    try {
      // 1. Tạo bản ghi sản phẩm ở Backend (Trạng thái ban đầu PENDING)
      const res = await createMutation.mutateAsync({
        productName: values.name,
        categoryId: values.categoryId,
        unit: values.unit,
        sellingPrice: values.price,
        stockQuantity: values.stock,
        expiryDate: values.expiryDate,
        description: values.description,
        discountPercent: values.discountPercent,
      })

      const newProductId = res.result?.productId ?? res.result?.id

      // 2. Nếu có ảnh đại diện được chọn, upload lên Cloudinary & kích hoạt AI Moderation
      if (selectedFile && newProductId) {
        try {
          await uploadImageMutation.mutateAsync({
            productId: newProductId,
            file: selectedFile,
            isPrimary: true,
            displayOrder: 0,
          })
        } catch (imgErr: any) {
          const msg = getErrorMessage(imgErr)
          if (msg.includes('3022') || msg.toLowerCase().includes('nông sản')) {
            alert(
              '⚠️ Lưu ý: Sản phẩm đã được tạo, nhưng ảnh bị AI từ chối vì không nhận diện được nông sản thực tế. Vui lòng vào mục Quản lý Ảnh để đổi ảnh khác.',
            )
          }
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
          status: 'Đang bán' as any,
          stock: values.stock,
          unit: values.unit,
          region: values.region || 'Đà Lạt',
          farmingType: values.farmingType || 'Hữu cơ',
          image:
            previewUrl ||
            'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80',
        })
      }

      onInfo?.(`Đã gửi yêu cầu đăng bán: ${values.name}. Sản phẩm đang chờ Admin duyệt!`)
      onClose()
    } catch (err) {
      setAiError(getErrorMessage(err) || 'Không thể tạo sản phẩm. Vui lòng thử lại.')
    } finally {
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
              <span>Hình ảnh đại diện nông sản *</span>
              <span className="text-[10px] text-[#326318] flex items-center gap-1 font-extrabold">
                <Sparkles size={11} /> AI Moderation
              </span>
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#d8ded0] hover:border-[#326318] bg-[#fbfdfa] rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageSelect}
              />
              {previewUrl ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#c3d1b8] shrink-0">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[#f4f7f1] text-[#7e8779] flex items-center justify-center shrink-0">
                  <ImagePlus size={24} />
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="text-xs font-bold text-[#1c2216]">
                  {selectedFile ? selectedFile.name : 'Nhấp để tải ảnh nông sản từ máy'}
                </p>
                <p className="text-[10px] text-[#7e8779] mt-0.5">
                  Ảnh chụp thực tế, rõ nét. Hệ thống tự động thẩm định AI AWS Rekognition.
                </p>
              </div>
            </div>
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
              <select
                id="product-category"
                {...register('categoryId', { valueAsNumber: true })}
                className={SELECT_CLASS}
              >
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors.categoryId?.message} />
            </div>

            <div>
              <label htmlFor="product-unit" className="block text-xs font-bold text-[#353d2f] mb-1">
                Đơn vị tính *
              </label>
              <select id="product-unit" {...register('unit')} className={SELECT_CLASS}>
                <option value="kg">kg (Kilogram)</option>
                <option value="hộp">hộp</option>
                <option value="bó">bó</option>
                <option value="túi">túi</option>
                <option value="trái">trái / quả</option>
                <option value="thùng">thùng</option>
              </select>
              <FieldError message={errors.unit?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="product-price" className="block text-xs font-bold text-[#353d2f] mb-1">
                Giá bán (đồng) *
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
                Số lượng tồn kho *
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
            <label htmlFor="product-desc" className="block text-xs font-bold text-[#353d2f] mb-1">
              Mô tả nguồn gốc &amp; chất lượng
            </label>
            <textarea
              id="product-desc"
              rows={2}
              {...register('description')}
              placeholder="VD: Nông sản thu hoạch sáng nay tại vườn hữu cơ, vỏ hơi đốm nhẹ nhưng ruột giòn ngọt..."
              className={INPUT_CLASS}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || createMutation.isPending}
            className="w-full py-3.5 rounded-2xl bg-[#326318] hover:bg-[#254b12] text-white font-black text-xs uppercase tracking-wider transition-all shadow-md mt-4 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {(submitting || createMutation.isPending) && (
              <Loader2 size={16} className="animate-spin" />
            )}
            <span>Xác Nhận Đăng Bán</span>
          </button>
        </form>
      </div>
    </div>
  )
}

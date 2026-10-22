import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Images, Loader2, Sparkles } from 'lucide-react'
import {
  productFormSchema,
  type ProductFormInput,
  type ProductFormValues,
} from '../schemas/productForm.schema'
import { useCategories } from '../hooks/useCategoryQueries'
import { useUpdateProduct, useAiSuggestDescription } from '../hooks/useProductQueries'
import type { ProductResponse } from '@/services'
import { getErrorMessage } from '@/utils'

interface EditProductModalProps {
  product: ProductResponse
  isOpen: boolean
  onClose: () => void
  onOpenGallery?: (productId: number, productName: string) => void
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

export function EditProductModal({
  product,
  isOpen,
  onClose,
  onOpenGallery,
  onInfo,
}: EditProductModalProps) {
  const { data: categories = [] } = useCategories()
  const updateMutation = useUpdateProduct()

  const defaultCategoryId =
    typeof product.category === 'object' && product.category !== null
      ? (product.category as any).categoryId
      : (product.categoryId ?? (categories[0]?.categoryId || 1))

  const defaultExpiry =
    product.expiryDate ||
    (() => {
      const d = new Date()
      d.setDate(d.getDate() + 7)
      return d.toISOString().split('T')[0]
    })()

  const aiSuggestMutation = useAiSuggestDescription()
  const [isAiGenerated, setIsAiGenerated] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product.productName || product.name || '',
      categoryId: defaultCategoryId,
      price: product.sellingPrice || product.price || 0,
      stock: product.stockQuantity || product.stock || 0,
      unit: product.unit || 'kg',
      expiryDate: defaultExpiry,
      description: product.description || '',
      discountPercent: product.discountPercent || 0,
      region: product.region || 'Đà Lạt & Lâm Đồng',
    },
  })

  if (!isOpen) return null

  const handleAiSuggestDescription = async () => {
    const name = getValues('name')?.trim()
    if (!name) {
      alert('Vui lòng nhập tên sản phẩm trước để AI có thể gợi ý mô tả!')
      return
    }

    const categoryId = Number(getValues('categoryId')) || undefined
    const categoryName = categories.find((c) => c.categoryId === categoryId)?.name || 'Nông sản'
    const region = getValues('region') || undefined

    try {
      const res = await aiSuggestMutation.mutateAsync({
        productName: name,
        categoryId,
        categoryName,
        origin: region,
      })

      if (res.result?.suggestedDescription) {
        setValue('description', res.result.suggestedDescription, {
          shouldDirty: true,
          shouldValidate: true,
        })
        setIsAiGenerated(true)
        onInfo?.('AI đã gợi ý mô tả! Vui lòng kiểm tra và xác minh lại thông tin trước khi lưu.')
      }
    } catch (err: any) {
      onInfo?.(getErrorMessage(err) || 'Không thể gợi ý mô tả lúc này')
    }
  }

  const onSubmit = async (values: ProductFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id: product.id,
        request: {
          productName: values.name,
          categoryId: values.categoryId,
          unit: values.unit,
          sellingPrice: values.price,
          stockQuantity: values.stock,
          description: values.description,
          expiryDate: values.expiryDate,
          discountPercent: values.discountPercent,
          status: product.status,
        },
      })
      onInfo?.(`Đã cập nhật sản phẩm: ${values.name}`)
      onClose()
    } catch (err) {
      alert(getErrorMessage(err) || 'Không thể cập nhật sản phẩm')
    }
  }

    if (typeof document === 'undefined') return null

    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#e2dcce] relative max-h-[90vh] flex flex-col my-auto">
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
          <div className="flex items-center justify-between pr-8">
            <h3 className="text-xl font-black text-[#1c2216]">Chỉnh Sửa Nông Sản</h3>
            {onOpenGallery && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenGallery(product.id, product.productName || product.name || '')
                }}
                className="px-3 py-1.5 rounded-xl bg-[#326318]/10 text-[#326318] hover:bg-[#326318] hover:text-white transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Images size={14} />
                <span>Gallery ảnh</span>
              </button>
            )}
          </div>
          <p className="text-xs text-[#757f70] mt-1">
            Mã sản phẩm: <span className="font-bold">#{product.id}</span> · Trạng thái:{' '}
            <span className="font-bold">{product.status}</span>
          </p>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 flex-1 overflow-y-auto pr-1">
          <div>
            <label htmlFor="edit-product-name" className="block text-xs font-bold text-[#353d2f] mb-1">
              Tên nông sản *
            </label>
            <input
              id="edit-product-name"
              type="text"
              required
              {...register('name')}
              aria-invalid={!!errors.name}
              placeholder="VD: Cà rốt hữu cơ Đà Lạt"
              className={INPUT_CLASS}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-category" className="block text-xs font-bold text-[#353d2f] mb-1">
                Danh mục *
              </label>
              <select
                id="edit-category"
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
              <label htmlFor="edit-unit" className="block text-xs font-bold text-[#353d2f] mb-1">
                Đơn vị tính *
              </label>
              <select id="edit-unit" {...register('unit')} className={SELECT_CLASS}>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-price" className="block text-xs font-bold text-[#353d2f] mb-1">
                Giá bán (đồng) *
              </label>
              <input
                id="edit-price"
                type="number"
                required
                {...register('price', { valueAsNumber: true })}
                aria-invalid={!!errors.price}
                className={INPUT_CLASS}
              />
              <FieldError message={errors.price?.message} />
            </div>

            <div>
              <label htmlFor="edit-stock" className="block text-xs font-bold text-[#353d2f] mb-1">
                Tồn kho *
              </label>
              <input
                id="edit-stock"
                type="number"
                required
                {...register('stock', { valueAsNumber: true })}
                aria-invalid={!!errors.stock}
                className={INPUT_CLASS}
              />
              <FieldError message={errors.stock?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-expiry" className="block text-xs font-bold text-[#353d2f] mb-1">
                Hạn sử dụng *
              </label>
              <input
                id="edit-expiry"
                type="date"
                required
                {...register('expiryDate')}
                aria-invalid={!!errors.expiryDate}
                className={INPUT_CLASS}
              />
              <FieldError message={errors.expiryDate?.message} />
            </div>

            <div>
              <label htmlFor="edit-discount" className="block text-xs font-bold text-[#353d2f] mb-1">
                Giảm giá (%)
              </label>
              <input
                id="edit-discount"
                type="number"
                min={0}
                max={100}
                {...register('discountPercent', { valueAsNumber: true })}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="edit-description" className="block text-xs font-bold text-[#353d2f]">
                Mô tả chi tiết
              </label>
              <button
                type="button"
                onClick={handleAiSuggestDescription}
                disabled={aiSuggestMutation.isPending}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[#326318] bg-[#f4f7f1] hover:bg-[#e8eee3] border border-[#e2e8dc] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                title="Sử dụng Trợ lý AI tạo mô tả chuẩn nông sản"
              >
                {aiSuggestMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#326318]" />
                    <span>AI đang viết...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#326318]" />
                    <span>Trợ lý AI gợi ý mô tả</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              id="edit-description"
              rows={3}
              {...register('description')}
              placeholder="Giới thiệu về chất lượng, nguồn gốc và cách bảo quản..."
              className={INPUT_CLASS}
            />
            {isAiGenerated && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-800 text-[11px] flex items-start justify-between gap-2 shadow-sm animate-fadeIn">
                <div className="flex-1 leading-relaxed">
                  <span className="font-bold text-amber-900">Lưu ý xác minh:</span> Nội dung mô tả được gợi ý tự động bởi Trợ lý AI. Vui lòng rà soát và điều chỉnh lại thông tin (vùng trồng, quy cách, chất lượng...) cho đúng thực tế nông sản của bạn trước khi lưu thay đổi.
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

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#d8ded0] text-[#5b6454] hover:bg-gray-100 font-bold text-xs cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || updateMutation.isPending}
              className="px-6 py-2.5 rounded-full bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {(isSubmitting || updateMutation.isPending) && (
                <Loader2 size={14} className="animate-spin" />
              )}
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

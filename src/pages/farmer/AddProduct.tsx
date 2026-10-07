import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import {
  productFormSchema,
  type ProductFormInput,
  type ProductFormValues,
} from '@/features/product'
import type { FarmerProduct } from './types'

interface AddProductProps {
  onAddProduct: (prod: FarmerProduct) => void
  onClose: () => void
  onInfo?: (msg: string) => void
}

const INPUT_CLASS =
  'w-full px-4 py-2.5 rounded-2xl bg-[#f4f7f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none'
const SELECT_CLASS =
  'w-full px-3 py-2.5 rounded-2xl bg-[#f4f7f1] text-xs text-[#1e2319] outline-none'

/** Id tạm cho sản phẩm mock (backend sẽ cấp id thật). Chỉ được gọi khi submit. */
const newProductId = () => Date.now().toString()

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-1 text-[11px] font-semibold text-[#c5221f]">
      {message}
    </p>
  ) : null
}

export default function AddProduct({ onAddProduct, onClose, onInfo }: AddProductProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      unit: 'kg',
      region: 'Đà Lạt & Lâm Đồng',
      farmingType: 'Hữu cơ Organic',
    },
  })

  const onSubmit = (values: ProductFormValues) => {
    const newProd: FarmerProduct = {
      id: newProductId(),
      name: values.name,
      category: 'Nông sản',
      price: values.price,
      originalPrice: values.price,
      discount: null,
      status: 'Đang bán',
      stock: values.stock,
      unit: values.unit,
      region: values.region,
      farmingType: values.farmingType,
      image:
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80',
    }

    onAddProduct(newProd)
    onClose()
    onInfo?.(`Đã đăng bán thành công: ${newProd.name}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#e2dcce] relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-black text-[#1c2216] mb-1">Đăng Bán Nông Sản Mới</h3>
        <p className="text-xs text-[#757f70] mb-4">
          Điền thông tin nông sản thu hoạch để niêm yết lên sàn CapNong
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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
              placeholder="VD: Cà rốt 2 nhánh Đà Lạt"
              className={INPUT_CLASS}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="product-price"
                className="block text-xs font-bold text-[#353d2f] mb-1"
              >
                Giá bán (đ/kg) *
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
              <label
                htmlFor="product-stock"
                className="block text-xs font-bold text-[#353d2f] mb-1"
              >
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
              <label
                htmlFor="product-region"
                className="block text-xs font-bold text-[#353d2f] mb-1"
              >
                Vùng xuất xứ
              </label>
              <select id="product-region" {...register('region')} className={SELECT_CLASS}>
                <option value="Đà Lạt & Lâm Đồng">Đà Lạt &amp; Lâm Đồng</option>
                <option value="Miền Tây Nam Bộ">Miền Tây Nam Bộ</option>
                <option value="Tây Nguyên">Tây Nguyên</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="product-farming"
                className="block text-xs font-bold text-[#353d2f] mb-1"
              >
                Phương thức canh tác
              </label>
              <select id="product-farming" {...register('farmingType')} className={SELECT_CLASS}>
                <option value="Hữu cơ Organic">Hữu cơ Organic</option>
                <option value="VietGAP">Chuẩn VietGAP</option>
                <option value="Vườn tự nhiên">Vườn tự nhiên</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#326318] hover:bg-[#254b12] text-white font-black text-xs uppercase tracking-wider transition-all shadow-md mt-4 cursor-pointer"
          >
            Xác Nhận Đăng Bán
          </button>
        </form>
      </div>
    </div>
  )
}

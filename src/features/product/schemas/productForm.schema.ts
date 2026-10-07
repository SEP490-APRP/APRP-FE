import { z } from 'zod'

const defaultExpiryDate = () => {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

/** Form đăng bán / cập nhật nông sản của nhà vườn. */
export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên nông sản').max(255, 'Tên không quá 255 ký tự'),
  categoryId: z
    .number({ error: 'Vui lòng chọn danh mục nông sản' })
    .int('Danh mục không hợp lệ')
    .positive('Vui lòng chọn danh mục hợp lệ')
    .optional()
    .default(1),
  price: z
    .number({ error: 'Vui lòng nhập giá bán' })
    .int('Giá bán phải là số nguyên (đồng)')
    .positive('Giá bán phải lớn hơn 0'),
  stock: z
    .number({ error: 'Vui lòng nhập số lượng tồn kho' })
    .int('Tồn kho phải là số nguyên')
    .positive('Tồn kho phải lớn hơn 0'),
  unit: z.string().trim().min(1, 'Vui lòng chọn hoặc nhập đơn vị tính').default('kg'),
  expiryDate: z
    .string()
    .min(1, 'Vui lòng chọn hạn sử dụng')
    .refine((val) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const exp = new Date(val)
      return exp >= today
    }, 'Hạn sử dụng không được nằm trong quá khứ')
    .optional()
    .default(defaultExpiryDate),
  description: z.string().optional().default(''),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  region: z.string().optional().default('Đà Lạt & Lâm Đồng'),
  farmingType: z.string().optional().default('Hữu cơ Organic'),
})

export type ProductFormInput = z.input<typeof productFormSchema>
export type ProductFormValues = z.output<typeof productFormSchema>

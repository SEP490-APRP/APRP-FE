import { z } from 'zod'

/** Form đăng bán nông sản của nhà vườn. Giá và tồn kho nhập bằng ô số (valueAsNumber). */
export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên nông sản'),
  price: z
    .number({ error: 'Vui lòng nhập giá bán' })
    .int('Giá bán phải là số nguyên (đồng)')
    .positive('Giá bán phải lớn hơn 0'),
  stock: z
    .number({ error: 'Vui lòng nhập số lượng tồn kho' })
    .int('Tồn kho phải là số nguyên')
    .positive('Tồn kho phải lớn hơn 0'),
  unit: z.string(),
  region: z.string(),
  farmingType: z.string(),
})

export type ProductFormInput = z.input<typeof productFormSchema>
export type ProductFormValues = z.output<typeof productFormSchema>

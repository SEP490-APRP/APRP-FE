import type { ApiResponse } from '@/types'
import type { UploadResponse } from './upload.types'
import { axiosInstance } from './api/axiosInstance'
import { ENV } from '@/utils'

export type * from './upload.types'

export const uploadService = {
  /**
   * Tải ảnh binary lên Cloudinary qua endpoint Backend `POST /upload/image`.
   * Backend trả về URL CDN công khai `result.url`.
   */
  async uploadImage(file: File, folder: string = 'products'): Promise<ApiResponse<UploadResponse>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300))
      // Mock trả về object URL local để test preview mượt mà
      const mockUrl = URL.createObjectURL(file)
      return { code: 1000, message: 'Upload mock thành công', result: { url: mockUrl } }
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const response = await axiosInstance.post<ApiResponse<UploadResponse>>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  },

  /**
   * Tải tệp đa phương tiện (ảnh hoặc video) lên Cloudinary qua Backend `POST /upload/media`.
   */
  async uploadMedia(file: File, folder: string = 'chat'): Promise<ApiResponse<UploadResponse>> {
    if (ENV.USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300))
      const mockUrl = URL.createObjectURL(file)
      return { code: 1000, message: 'Upload mock thành công', result: { url: mockUrl } }
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const endpoint = file.type.startsWith('video/') ? '/upload/video' : '/upload/image'
    const response = await axiosInstance.post<ApiResponse<UploadResponse>>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  },
}

import type { ApiResponse } from '@/types'
import type { UploadResponse } from './upload.types'
import { axiosInstance } from './api/axiosInstance'

export type * from './upload.types'

export const uploadService = {
  /**
   * Tải ảnh binary lên Cloudinary qua endpoint Backend `POST /upload/image`.
   * Backend trả về URL CDN công khai `result.url`.
   */
  async uploadImage(
    file: File,
    folder: string = 'products',
    options?: { moderate?: boolean; productName?: string; categoryId?: number },
  ): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    if (options?.moderate) {
      formData.append('moderate', 'true')
      if (options.productName) {
        formData.append('productName', options.productName)
      }
      if (options.categoryId !== undefined) {
        formData.append('categoryId', String(options.categoryId))
      }
    }

    const response = await axiosInstance.post<ApiResponse<UploadResponse>>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60_000,
    })

    return response.data
  },

  /**
   * Tải tệp đa phương tiện (ảnh hoặc video) lên Cloudinary qua Backend `POST /upload/media`.
   */
  async uploadMedia(file: File, folder: string = 'chat'): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name)
    const endpoint = isVideo ? '/upload/video' : '/upload/image'
    const response = await axiosInstance.post<ApiResponse<UploadResponse>>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 180_000, // Cho phép 3 phút để upload video dung lượng lớn lên Cloudinary
    })

    return response.data
  },
}

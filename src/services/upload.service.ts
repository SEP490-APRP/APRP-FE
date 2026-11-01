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
      timeout: 60_000,
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

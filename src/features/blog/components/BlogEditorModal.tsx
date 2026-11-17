import React, { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  X,
  ChevronDown,
  Check,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Save,
  Send,
} from 'lucide-react'
import {
  useCreateShopBlog,
  useUpdateShopBlog,
} from '../hooks/useBlogQueries'
import {
  MODAL_BLOG_CATEGORY_OPTIONS,
  SAMPLE_BLOG_COVERS,
} from '../constants'
import { BlogRichTextToolbar } from './BlogRichTextToolbar'
import { uploadService, type BlogResponse, type BlogStatus } from '@/services'
import { BlogCategory } from '@/types'
import { globalShowAlert } from '@/components/common/Popup'

interface BlogEditorModalProps {
  isOpen: boolean
  onClose: () => void
  editingBlog: BlogResponse | null
  onSuccess?: (msg: string) => void
}

export const BlogEditorModal: React.FC<BlogEditorModalProps> = ({
  isOpen,
  onClose,
  editingBlog,
  onSuccess,
}) => {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<BlogCategory>(BlogCategory.STORY)
  const [pictureUrl, setPictureUrl] = useState(SAMPLE_BLOG_COVERS[0].url)
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<BlogStatus>('PUBLISHED')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)

  const createBlogMutation = useCreateShopBlog()
  const updateBlogMutation = useUpdateShopBlog()

  useEffect(() => {
    if (editingBlog) {
      setTitle(editingBlog.title || '')
      setCategory(editingBlog.category || BlogCategory.STORY)
      setPictureUrl(editingBlog.pictureUrl || editingBlog.imageUrl || SAMPLE_BLOG_COVERS[0].url)
      setContent(editingBlog.content || '')
      setStatus(editingBlog.status || 'PUBLISHED')
    } else {
      setTitle('')
      setCategory(BlogCategory.STORY)
      setPictureUrl(SAMPLE_BLOG_COVERS[0].url)
      setContent('')
      setStatus('PUBLISHED')
    }
  }, [editingBlog, isOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCategoryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isOpen) return null

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      globalShowAlert('Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, WEBP).', 'Tệp không hợp lệ', 'warning')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      globalShowAlert('Kích thước ảnh tối đa là 5MB. Vui lòng nén hoặc chọn ảnh nhẹ hơn.', 'Ảnh quá lớn', 'warning')
      return
    }

    try {
      setIsUploadingImage(true)
      const res = await uploadService.uploadImage(file, 'blogs')
      const uploadedUrl = res.result?.url
      if (uploadedUrl) {
        setPictureUrl(uploadedUrl)
      } else {
        throw new Error('Không nhận được liên kết ảnh sau khi tải lên')
      }
    } catch (err: any) {
      console.error('Failed to upload blog cover image:', err)
      const msg = err?.response?.data?.message || err?.message || 'Không thể tải ảnh lên. Vui lòng thử lại.'
      globalShowAlert(msg, 'Tải ảnh thất bại', 'error')
    } finally {
      setIsUploadingImage(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent, targetStatus: BlogStatus = status) => {
    e.preventDefault()
    if (isUploadingImage) {
      globalShowAlert('Vui lòng chờ tải ảnh lên hoàn tất trước khi lưu bài viết.', 'Đang tải ảnh', 'warning')
      return
    }
    if (!title.trim() || !content.trim()) {
      globalShowAlert('Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.', 'Lỗi', 'error')
      return
    }

    if (editingBlog) {
      const blogId = editingBlog.blogId || editingBlog.id || 0
      updateBlogMutation.mutate(
        {
          blogId,
          data: {
            title: title.trim(),
            category,
            pictureUrl,
            content: content.trim(),
            status: targetStatus,
          },
        },
        {
          onSuccess: () => {
            onClose()
            const msg = targetStatus === 'DRAFT' ? 'Đã lưu bản nháp thành công' : 'Cập nhật bài viết thành công'
            onSuccess?.(msg)
            globalShowAlert(msg, 'Thông báo', 'success')
          },
          onError: () => {
            globalShowAlert('Có lỗi xảy ra khi cập nhật bài viết.', 'Lỗi', 'error')
          },
        },
      )
    } else {
      createBlogMutation.mutate(
        {
          title: title.trim(),
          category,
          pictureUrl,
          content: content.trim(),
          status: targetStatus,
        },
        {
          onSuccess: () => {
            onClose()
            const msg = targetStatus === 'DRAFT' ? 'Đã lưu bài viết vào bản nháp.' : 'Đã đăng bài viết mới thành công.'
            onSuccess?.(msg)
            globalShowAlert(msg, 'Thông báo', 'success')
          },
          onError: () => {
            globalShowAlert('Có lỗi xảy ra khi tạo bài viết.', 'Lỗi', 'error')
          },
        },
      )
    }
  }

  const isPending = createBlogMutation.isPending || updateBlogMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#ede8df] relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] flex items-center justify-center cursor-pointer"
        >
          <X size={18} />
        </button>

        <form onSubmit={(e) => handleSubmit(e, status)} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[#326318] text-xs font-bold uppercase tracking-wide">
            <Sparkles size={16} />
            <span>{editingBlog ? 'Cập Nhật Câu Chuyện' : 'Đăng Câu Chuyện Mới'}</span>
          </div>

          <h2 className="text-xl font-black text-[#1c2216]">
            {editingBlog ? 'Chỉnh Sửa Bài Viết' : 'Chia Sẻ Câu Chuyện Mùa Vụ'}
          </h2>

          {/* 1. Tiêu đề bài viết */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[#3a4234]">Tiêu đề bài viết *</label>
              <span className="text-[11px] text-[#788272]">{title.length}/255 ký tự</span>
            </div>
            <input
              type="text"
              required
              maxLength={255}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề hấp dẫn về vườn nông sản của bạn..."
              className="w-full px-4 py-3 rounded-2xl border border-[#d8d3c5] text-xs sm:text-sm focus:border-[#326318] outline-none"
            />
          </div>

          {/* 2. Danh mục & Trạng thái xuất bản */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative flex flex-col gap-1.5" ref={categoryDropdownRef}>
              <label className="text-xs font-extrabold text-[#3a4234]">Danh mục bài viết</label>
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl border border-[#d8d3c5] hover:border-[#326318] bg-white text-xs sm:text-sm font-semibold text-[#1c2216] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {(() => {
                    const current =
                      MODAL_BLOG_CATEGORY_OPTIONS.find((c) => c.value === category) ||
                      MODAL_BLOG_CATEGORY_OPTIONS[0]
                    const Icon = current.icon
                    return (
                      <>
                        <Icon size={16} className="text-[#326318] shrink-0" />
                        <span className="truncate">{current.label}</span>
                      </>
                    )
                  })()}
                </div>
                <ChevronDown
                  size={16}
                  className={`text-[#717a6c] transition-transform duration-200 shrink-0 ${
                    isCategoryDropdownOpen ? 'rotate-180 text-[#326318]' : ''
                  }`}
                />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-2xl border border-[#e5e9e0] shadow-2xl p-1.5 z-40 animate-fadeIn">
                  {MODAL_BLOG_CATEGORY_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const isSelected = category === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setCategory(opt.value as BlogCategory)
                          setIsCategoryDropdownOpen(false)
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#eaf3e5] text-[#2e5d16] font-bold'
                            : 'text-[#444d3d] hover:bg-[#f6f4ee] hover:text-[#1c2216]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            size={15}
                            className={isSelected ? 'text-[#2e5d16]' : 'text-[#717a6c]'}
                          />
                          <span className="truncate">{opt.label}</span>
                        </div>
                        {isSelected && <Check size={16} className="text-[#2e5d16] shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-[#3a4234]">Trạng thái bài viết</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#f4efe4] rounded-2xl border border-[#e2dcd0]">
                <button
                  type="button"
                  onClick={() => setStatus('PUBLISHED')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    status === 'PUBLISHED'
                      ? 'bg-white text-[#2e5d16] shadow-xs'
                      : 'text-[#646e5e] hover:text-[#1c2216]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">Công khai</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('DRAFT')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    status === 'DRAFT'
                      ? 'bg-white text-amber-800 shadow-xs'
                      : 'text-[#646e5e] hover:text-[#1c2216]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="truncate">Bản nháp</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Phần Ảnh bìa bài viết */}
          <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-[#faf7f0] border border-[#ebe4d6]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[#3a4234] flex items-center gap-1.5">
                <ImageIcon size={15} className="text-[#326318]" />
                Ảnh bìa bài viết
              </label>
              <span className="text-[11px] text-[#717a6c]">Khuyến nghị tỉ lệ 16:9 (tối đa 5MB)</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#326318] text-[#326318] hover:bg-[#326318] hover:text-white transition-all text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-[#326318]" />
                    <span>Đang tải ảnh lên...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    <span>Tải ảnh từ máy / điện thoại</span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
              />

              <input
                type="url"
                value={pictureUrl}
                onChange={(e) => setPictureUrl(e.target.value)}
                placeholder="Hoặc dán liên kết URL ảnh (https://...)"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#d8d3c5] bg-white text-xs focus:border-[#326318] outline-none"
              />
            </div>

            {/* Khung xem trước ảnh */}
            {pictureUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-[#dcd6c8] bg-stone-100 max-h-44 group">
                <img
                  src={pictureUrl}
                  alt="Ảnh bìa xem trước"
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = SAMPLE_BLOG_COVERS[0].url
                  }}
                />
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white text-stone-900 text-xs font-bold hover:bg-stone-100 flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <UploadCloud size={14} /> Thay ảnh khác
                  </button>
                  <button
                    type="button"
                    onClick={() => setPictureUrl('')}
                    className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Trash2 size={14} /> Gỡ ảnh
                  </button>
                </div>
                <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs flex items-center gap-1">
                  <Check size={12} className="text-emerald-400" /> Ảnh bìa đang chọn
                </span>
              </div>
            )}

            {/* Chọn ảnh mẫu */}
            <div className="flex flex-col gap-1.5 mt-0.5">
              <span className="text-[11px] font-bold text-[#6a7364]">Hoặc chọn nhanh ảnh bìa mẫu:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SAMPLE_BLOG_COVERS.map((sc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPictureUrl(sc.url)}
                    className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      pictureUrl === sc.url
                        ? 'border-[#326318] scale-[1.02] shadow-md ring-2 ring-[#326318]/25'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={sc.url} alt={sc.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded font-medium">
                      {sc.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Nội dung chi tiết bài viết + Toolbar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[#3a4234]">Nội dung chi tiết *</label>
              <span className="text-[11px] text-[#717a6c]">
                {content.trim() ? `${content.trim().split(/\s+/).length} từ` : '0 từ'}
              </span>
            </div>

            <BlogRichTextToolbar
              textareaRef={textareaRef}
              content={content}
              onChange={setContent}
            />

            <textarea
              ref={textareaRef}
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Kể về vụ mùa, sự tận tâm của người làm vườn, hay hướng dẫn bảo quản..."
              className="w-full p-4 rounded-b-2xl border border-[#d8d3c5] text-xs sm:text-sm focus:border-[#326318] outline-none leading-relaxed"
            />
            <p className="text-[11px] text-[#788272] italic">
              💡 Gợi ý: Dùng các icon ở thanh công cụ trên để làm nổi bật câu chuyện, chèn biểu tượng nông sản 🌱 hoặc định dạng các bước canh tác rõ ràng.
            </p>
          </div>

          {/* 5. Nút bấm thao tác */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#ede7dc]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <X size={15} />
              <span>Hủy bỏ</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="submit"
                disabled={isPending || isUploadingImage}
                className={`px-6 py-2.5 rounded-full text-white text-xs font-black uppercase tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
                  status === 'DRAFT'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#326318] hover:bg-[#254b12]'
                }`}
              >
                {isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-white" />
                    <span>Đang xử lý...</span>
                  </>
                ) : status === 'DRAFT' ? (
                  <>
                    <Save size={15} className="text-white" />
                    <span>{editingBlog ? 'Lưu thay đổi bản nháp' : 'Lưu vào bản nháp'}</span>
                  </>
                ) : (
                  <>
                    <Send size={15} className="text-white" />
                    <span>{editingBlog ? 'Xuất bản thay đổi' : 'Đăng bài viết công khai'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

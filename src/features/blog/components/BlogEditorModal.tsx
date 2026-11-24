import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  ChevronDown,
  ImagePlus,
  Loader2,
  Save,
  Send,
  Sparkles,
  Sprout,
  Trash2,
  X,
} from 'lucide-react'
import {
  useCreateShopBlog,
  useUpdateShopBlog,
} from '../hooks/useBlogQueries'
import {
  MODAL_BLOG_CATEGORY_OPTIONS,
  SAMPLE_BLOG_COVERS,
} from '../constants'
import { uploadService, type BlogResponse, type BlogStatus } from '@/services'
import { BlogCategory } from '@/types'
import { globalShowAlert } from '@/components/common/Popup'
import {
  htmlToPlainText,
  plainTextToHtml,
} from '@/components/common/RichTextEditor/RichTextContent'

const RichTextEditor = lazy(() => import('@/components/common/RichTextEditor/RichTextEditor'))

const MAX_COVER_SIZE_BYTES = 10 * 1024 * 1024

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
  const [pictureUrl, setPictureUrl] = useState<string>(SAMPLE_BLOG_COVERS[0].url)
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<BlogStatus>('PUBLISHED')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)

  const createBlogMutation = useCreateShopBlog()
  const updateBlogMutation = useUpdateShopBlog()
  const isPending = createBlogMutation.isPending || updateBlogMutation.isPending

  useEffect(() => {
    if (!isOpen) return
    if (editingBlog) {
      setTitle(editingBlog.title || '')
      setCategory(editingBlog.category || BlogCategory.STORY)
      setPictureUrl(editingBlog.pictureUrl || editingBlog.imageUrl || SAMPLE_BLOG_COVERS[0].url)
      setContent(plainTextToHtml(editingBlog.content || ''))
      setStatus(editingBlog.status || 'PUBLISHED')
    } else {
      setTitle('')
      setCategory(BlogCategory.STORY)
      setPictureUrl(SAMPLE_BLOG_COVERS[0].url)
      setContent('')
      setStatus('PUBLISHED')
    }
    setIsCategoryDropdownOpen(false)
  }, [editingBlog, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (isCategoryDropdownOpen) {
        setIsCategoryDropdownOpen(false)
        return
      }
      if (!isPending && !isUploadingImage) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isCategoryDropdownOpen, isPending, isUploadingImage, onClose])

  const wordCount = useMemo(() => {
    const plain = htmlToPlainText(content).trim()
    return plain ? plain.split(/\s+/).filter(Boolean).length : 0
  }, [content])

  if (!isOpen) return null

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      globalShowAlert('Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, WEBP).', 'Tệp không hợp lệ', 'warning')
      e.target.value = ''
      return
    }

    if (file.size > MAX_COVER_SIZE_BYTES) {
      globalShowAlert('Kích thước ảnh tối đa là 10MB. Vui lòng nén hoặc chọn ảnh nhẹ hơn.', 'Ảnh quá lớn', 'warning')
      e.target.value = ''
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
    const plainBody = htmlToPlainText(content).trim()
    if (!title.trim() || !plainBody) {
      globalShowAlert('Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.', 'Thiếu thông tin', 'warning')
      return
    }

    const payload = {
      title: title.trim(),
      category,
      pictureUrl: pictureUrl.trim() || undefined,
      content: content.trim(),
      status: targetStatus,
    }

    if (editingBlog) {
      const blogId = editingBlog.blogId || editingBlog.id || 0
      updateBlogMutation.mutate(
        { blogId, data: payload },
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
      return
    }

    createBlogMutation.mutate(payload, {
      onSuccess: () => {
        onClose()
        const msg = targetStatus === 'DRAFT' ? 'Đã lưu bài viết vào bản nháp.' : 'Đã đăng bài viết mới thành công.'
        onSuccess?.(msg)
        globalShowAlert(msg, 'Thông báo', 'success')
      },
      onError: () => {
        globalShowAlert('Có lỗi xảy ra khi tạo bài viết.', 'Lỗi', 'error')
      },
    })
  }

  const editorKey = `${editingBlog?.blogId ?? editingBlog?.id ?? 'new'}-${isOpen ? 'open' : 'closed'}`

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 backdrop-blur-xs sm:items-center sm:p-6 animate-fadeIn"
      onClick={() => {
        if (!isPending && !isUploadingImage) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-editor-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-[#ede8df] bg-white shadow-2xl sm:rounded-3xl"
      >
        {/* Header cố định theo phong cách form Chiến dịch */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-[#fafbf8] px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#4a7c2f]">
              <Sparkles size={13} />
              <span>{editingBlog ? 'Cập nhật câu chuyện' : 'Soạn bài viết mới'}</span>
            </div>
            <h2 id="blog-editor-modal-title" className="text-lg font-black text-gray-900 sm:text-xl">
              {editingBlog ? 'Chỉnh sửa câu chuyện nhà vườn' : 'Chia sẻ câu chuyện mùa vụ'}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            disabled={isPending || isUploadingImage}
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:opacity-40 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Thân form cuộn độc lập */}
        <form
          id="blog-editor-form"
          onSubmit={(e) => handleSubmit(e, status)}
          className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6"
        >
          {/* 1. Tiêu đề */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="blog-editor-title" className="text-sm font-bold text-gray-700">
                Tiêu đề bài viết <span className="text-red-500">*</span>
              </label>
              <span className="text-xs font-medium text-gray-400">{title.length}/255 ký tự</span>
            </div>
            <input
              id="blog-editor-title"
              type="text"
              required
              maxLength={255}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Hành trình chăm vườn cà chua hữu cơ qua mùa mưa Đà Lạt..."
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-normal text-gray-900 placeholder:text-gray-400 focus:border-[#326318] focus:outline-none focus:ring-2 focus:ring-[#326318]/15"
            />
          </div>

          {/* 2. Danh mục & Trạng thái */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="relative flex flex-col gap-1.5" ref={categoryDropdownRef}>
              <label className="text-sm font-bold text-gray-700">Chủ đề bài viết</label>
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:border-[#326318] cursor-pointer"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {(() => {
                    const current =
                      MODAL_BLOG_CATEGORY_OPTIONS.find((c) => c.value === category) ||
                      MODAL_BLOG_CATEGORY_OPTIONS[0]
                    const Icon = current.icon
                    return (
                      <>
                        <Icon size={16} className="shrink-0 text-[#326318]" />
                        <span className="truncate">{current.label}</span>
                      </>
                    )
                  })()}
                </div>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-gray-400 transition-transform duration-200 ${
                    isCategoryDropdownOpen ? 'rotate-180 text-[#326318]' : ''
                  }`}
                />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute left-0 top-full z-40 mt-1.5 w-full rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl animate-fadeIn">
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
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#eaf3e5] font-bold text-[#2e5d16]'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon size={15} className={isSelected ? 'text-[#2e5d16]' : 'text-gray-400'} />
                          <span className="truncate">{opt.label}</span>
                        </div>
                        {isSelected && <Check size={16} className="shrink-0 text-[#2e5d16]" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Chế độ hiển thị</label>
              <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setStatus('PUBLISHED')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                    status === 'PUBLISHED'
                      ? 'bg-white text-[#2e5d16] shadow-2xs ring-1 ring-[#326318]/20'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <span>Công khai</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('DRAFT')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                    status === 'DRAFT'
                      ? 'bg-white text-amber-800 shadow-2xs ring-1 ring-amber-400/30'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <span>Bản nháp</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Ảnh bìa bài viết (gọn theo style Chiến dịch + giữ ảnh mẫu nhanh) */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-gray-200 bg-[#fafbf8] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-gray-700">Ảnh bìa bài viết</span>
              <span className="text-xs text-gray-500">Hiện ở đầu bài và thẻ tin tức (tối đa 10MB)</span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-[#eef5e7]">
                {pictureUrl ? (
                  <img
                    src={pictureUrl}
                    alt="Ảnh bìa xem trước"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src = SAMPLE_BLOG_COVERS[0].url
                    }}
                  />
                ) : (
                  <Sprout size={24} className="absolute inset-0 m-auto text-[#326318]" />
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-[#326318]" />
                        <span>Đang tải ảnh...</span>
                      </>
                    ) : (
                      <>
                        <ImagePlus size={14} className="text-[#326318]" />
                        <span>{pictureUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}</span>
                      </>
                    )}
                  </button>
                  {pictureUrl && (
                    <button
                      type="button"
                      onClick={() => setPictureUrl('')}
                      disabled={isUploadingImage}
                      className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Bỏ ảnh</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                </div>

                <input
                  type="url"
                  value={pictureUrl}
                  onChange={(e) => setPictureUrl(e.target.value)}
                  placeholder="Hoặc dán URL ảnh bìa (https://...)"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#326318] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-gray-500">Hoặc chọn nhanh ảnh bìa mẫu:</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SAMPLE_BLOG_COVERS.map((sc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPictureUrl(sc.url)}
                    className={`relative aspect-[16/10] overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                      pictureUrl === sc.url
                        ? 'scale-[1.01] border-[#326318] ring-2 ring-[#326318]/20 shadow-xs'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={sc.url} alt={sc.title} className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white">
                      {sc.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Trình soạn thảo bài viết (CKEditor 5) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">
                Nội dung câu chuyện <span className="text-red-500">*</span>
              </span>
              <span className="text-xs font-medium text-gray-500">{wordCount} từ</span>
            </div>
            <Suspense
              fallback={
                <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 text-xs font-normal text-gray-500">
                  <Loader2 size={16} className="mr-2 animate-spin" /> Đang tải trình soạn thảo…
                </div>
              }
            >
              <RichTextEditor
                key={editorKey}
                value={content}
                onChange={setContent}
                uploadFolder="blogs"
                minHeight={260}
                placeholder="Kể câu chuyện mùa vụ, cách chăm bón, bảo quản hay chèn ảnh trực tiếp vào giữa bài viết…"
              />
            </Suspense>
            <span className="text-xs text-gray-500">
              Hỗ trợ tiêu đề, chữ đậm/nghiêng, danh sách, trích dẫn, bảng và dán hoặc tải ảnh trực tiếp vào nội dung bài viết.
            </span>
          </div>
        </form>

        {/* Footer cố định */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-3.5 sm:px-6">
          <button
            type="button"
            disabled={isPending || isUploadingImage}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
          >
            <X size={15} />
            <span>Hủy bỏ</span>
          </button>

          <button
            type="submit"
            form="blog-editor-form"
            disabled={isPending || isUploadingImage}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer ${
              status === 'DRAFT'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-[#326318] hover:bg-[#254d12]'
            }`}
          >
            {isPending ? (
              <>
                <Loader2 size={15} className="animate-spin text-white" />
                <span>Đang lưu...</span>
              </>
            ) : status === 'DRAFT' ? (
              <>
                <Save size={15} />
                <span>{editingBlog ? 'Lưu thay đổi bản nháp' : 'Lưu vào bản nháp'}</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>{editingBlog ? 'Cập nhật & Xuất bản' : 'Đăng bài viết công khai'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

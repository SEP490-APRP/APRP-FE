import React, { useState, useRef, useEffect, type FormEvent } from 'react'
import {
  X,
  Sparkles,
  ChevronDown,
  Check,
  ImageIcon,
  UploadCloud,
  Loader2,
  Trash2,
  Save,
  Send,
} from 'lucide-react'
import {
  useCreateShopBlog,
  BlogRichTextToolbar,
} from '@/features/blog'
import {
  BLOG_CATEGORY_OPTIONS,
  SAMPLE_BLOG_COVERS,
} from '@/features/blog/constants'
import { BlogCategory } from '@/types'
import { uploadService, type BlogStatus } from '@/services'
import { globalShowAlert } from '@/components/common/Popup'

interface BlogCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (msg: string) => void
}

export const BlogCreateModal: React.FC<BlogCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const createBlogMutation = useCreateShopBlog()

  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<BlogCategory>(BlogCategory.STORY)
  const [newPictureUrl, setNewPictureUrl] = useState(SAMPLE_BLOG_COVERS[0].url)
  const [newContent, setNewContent] = useState('')
  const [newStatus, setNewStatus] = useState<BlogStatus>('PUBLISHED')

  const [isUploadingModalImage, setIsUploadingModalImage] = useState(false)
  const modalFileInputRef = useRef<HTMLInputElement>(null)
  const modalTextareaRef = useRef<HTMLTextAreaElement>(null)

  const [isModalCategoryMenuOpen, setIsModalCategoryMenuOpen] = useState(false)
  const modalCategoryMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalCategoryMenuRef.current &&
        !modalCategoryMenuRef.current.contains(e.target as Node)
      ) {
        setIsModalCategoryMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleModalImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      globalShowAlert('Vui lòng chọn định dạng file ảnh hợp lệ (PNG, JPG, WEBP)!', 'Lỗi định dạng', 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      globalShowAlert('Kích thước ảnh tối đa cho phép là 5MB!', 'Ảnh quá lớn', 'warning')
      return
    }

    try {
      setIsUploadingModalImage(true)
      const res = await uploadService.uploadImage(file, 'blogs')
      const uploadedUrl = res.result?.url
      if (uploadedUrl) {
        setNewPictureUrl(uploadedUrl)
        globalShowAlert('Tải ảnh bìa lên thành công!', 'Thành công', 'success')
      } else {
        throw new Error('Không nhận được liên kết ảnh sau khi tải lên')
      }
    } catch {
      globalShowAlert('Không thể tải ảnh lên. Vui lòng thử lại!', 'Thất bại', 'error')
    } finally {
      setIsUploadingModalImage(false)
      if (modalFileInputRef.current) {
        modalFileInputRef.current.value = ''
      }
    }
  }

  const resetForm = () => {
    setNewTitle('')
    setNewCategory(BlogCategory.STORY)
    setNewPictureUrl(SAMPLE_BLOG_COVERS[0].url)
    setNewContent('')
    setNewStatus('PUBLISHED')
  }

  const handleSubmit = (e: FormEvent, submitStatus: BlogStatus) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      globalShowAlert('Vui lòng nhập tiêu đề bài viết!', 'Thiếu thông tin', 'warning')
      return
    }
    if (!newContent.trim()) {
      globalShowAlert('Vui lòng nhập nội dung câu chuyện!', 'Thiếu thông tin', 'warning')
      return
    }

    createBlogMutation.mutate(
      {
        title: newTitle.trim(),
        content: newContent.trim(),
        pictureUrl: newPictureUrl || SAMPLE_BLOG_COVERS[0].url,
        category: newCategory,
        status: submitStatus,
      },
      {
        onSuccess: () => {
          const msg =
            submitStatus === 'DRAFT'
              ? 'Lưu bài viết vào bản nháp thành công!'
              : 'Đăng tải câu chuyện nhà vườn thành công!'
          if (onSuccess) onSuccess(msg)
          else globalShowAlert(msg, 'Thành công', 'success')
          resetForm()
          onClose()
        },
      },
    )
  }

  if (!isOpen) return null

  const categoryOptions = BLOG_CATEGORY_OPTIONS.filter((t) => t.value !== 'all')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#ede8df] relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] flex items-center justify-center cursor-pointer"
        >
          <X size={18} />
        </button>

        <form onSubmit={(e) => handleSubmit(e, newStatus)} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[#2e5d16] text-xs font-bold uppercase tracking-wide">
            <Sparkles size={16} />
            <span>Kênh Nhà Vườn CapNong</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#191f14]">
            Chia Sẻ Câu Chuyện Mùa Vụ &amp; Kinh Nghiệm
          </h2>

          {/* 1. Tiêu đề */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[#3a4234]">Tiêu đề bài viết *</label>
              <span className="text-[11px] text-[#717a6c]">{newTitle.length}/255 ký tự</span>
            </div>
            <input
              type="text"
              required
              maxLength={255}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ví dụ: Vụ cam sành Hàm Yên được mùa ngọt mọng nước..."
              className="w-full px-4 py-3 rounded-2xl border border-[#d8d3c5] text-xs sm:text-sm focus:border-[#2e5d16] outline-none"
            />
          </div>

          {/* 2. Danh mục & Trạng thái */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative flex flex-col gap-1.5" ref={modalCategoryMenuRef}>
              <label className="text-xs font-extrabold text-[#3a4234]">Danh mục bài viết</label>
              <button
                type="button"
                onClick={() => setIsModalCategoryMenuOpen(!isModalCategoryMenuOpen)}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl border border-[#d8d3c5] hover:border-[#2e5d16] bg-white text-xs sm:text-sm font-semibold text-[#1c2216] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {(() => {
                    const cur =
                      categoryOptions.find((t) => t.value === newCategory) || categoryOptions[0]
                    const CurIcon = cur.icon
                    return (
                      <>
                        <CurIcon size={16} className="text-[#2e5d16] shrink-0" />
                        <span className="truncate">{cur.label}</span>
                      </>
                    )
                  })()}
                </div>
                <ChevronDown
                  size={16}
                  className={`text-[#717a6c] transition-transform duration-200 shrink-0 ${
                    isModalCategoryMenuOpen ? 'rotate-180 text-[#2e5d16]' : ''
                  }`}
                />
              </button>

              {isModalCategoryMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-2xl border border-[#e5e9e0] shadow-2xl p-1.5 z-40 animate-fadeIn">
                  {categoryOptions.map((tab) => {
                    const TabIcon = tab.icon
                    const isSelected = newCategory === tab.value
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => {
                          setNewCategory(tab.value as BlogCategory)
                          setIsModalCategoryMenuOpen(false)
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#eaf3e5] text-[#2e5d16] font-bold'
                            : 'text-[#444d3d] hover:bg-[#f6f4ee] hover:text-[#1c2216]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <TabIcon
                            size={15}
                            className={isSelected ? 'text-[#2e5d16]' : 'text-[#717a6c]'}
                          />
                          <span className="truncate">{tab.label}</span>
                        </div>
                        {isSelected && <Check size={16} className="text-[#2e5d16] shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-[#3a4234]">Trạng thái xuất bản</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#f4efe4] rounded-2xl border border-[#e2dcd0]">
                <button
                  type="button"
                  onClick={() => setNewStatus('PUBLISHED')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    newStatus === 'PUBLISHED'
                      ? 'bg-white text-[#2e5d16] shadow-xs'
                      : 'text-[#646e5e] hover:text-[#1c2216]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">Công khai</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewStatus('DRAFT')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    newStatus === 'DRAFT'
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

          {/* 3. Ảnh bìa bài viết */}
          <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-[#faf7f0] border border-[#ebe4d6]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[#3a4234] flex items-center gap-1.5">
                <ImageIcon size={15} className="text-[#2e5d16]" />
                Ảnh bìa bài viết
              </label>
              <span className="text-[11px] text-[#717a6c]">Tỉ lệ khuyến nghị 16:9 (tối đa 5MB)</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => modalFileInputRef.current?.click()}
                disabled={isUploadingModalImage}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#2e5d16] text-[#2e5d16] hover:bg-[#2e5d16] hover:text-white transition-all text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isUploadingModalImage ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-[#2e5d16]" />
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
                ref={modalFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleModalImageFileChange}
              />

              <input
                type="url"
                value={newPictureUrl}
                onChange={(e) => setNewPictureUrl(e.target.value)}
                placeholder="Hoặc dán liên kết URL ảnh (https://...)"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#d8d3c5] bg-white text-xs focus:border-[#2e5d16] outline-none"
              />
            </div>

            {newPictureUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-[#dcd6c8] bg-stone-100 max-h-44 group">
                <img
                  src={newPictureUrl}
                  alt="Ảnh bìa xem trước"
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = SAMPLE_BLOG_COVERS[0].url
                  }}
                />
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white text-stone-900 text-xs font-bold hover:bg-stone-100 flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <UploadCloud size={14} /> Thay ảnh khác
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPictureUrl('')}
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

            <div className="flex flex-col gap-1.5 mt-0.5">
              <span className="text-[11px] font-bold text-[#6a7364]">
                Hoặc chọn nhanh ảnh bìa mẫu:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SAMPLE_BLOG_COVERS.map((sc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewPictureUrl(sc.url)}
                    className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      newPictureUrl === sc.url
                        ? 'border-[#2e5d16] scale-[1.02] shadow-md ring-2 ring-[#2e5d16]/25'
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

          {/* 4. Nội dung chi tiết */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[#3a4234]">
                Nội dung chi tiết câu chuyện *
              </label>
              <span className="text-[11px] text-[#717a6c]">
                {newContent.trim() ? `${newContent.trim().split(/\s+/).length} từ` : '0 từ'}
              </span>
            </div>

            <BlogRichTextToolbar
              textareaRef={modalTextareaRef}
              content={newContent}
              onChange={setNewContent}
            />

            <textarea
              ref={modalTextareaRef}
              required
              rows={6}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Chia sẻ về quá trình gieo trồng, chăm sóc, thu hoạch hoặc những trăn trở, niềm vui của nhà vườn..."
              className="w-full p-4 rounded-b-2xl border border-[#d8d3c5] text-xs sm:text-sm focus:border-[#2e5d16] outline-none leading-relaxed"
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
                disabled={createBlogMutation.isPending || isUploadingModalImage}
                className={`px-6 py-2.5 rounded-full text-white text-xs font-black uppercase tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
                  newStatus === 'DRAFT'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#2e5d16] hover:bg-[#254d12]'
                }`}
              >
                {createBlogMutation.isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-white" />
                    <span>Đang xử lý...</span>
                  </>
                ) : newStatus === 'DRAFT' ? (
                  <>
                    <Save size={15} className="text-white" />
                    <span>Lưu vào bản nháp</span>
                  </>
                ) : (
                  <>
                    <Send size={15} className="text-white" />
                    <span>Đăng câu chuyện công khai</span>
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

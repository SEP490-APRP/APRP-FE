import React from 'react'
import {
  Eye,
  Heart,
  MessageCircle,
  ExternalLink,
  Edit3,
  Trash2,
  FileText,
  Plus,
} from 'lucide-react'
import { type BlogResponse } from '@/services'
import { BlogCategoryLabel } from '@/types'
import { formatPublishDate, SAMPLE_BLOG_COVERS } from '../constants'

interface BlogTableProps {
  blogs: BlogResponse[]
  isLoading?: boolean
  onEdit: (blog: BlogResponse) => void
  onDelete: (blog: BlogResponse) => void
  onOpenCreate: () => void
}

export const BlogTable: React.FC<BlogTableProps> = ({
  blogs,
  isLoading = false,
  onEdit,
  onDelete,
  onOpenCreate,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-[#e8ece3] shadow-xs p-12 flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#e5e2da] border-t-[#326318]" />
        <span className="text-xs font-semibold text-[#5f6b57]">Đang tải danh sách bài viết...</span>
      </div>
    )
  }

  if (blogs.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#e8ece3] shadow-xs p-12 text-center flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-[#f2f6ee] text-[#326318] flex items-center justify-center">
          <FileText size={32} />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-[#1c2216]">Chưa có bài viết nào</h3>
          <p className="text-xs text-[#6e7769] max-w-sm mt-1">
            Hãy bắt đầu viết những câu chuyện đầu tiên về khu vườn và quy trình canh tác của bạn.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreate}
          className="px-5 py-2.5 rounded-full bg-[#326318] hover:bg-[#254b12] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} />
          <span>Viết bài ngay</span>
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-[#e8ece3] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#e8ece3] bg-[#f9faf7] text-[11px] font-black uppercase text-[#646e5e] tracking-wider">
              <th className="py-3.5 px-4">Bài viết</th>
              <th className="py-3.5 px-4">Danh mục</th>
              <th className="py-3.5 px-4 text-center">Tương tác</th>
              <th className="py-3.5 px-4">Ngày đăng</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f3eb]">
            {blogs.map((b) => {
              const bId = b.blogId || b.id || 0
              const thumb = b.pictureUrl || b.imageUrl || SAMPLE_BLOG_COVERS[0].url

              return (
                <tr key={bId} className="hover:bg-[#fafcf8] transition-colors">
                  <td className="py-3 px-4 max-w-sm">
                    <div className="flex items-center gap-3">
                      <img
                        src={thumb}
                        alt={b.title}
                        className="w-14 h-11 object-cover rounded-xl border border-[#e5eadd] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-extrabold text-[#1c2216] truncate text-xs hover:text-[#326318]">
                          {b.title}
                        </div>
                        <p className="text-[11px] text-[#717a6c] truncate max-w-xs mt-0.5">
                          {b.content.replace(/<[^>]*>?/gm, '')}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#f2eee3] text-[#555d4e] font-bold text-[10px]">
                        {BlogCategoryLabel[b.category] || b.category}
                      </span>
                      {b.status === 'DRAFT' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Bản nháp
                        </span>
                      ) : b.status === 'HIDDEN' ? (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 text-[9px] font-bold inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          Đã ẩn
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Công khai
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-3 text-[#626c5c] font-semibold text-[11px]">
                      <span className="flex items-center gap-1" title="Lượt đọc">
                        <Eye size={13} />
                        {b.views || b.viewCount || 0}
                      </span>
                      <span className="flex items-center gap-1 text-[#c82626]" title="Lượt thích">
                        <Heart size={13} className="fill-[#c82626]" />
                        {b.likeCount || 0}
                      </span>
                      <span className="flex items-center gap-1" title="Bình luận">
                        <MessageCircle size={13} />
                        {b.commentCount || 0}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-[#717a6c] font-medium text-[11px]">
                    {formatPublishDate(b.createAt || b.createdAt)}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <a
                        href={`/cau-chuyen-nong-dan?blogId=${bId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-[#f0f4ed] text-[#326318] transition-colors"
                        title="Xem trên sàn"
                      >
                        <ExternalLink size={15} />
                      </a>
                      <button
                        type="button"
                        onClick={() => onEdit(b)}
                        className="p-1.5 rounded-lg hover:bg-[#f0f4ed] text-[#326318] transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(b)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                        title="Xóa bài viết"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

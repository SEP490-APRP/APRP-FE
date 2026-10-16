import React, { useState, useRef, useEffect } from 'react'
import {
  MoreVertical,
  Edit3,
  Eye,
  EyeOff,
  Trash2,
  Share2,
  Flag,
  Shield,
  Store,
} from 'lucide-react'
import type { BlogResponse } from '@/services'
import type { SessionUser } from '@/types'

export interface BlogOptionsMenuProps {
  blog: BlogResponse
  currentUser: SessionUser | null
  onEdit?: (blog: BlogResponse) => void
  onDelete?: (blog: BlogResponse) => void
  onToggleStatus?: (blog: BlogResponse) => void
  onShare?: (blog: BlogResponse) => void
  onReport?: (blog: BlogResponse) => void
  className?: string
  buttonClassName?: string
  align?: 'left' | 'right'
}

export const BlogOptionsMenu: React.FC<BlogOptionsMenuProps> = ({
  blog,
  currentUser,
  onEdit,
  onDelete,
  onToggleStatus,
  onShare,
  onReport,
  className = '',
  buttonClassName = '',
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const role = (currentUser?.role || '').toLowerCase()
  const isAdmin = role === 'admin'
  const isOwnerShop =
    role === 'shop' &&
    (String(currentUser?.id) === String(blog.shopId) ||
      Boolean(
        currentUser?.shopName &&
          blog.shopName &&
          currentUser.shopName.toLowerCase() === blog.shopName.toLowerCase(),
      ))

  const isPublished = blog.status === 'PUBLISHED'

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      {/* Trigger Button 3 Chấm */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((prev) => !prev)
        }}
        className={
          buttonClassName ||
          'p-1.5 rounded-full hover:bg-black/5 text-[#848c7e] hover:text-[#191f14] transition-colors cursor-pointer'
        }
        title="Tùy chọn tương tác"
        aria-label="Tùy chọn bài viết"
      >
        <MoreVertical size={16} />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } top-full mt-1.5 w-56 sm:w-64 bg-white rounded-2xl border border-[#e2dcd0] shadow-2xl p-1.5 z-40 animate-fadeIn`}
        >
          {/* Header Role Badge */}
          <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#858f7e] border-b border-[#f0ebd9] mb-1 flex items-center justify-between">
            <span>Tùy chọn bài viết</span>
            {isAdmin && (
              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold lowercase">
                <Shield size={10} /> admin
              </span>
            )}
            {!isAdmin && isOwnerShop && (
              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold lowercase">
                <Store size={10} /> chủ shop
              </span>
            )}
          </div>

          <div className="flex flex-col gap-0.5">
            {/* 1. ADMIN ACTIONS */}
            {isAdmin && (
              <>
                {onToggleStatus && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      onToggleStatus(blog)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#374130] hover:bg-[#f6f4ee] transition-colors cursor-pointer text-left"
                  >
                    {isPublished ? (
                      <>
                        <EyeOff size={14} className="text-[#8b5521] shrink-0" />
                        <span>Ẩn bài viết (Chuyển HIDDEN)</span>
                      </>
                    ) : (
                      <>
                        <Eye size={14} className="text-[#2e5d16] shrink-0" />
                        <span>Công khai bài viết (PUBLISH)</span>
                      </>
                    )}
                  </button>
                )}

                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      onEdit(blog)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#374130] hover:bg-[#f6f4ee] transition-colors cursor-pointer text-left"
                  >
                    <Edit3 size={14} className="text-[#2e5d16] shrink-0" />
                    <span>Chỉnh sửa nội dung</span>
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      onDelete(blog)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                  >
                    <Trash2 size={14} className="shrink-0" />
                    <span>Xóa bài viết (Quyền Admin)</span>
                  </button>
                )}
              </>
            )}

            {/* 2. OWNER SHOP ACTIONS (Không phải Admin) */}
            {!isAdmin && isOwnerShop && (
              <>
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      onEdit(blog)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#374130] hover:bg-[#f6f4ee] transition-colors cursor-pointer text-left"
                  >
                    <Edit3 size={14} className="text-[#2e5d16] shrink-0" />
                    <span>Chỉnh sửa bài viết</span>
                  </button>
                )}

                {onToggleStatus && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      onToggleStatus(blog)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#374130] hover:bg-[#f6f4ee] transition-colors cursor-pointer text-left"
                  >
                    {isPublished ? (
                      <>
                        <EyeOff size={14} className="text-[#8b5521] shrink-0" />
                        <span>Tạm ẩn bài viết này</span>
                      </>
                    ) : (
                      <>
                        <Eye size={14} className="text-[#2e5d16] shrink-0" />
                        <span>Công khai bài viết</span>
                      </>
                    )}
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      onDelete(blog)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                  >
                    <Trash2 size={14} className="shrink-0" />
                    <span>Xóa bài viết của tôi</span>
                  </button>
                )}
              </>
            )}

            {/* 3. COMMON ACTIONS CHO MỌI NGƯỜI */}
            {onShare && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onShare(blog)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#374130] hover:bg-[#f6f4ee] transition-colors cursor-pointer text-left"
              >
                <Share2 size={14} className="text-[#555d4e] shrink-0" />
                <span>Sao chép liên kết</span>
              </button>
            )}

            {/* Báo cáo bài viết cho khách / user khác */}
            {!isAdmin && !isOwnerShop && onReport && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onReport(blog)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#8b5521] hover:bg-amber-50 transition-colors cursor-pointer text-left"
              >
                <Flag size={14} className="shrink-0" />
                <span>Báo cáo bài viết vi phạm</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BlogOptionsMenu

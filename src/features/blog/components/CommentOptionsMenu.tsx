import React, { useState, useRef, useEffect } from 'react'
import {
  MoreVertical,
  Trash2,
  Copy,
  Flag,
  Shield,
  User,
  Store,
} from 'lucide-react'
import type { BlogCommentResponse, BlogResponse } from '@/services'
import type { SessionUser } from '@/types'

export interface CommentOptionsMenuProps {
  comment: BlogCommentResponse
  blog?: BlogResponse | null
  currentUser: SessionUser | null
  onDelete?: (commentId: number) => void
  onCopy?: (content: string) => void
  onReport?: (commentId: number) => void
  className?: string
  align?: 'left' | 'right'
}

export const CommentOptionsMenu: React.FC<CommentOptionsMenuProps> = ({
  comment,
  blog,
  currentUser,
  onDelete,
  onCopy,
  onReport,
  className = '',
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
  const isAuthor = Boolean(
    currentUser && String(currentUser.id) === String(comment.userId),
  )
  const isBlogOwner = Boolean(
    currentUser &&
    blog &&
    (String(currentUser.id) === String(blog.shopId) ||
      Boolean(
        currentUser.shopName &&
        blog.shopName &&
        currentUser.shopName.toLowerCase() === blog.shopName.toLowerCase(),
      )),
  )

  const canDelete = isAdmin || isAuthor || isBlogOwner

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      {/* Trigger Button 3 Chấm */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((prev) => !prev)
        }}
        className="p-1 rounded-full text-[#8e9889] hover:text-[#191f14] hover:bg-black/5 transition-colors cursor-pointer"
        title="Tùy chọn bình luận"
        aria-label="Tùy chọn bình luận"
      >
        <MoreVertical size={13} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'
            } top-full mt-1 w-52 sm:w-56 bg-white rounded-2xl border border-[#e2dcd0] shadow-2xl p-1.5 z-40 animate-fadeIn`}
        >
          {/* Header */}
          <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#858f7e] border-b border-[#f0ebd9] mb-1 flex items-center justify-between">
            <span>Bình luận</span>
            {isAdmin && (
              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold lowercase">
                <Shield size={9} /> admin
              </span>
            )}
            {!isAdmin && isAuthor && (
              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold lowercase">
                <User size={9} /> của tôi
              </span>
            )}
            {!isAdmin && !isAuthor && isBlogOwner && (
              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold lowercase">
                <Store size={9} /> chủ bài
              </span>
            )}
          </div>

          <div className="flex flex-col gap-0.5">
            {/* 1. XÓA BÌNH LUẬN NẾU CÓ QUYỀN */}
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onDelete(comment.commentId)
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
              >
                <Trash2 size={13} className="shrink-0" />
                <span>
                  {isAdmin
                    ? 'Xóa bình luận (Admin)'
                    : isAuthor
                      ? 'Xóa bình luận của bạn'
                      : 'Xóa bình luận này'}
                </span>
              </button>
            )}

            {/* 2. SAO CHÉP NỘI DUNG */}
            {onCopy && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onCopy(comment.content)
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#374130] hover:bg-[#f6f4ee] transition-colors cursor-pointer text-left"
              >
                <Copy size={13} className="text-[#646e5f] shrink-0" />
                <span>Sao chép nội dung</span>
              </button>
            )}

            {/* 3. BÁO CÁO VI PHẠM (CHO USER KHÔNG PHẢI TÁC GIẢ BÌNH LUẬN) */}
            {!isAuthor && onReport && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onReport(comment.commentId)
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#8b5521] hover:bg-amber-50 transition-colors cursor-pointer text-left"
              >
                <Flag size={13} className="shrink-0" />
                <span>Báo cáo bình luận</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CommentOptionsMenu

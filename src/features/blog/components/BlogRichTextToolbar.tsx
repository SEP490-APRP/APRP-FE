import React, { useState, useRef, useEffect } from 'react'
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Smile,
} from 'lucide-react'
import { POPULAR_FARMER_EMOJIS } from '../constants'

interface BlogRichTextToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  content: string
  onChange: (newContent: string) => void
  accentColor?: string
}

export const BlogRichTextToolbar: React.FC<BlogRichTextToolbarProps> = ({
  textareaRef,
  content,
  onChange,
  accentColor = '#326318',
}) => {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setIsEmojiPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleApplyFormat = (prefix: string, suffix = '') => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const text = el.value
    const selected = text.substring(start, end)
    const replacement = prefix + (selected || 'nội dung') + suffix
    const updated = text.substring(0, start) + replacement + text.substring(end)
    onChange(updated)
    setTimeout(() => {
      el.focus()
      const newCursorStart = start + prefix.length
      const newCursorEnd = newCursorStart + (selected ? selected.length : 'nội dung'.length)
      el.setSelectionRange(newCursorStart, newCursorEnd)
    }, 0)
  }

  const handleInsertEmoji = (emoji: string) => {
    const el = textareaRef.current
    if (!el) {
      onChange(content + emoji)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const text = el.value
    const updated = text.substring(0, start) + emoji + text.substring(end)
    onChange(updated)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 rounded-t-2xl bg-[#f7f5ed] border border-b-0 border-[#d8d3c5]">
      <div className="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => handleApplyFormat('**', '**')}
          className="p-1.5 rounded-lg hover:bg-white text-[#424a3a] hover:text-[#326318] transition-colors cursor-pointer"
          title="In đậm (Bold)"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => handleApplyFormat('*', '*')}
          className="p-1.5 rounded-lg hover:bg-white text-[#424a3a] hover:text-[#326318] transition-colors cursor-pointer"
          title="In nghiêng (Italic)"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onClick={() => handleApplyFormat('\n\n## ', '\n')}
          className="p-1.5 rounded-lg hover:bg-white text-[#424a3a] hover:text-[#326318] transition-colors cursor-pointer"
          title="Tiêu đề mục (Heading)"
        >
          <Heading2 size={15} />
        </button>
        <button
          type="button"
          onClick={() => handleApplyFormat('\n> ', '\n')}
          className="p-1.5 rounded-lg hover:bg-white text-[#424a3a] hover:text-[#326318] transition-colors cursor-pointer"
          title="Trích dẫn (Quote)"
        >
          <Quote size={15} />
        </button>
        <div className="w-[1px] h-4 bg-[#d0cac0] mx-1" />
        <button
          type="button"
          onClick={() => handleApplyFormat('\n- ', '')}
          className="p-1.5 rounded-lg hover:bg-white text-[#424a3a] hover:text-[#326318] transition-colors cursor-pointer"
          title="Danh sách gạch đầu dòng"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onClick={() => handleApplyFormat('\n1. ', '')}
          className="p-1.5 rounded-lg hover:bg-white text-[#424a3a] hover:text-[#326318] transition-colors cursor-pointer"
          title="Danh sách đánh số"
        >
          <ListOrdered size={15} />
        </button>
        <div className="w-[1px] h-4 bg-[#d0cac0] mx-1" />
        <div className="relative" ref={emojiPickerRef}>
          <button
            type="button"
            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isEmojiPickerOpen
                ? 'bg-[#326318] text-white shadow-xs'
                : 'hover:bg-white text-[#326318] bg-white/70 border border-[#e0dacf]'
            }`}
            title="Chèn biểu tượng cảm xúc / nông sản"
          >
            <Smile size={15} />
            <span className="text-[11px]">Icon nông sản</span>
          </button>

          {isEmojiPickerOpen && (
            <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-white rounded-2xl shadow-xl border border-[#ded8cb] z-50 animate-fadeIn">
              <div className="text-[10px] font-bold text-[#6a7364] uppercase tracking-wider mb-2">
                Biểu tượng nông sản &amp; cảm xúc
              </div>
              <div className="grid grid-cols-6 gap-1.5 text-lg">
                {POPULAR_FARMER_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      handleInsertEmoji(emoji)
                      setIsEmojiPickerOpen(false)
                    }}
                    className="h-8 w-8 rounded-lg hover:bg-[#f3f0e7] flex items-center justify-center transition-transform hover:scale-120 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <span className="text-[10px] text-[#788272] hidden sm:inline">
        Hỗ trợ định dạng &amp; Icon
      </span>
    </div>
  )
}

import React, { useRef } from 'react'
import {
  Bold,
  Italic,
  List,
  Heading1,
  Heading2,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
} from 'lucide-react'

export interface MyCKEditorProps {
  data?: string
  value?: string
  onChange: (data: string) => void
  placeholder?: string
}

const MyCKEditor: React.FC<MyCKEditorProps> = ({
  data,
  value,
  onChange,
  placeholder = 'Nhập nội dung bài viết chi tiết tại đây...',
}) => {
  const contentValue = value !== undefined ? value : data !== undefined ? data : ''
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const applyFormat = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = contentValue.substring(start, end)
    const before = contentValue.substring(0, start)
    const after = contentValue.substring(end)

    const replacement = `${prefix}${selectedText || 'nội dung'}${suffix}`
    const newContent = `${before}${replacement}${after}`
    onChange(newContent)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText.length || 7),
      )
    }, 0)
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs focus-within:border-[#326318] focus-within:ring-2 focus-within:ring-[#326318]/20 transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-[#f8faf6] border-b border-gray-200 text-gray-700">
        <button
          type="button"
          onClick={() => applyFormat('<h3>', '</h3>')}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors flex items-center gap-1"
          title="Tiêu đề 1"
        >
          <Heading1 size={15} />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('<h4>', '</h4>')}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors flex items-center gap-1"
          title="Tiêu đề 2"
        >
          <Heading2 size={15} />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => applyFormat('<strong>', '</strong>')}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors"
          title="In đậm"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('<em>', '</em>')}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors"
          title="In nghiêng"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('<blockquote>', '</blockquote>')}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors"
          title="Trích dẫn"
        >
          <Quote size={15} />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => applyFormat('<ul>\n  <li>', '</li>\n</ul>')}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors"
          title="Danh sách gạch đầu dòng"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onClick={() => {
            const url = prompt('Nhập địa chỉ liên kết (URL):', 'https://')
            if (url)
              applyFormat(
                `<a href="${url}" target="_blank" class="text-emerald-600 underline">`,
                '</a>',
              )
          }}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors"
          title="Chèn liên kết"
        >
          <LinkIcon size={15} />
        </button>
        <button
          type="button"
          onClick={() => {
            const url = prompt('Nhập URL hình ảnh:', 'https://images.unsplash.com/...')
            if (url)
              applyFormat(
                `<img src="${url}" alt="Hình ảnh" class="rounded-xl my-3 max-w-full" />\n`,
              )
          }}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors"
          title="Chèn hình ảnh"
        >
          <ImageIcon size={15} />
        </button>
      </div>

      {/* Editor Textarea */}
      <textarea
        ref={textareaRef}
        value={contentValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={12}
        className="w-full p-4 text-sm text-gray-800 focus:outline-hidden resize-y font-sans leading-relaxed"
      />
    </div>
  )
}

export default MyCKEditor

import DOMPurify from 'dompurify'
import 'ckeditor5/ckeditor5-content.css'

/** Bài cũ là văn bản thuần (mỗi đoạn một dòng), bài mới từ CKEditor là HTML */
export function isHtmlContent(text?: string | null): boolean {
  return !!text && /<\/?(p|h[1-6]|ul|ol|li|blockquote|figure|img|table|strong|em|u|a|br|div|span)\b/i.test(text)
}

/** Chuyển văn bản thuần (mỗi đoạn phân tách bằng dòng trống) sang HTML <p> cho CKEditor */
export function plainTextToHtml(text?: string | null): string {
  if (!text?.trim()) return ''
  if (isHtmlContent(text)) return text
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p>${p
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>')}</p>`,
    )
    .join('')
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['target'],
  })
}

/** Lấy chữ thuần từ HTML để làm đoạn trích / đếm từ */
export function htmlToPlainText(html?: string | null): string {
  if (!html) return ''
  if (!isHtmlContent(html)) return html
  const doc = new DOMParser().parseFromString(sanitizeHtml(html), 'text/html')
  doc.querySelectorAll('td, th').forEach((el) => el.append(' '))
  doc.querySelectorAll('p, h1, h2, h3, h4, li, blockquote, figcaption, br, tr').forEach((el) => el.append('\n'))
  return (doc.body.textContent ?? '').replace(/\n{2,}/g, '\n').trim()
}

/** Hiển thị HTML đã lọc XSS, với kiểu chữ bài báo cho trang chi tiết */
export function RichTextContent({ html, className = '' }: { html: string; className?: string }) {
  return <div className={`ck-content capnong-rich ${className}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
}

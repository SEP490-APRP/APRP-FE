import DOMPurify from 'dompurify'
import 'ckeditor5/ckeditor5-content.css'

/** Bài cũ là văn bản thuần (mỗi đoạn một dòng), bài mới từ CKEditor là HTML */
export function isHtmlContent(text?: string | null): boolean {
  return !!text && /<\/?(p|h[1-6]|ul|ol|li|blockquote|figure|img|table|strong|em|a|br|div|span)\b/i.test(text)
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
  doc.querySelectorAll('p, h1, h2, h3, h4, li, blockquote, figcaption, br').forEach((el) => el.append('\n'))
  return (doc.body.textContent ?? '').replace(/\n{2,}/g, '\n').trim()
}

/** Hiển thị HTML đã lọc XSS, với kiểu chữ bài báo cho trang chi tiết */
export function RichTextContent({ html, className = '' }: { html: string; className?: string }) {
  return <div className={`ck-content capnong-rich ${className}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
}

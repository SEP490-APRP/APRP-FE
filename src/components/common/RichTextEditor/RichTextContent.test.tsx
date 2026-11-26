import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { RichTextContent, htmlToPlainText, isHtmlContent, plainTextToHtml } from './RichTextContent'

describe('RichTextContent', () => {
  it('phân biệt bài cũ (văn bản thuần) và bài CKEditor (HTML)', () => {
    expect(isHtmlContent('Đoạn 1\nĐoạn 2')).toBe(false)
    expect(isHtmlContent('<p>Đoạn 1</p>')).toBe(true)
  })

  it('lọc script/onerror khi hiển thị', () => {
    const { container } = render(<RichTextContent html={'<h2>Tiêu đề</h2><img src="x" onerror="alert(1)"><script>alert(2)</script>'} />)
    expect(container.querySelector('h2')?.textContent).toBe('Tiêu đề')
    expect(container.querySelector('img')?.getAttribute('onerror')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
  })

  it('lấy chữ thuần làm đoạn trích, mỗi khối một dòng', () => {
    expect(htmlToPlainText('<h2>Vườn xoài</h2><p>Đang <strong>chín rộ</strong></p>').split('\n')).toEqual(['Vườn xoài', 'Đang chín rộ'])
    expect(htmlToPlainText('Văn bản thường')).toBe('Văn bản thường')
    expect(htmlToPlainText('<table><tr><th>Loại</th><th>Giá</th></tr><tr><td>Xoài</td><td>30k</td></tr></table>')).toContain('Loại Giá')
  })

  it('chuyển văn bản thuần sang HTML <p> và giữ nguyên HTML sẵn có', () => {
    expect(plainTextToHtml('Đoạn 1\n\nĐoạn 2 <tươi>')).toBe('<p>Đoạn 1</p><p>Đoạn 2 &lt;tươi&gt;</p>')
    expect(plainTextToHtml('<p>Đã là HTML</p>')).toBe('<p>Đã là HTML</p>')
  })
})

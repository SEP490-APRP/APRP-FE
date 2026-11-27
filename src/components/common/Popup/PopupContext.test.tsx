import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { globalShowConfirm, globalShowPrompt, PopupProvider } from './PopupContext'

afterEach(cleanup)

describe('Popup', () => {
  it('xác nhận: hiện chi tiết, đồng ý trả true, popup sau chờ popup trước đóng', async () => {
    render(<PopupProvider>trang</PopupProvider>)
    let first!: Promise<boolean>
    let second!: Promise<boolean>
    act(() => {
      first = globalShowConfirm('Chốt xe ra hub?', 'Tài xế được báo.', { confirmText: 'Chốt', details: ['2 xe chở 17 đơn'] })
      second = globalShowConfirm('Xóa voucher?', 'Không hoàn tác.', { danger: true, confirmText: 'Xóa' })
    })
    expect(screen.getByText('2 xe chở 17 đơn')).toBeTruthy()
    expect(screen.queryByText('Xóa voucher?')).toBeNull()
    fireEvent.click(screen.getByText('Chốt'))
    await expect(first).resolves.toBe(true)
    fireEvent.click(screen.getByText('Hủy bỏ'))
    await expect(second).resolves.toBe(false)
  })

  it('Esc chỉ đóng popup, không lọt ra cửa sổ phía sau', async () => {
    const outside = vi.fn()
    window.addEventListener('keydown', outside)
    render(<PopupProvider>trang</PopupProvider>)
    let answer!: Promise<boolean>
    act(() => {
      answer = globalShowConfirm('Gắn tài xế?', '')
    })
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    await expect(answer).resolves.toBe(false)
    expect(outside).not.toHaveBeenCalled()
    window.removeEventListener('keydown', outside)
  })

  it('ô nhập trả giá trị đã nhập', async () => {
    render(<PopupProvider>trang</PopupProvider>)
    let answer!: Promise<string | null>
    act(() => {
      answer = globalShowPrompt('Chèn liên kết', { label: 'Địa chỉ', defaultValue: 'https://' })
    })
    fireEvent.change(screen.getByLabelText('Địa chỉ'), { target: { value: 'https://capnong.vn' } })
    fireEvent.click(screen.getByText('Chèn'))
    await expect(answer).resolves.toBe('https://capnong.vn')
  })
})

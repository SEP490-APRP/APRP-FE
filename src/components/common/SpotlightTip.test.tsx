import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SpotlightTip from './SpotlightTip'

describe('chỉ dẫn một bước', () => {
  it('hiện lời nhắc cạnh nút; nút hành động, Để sau, Esc và bấm nút được chỉ đều gọi đúng', () => {
    const onAction = vi.fn()
    const onClose = vi.fn()
    render(
      <>
        <button id="muc-tieu">Banner trang chủ</button>
        <SpotlightTip targetId="muc-tieu" eyebrow="Đã mở bán" title="Cấu hình banner" text="Thu hút người mua" actionLabel="Cấu hình ngay" onAction={onAction} onClose={onClose} />
      </>,
    )

    expect(screen.getByRole('dialog', { name: 'Cấu hình banner' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Cấu hình ngay/ }))
    expect(onAction).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Để sau' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Banner trang chủ' }))
    expect(onClose).toHaveBeenCalledTimes(3)
  })
})

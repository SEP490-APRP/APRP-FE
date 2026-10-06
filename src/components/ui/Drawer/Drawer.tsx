import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils'
import { Button } from '../Button'

type DrawerProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  side?: 'left' | 'bottom'
}

/**
 * Ngăn kéo dựa trên <dialog> gốc: có sẵn focus trap, phím Esc và lớp nền.
 * Dùng cho bộ lọc trên mobile và menu admin trên màn hình nhỏ.
 */
export function Drawer({ open, title, onClose, children, footer, side = 'bottom' }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const headingId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
      const overflow = document.body.style.overflow
      dialog.showModal()
      document.body.style.overflow = 'hidden'
      return () => {
        dialog.close()
        document.body.style.overflow = overflow
        previous?.focus()
      }
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={headingId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={cn(
        'm-0 max-h-none max-w-none bg-white p-0 text-ink shadow-2xl backdrop:bg-black/50',
        side === 'bottom'
          ? 'mt-auto max-h-[85dvh] w-full rounded-t-panel'
          : 'h-dvh w-[min(20rem,85vw)] rounded-r-panel',
      )}
    >
      <div className={cn('flex flex-col', side === 'bottom' ? 'max-h-[85dvh]' : 'h-full')}>
        <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
          <h2 id={headingId} className="text-base font-extrabold text-ink">
            {title}
          </h2>
          <Button variant="ghost" size="icon" aria-label="Đóng" onClick={onClose}>
            <X size={20} aria-hidden />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
        {footer && (
          <footer className="border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  )
}

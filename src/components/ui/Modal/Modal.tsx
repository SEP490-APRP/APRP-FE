import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export default function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const previous = document.activeElement as HTMLElement | null
    if (!dialog.open) {
      dialog.showModal()
    }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      if (dialog.open) {
        dialog.close()
      }
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      className={`app-dialog fixed inset-0 m-auto ${wide ? 'wide' : ''}`}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      aria-labelledby="dialog-heading"
    >
      <div className="dialog-inner">
        <div className="dialog-heading">
          <h2 id="dialog-heading">{title}</h2>
          <button autoFocus className="icon-button" aria-label="Đóng" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

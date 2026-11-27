import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, Sparkles, X } from 'lucide-react'

const PAD = 6
const GAP = 14

/**
 * Chỉ dẫn một bước kiểu OnboardingTour: làm tối trang, viền sáng quanh một nút và hiện lời nhắc cạnh nút đó.
 * Trang vẫn bấm được; bấm chính nút được chỉ thì lời nhắc tự đóng.
 */
export default function SpotlightTip({
  targetId,
  eyebrow,
  title,
  text,
  actionLabel,
  onAction,
  onClose,
  onTargetClick,
}: {
  targetId: string
  eyebrow: string
  title: string
  text: string
  actionLabel: string
  onAction: () => void
  onClose: () => void
  /** Bấm chính nút được chỉ; bỏ trống thì chỉ đóng lời nhắc */
  onTargetClick?: () => void
}) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [tipHeight, setTipHeight] = useState(200)
  const tipRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const targetRef = useRef(onTargetClick)
  targetRef.current = onTargetClick

  useEffect(() => {
    const el = document.getElementById(targetId)
    if (!el) return
    el.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    const measure = () => setRect(el.getBoundingClientRect())
    measure()
    // Trang cuộn mượt hoặc vừa tải lại số liệu: đo lại cho viền bám theo nút
    const timer = window.setInterval(measure, 200)
    const close = () => closeRef.current()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    window.addEventListener('keydown', onKey)
    const pressed = () => (targetRef.current ?? closeRef.current)()
    el.addEventListener('click', pressed)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('keydown', onKey)
      el.removeEventListener('click', pressed)
    }
  }, [targetId])

  useLayoutEffect(() => {
    const h = tipRef.current?.offsetHeight
    if (h) setTipHeight(h)
  }, [rect])

  if (!rect) return null
  const hole = { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
  const width = Math.min(340, window.innerWidth - 32)
  const below = hole.top + hole.height + GAP + tipHeight <= window.innerHeight
  const top = below ? hole.top + hole.height + GAP : Math.max(16, hole.top - GAP - tipHeight)
  const left = Math.min(Math.max(16, hole.left + hole.width / 2 - width / 2), window.innerWidth - width - 16)

  return createPortal(
    <>
      {/* Lớp tối khoét một lỗ ở nút cần bấm */}
      <div aria-hidden className="pointer-events-none fixed z-[9998] rounded-2xl border-2 border-[#ffea79] transition-all duration-200"
        style={{ ...hole, boxShadow: '0 0 0 9999px rgba(0,0,0,0.52)' }} />
      <div ref={tipRef} role="dialog" aria-labelledby="spotlight-title" className="fixed z-[10000] overflow-visible" style={{ top, left, width }}>
        <span aria-hidden className={`absolute h-4 w-4 rotate-45 bg-white ${below ? '-top-1.5' : '-bottom-1.5'}`}
          style={{ left: Math.min(Math.max(16, hole.left + hole.width / 2 - left - 8), width - 32) }} />
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-2 bg-[#eef6e7] px-5 py-3">
            <p className="flex min-w-0 items-center gap-2 truncate text-xs font-black text-[#326318]"><Sparkles size={15} className="shrink-0" /> {eyebrow}</p>
            <button type="button" aria-label="Đóng hướng dẫn" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
          </div>
          <div className="px-5 py-4">
            <h3 id="spotlight-title" className="text-sm font-black text-gray-900">{title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-600">{text}</p>
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-50">Để sau</button>
            <button type="button" onClick={onAction} className="flex flex-[2] items-center justify-center gap-1 rounded-xl bg-[#326318] py-2.5 text-xs font-black text-white hover:bg-[#254d12]">
              {actionLabel} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}

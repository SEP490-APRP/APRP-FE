import { useRef, useState } from 'react'
import { Camera, CheckCircle2, Loader2 } from 'lucide-react'
import { uploadService } from '@/services'

/** Chụp ảnh minh chứng rồi mới bấm xác nhận được (bốc hàng lên xe, giao tới hub) */
export default function PhotoConfirm({
  alt,
  captureLabel,
  confirmLabel,
  busy,
  onConfirm,
  onError,
}: {
  alt: string
  captureLabel: string
  confirmLabel: string
  busy: boolean
  onConfirm: (photoUrl: string) => void
  onError: (e: unknown) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const upload = async (f?: File) => {
    if (!f) return
    setUploading(true)
    try {
      const res = await uploadService.uploadImage(f, 'pod')
      setPhoto(res.result?.url ?? null)
    } catch (e) {
      onError(e)
    } finally {
      setUploading(false)
    }
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" aria-label={alt}
        onChange={(e) => {
          void upload(e.target.files?.[0])
          e.target.value = ''
        }} />
      {photo && <img src={photo} alt={alt} className="h-14 w-14 rounded-xl border border-gray-200 object-cover" />}
      <button type="button" disabled={uploading || busy} onClick={() => fileRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[#326318] bg-white px-3 py-2 text-xs font-bold text-[#326318] disabled:opacity-50">
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />} {photo ? 'Chụp lại' : captureLabel}
      </button>
      <button type="button" disabled={!photo || uploading || busy} onClick={() => photo && onConfirm(photo)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#326318] px-3.5 py-2 text-xs font-black text-white disabled:opacity-40">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} {confirmLabel}
      </button>
      {!photo && <span className="w-full text-[11px] font-semibold text-amber-700">Chụp ảnh trước khi bấm {confirmLabel.toLowerCase()}.</span>}
    </span>
  )
}

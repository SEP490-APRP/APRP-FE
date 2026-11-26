import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, CheckCircle2, XCircle, ZoomIn, ExternalLink, X } from 'lucide-react'
import { failReasonLabel } from '@/features/shipper'
import type { OrderStatus } from '@/types/order.types'

interface DeliveryProofSectionProps {
  status: OrderStatus
  shipperName?: string
  deliveredAt?: string
  deliveryProofUrls?: string[]
  failedAt?: string
  failReason?: string
  failNote?: string
  failCallAttempts?: number
  failProofUrls?: string[]
}

const DELIVERED_GROUP: OrderStatus[] = ['DELIVERED', 'COMPLETED', 'REFUND_REQUESTED', 'REFUNDED']

function formatDateTime(value?: string | number[]): string | null {
  if (!value) return null
  const d = Array.isArray(value)
    ? new Date(value[0], (value[1] ?? 1) - 1, value[2] ?? 1, value[3] ?? 0, value[4] ?? 0, value[5] ?? 0)
    : new Date(value)
  if (Number.isNaN(d.getTime())) return Array.isArray(value) ? value.join('/') : value
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function DeliveryProofSection({
  status,
  shipperName,
  deliveredAt,
  deliveryProofUrls,
  failedAt,
  failReason,
  failNote,
  failCallAttempts,
  failProofUrls,
}: DeliveryProofSectionProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const deliveredPhotos = (deliveryProofUrls || []).map((u) => u?.trim()).filter(Boolean)
  const failedPhotos = (failProofUrls || []).map((u) => u?.trim()).filter(Boolean)

  const showDeliveredSection =
    deliveredPhotos.length > 0 || (DELIVERED_GROUP.includes(status) && Boolean(deliveredAt))
  const showFailedSection =
    failedPhotos.length > 0 ||
    ((status === 'FAILED' || status === 'RETURNING_TO_SHOP' || status === 'RETURNED_TO_SHOP') &&
      Boolean(failReason || failNote || failedAt))

  if (!showDeliveredSection && !showFailedSection) {
    return null
  }

  const deliveredTime = formatDateTime(deliveredAt)
  const failedTime = formatDateTime(failedAt)

  const renderGallery = (urls: string[], altPrefix: string) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {urls.map((url, idx) => (
        <button
          key={`${url}-${idx}`}
          type="button"
          onClick={() => setPreviewUrl(url)}
          className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-stone-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#326318]"
          title="Nhấn để phóng to ảnh"
        >
          <img
            src={url}
            alt={`${altPrefix} ${idx + 1}`}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <ZoomIn
              size={18}
              className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow"
            />
          </span>
        </button>
      ))}
    </div>
  )

  return (
    <>
      {showDeliveredSection && (
        <div className="p-3.5 rounded-lg bg-[#fafcf9] border border-[#dce8d6] space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-[#326318] uppercase text-[11px]">
              <Camera size={14} className="shrink-0" />
              <span>Ảnh Xác Nhận Giao Hàng Thành Công</span>
            </div>
            {deliveredTime && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 size={12} className="shrink-0" />
                <span>{deliveredTime}</span>
              </span>
            )}
          </div>

          {shipperName && (
            <p className="text-[11px] text-[#555d4e]">
              Shipper giao nhận: <strong className="text-[#1c2216]">{shipperName}</strong>
            </p>
          )}

          {deliveredPhotos.length > 0 ? (
            renderGallery(deliveredPhotos, 'Ảnh giao hàng thành công')
          ) : (
            <p className="text-[11px] text-[#747e70] italic">
              Chưa có ảnh xác nhận đính kèm cho đơn hàng này.
            </p>
          )}
        </div>
      )}

      {showFailedSection && (
        <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-rose-800 uppercase text-[11px]">
              <XCircle size={14} className="shrink-0" />
              <span>Thông Tin &amp; Bằng Chứng Giao Thất Bại</span>
            </div>
            {failedTime && (
              <span className="text-[11px] font-semibold text-rose-700">{failedTime}</span>
            )}
          </div>

          <div className="space-y-1 text-[11px] text-rose-900">
            {failReason && (
              <p>
                <strong>Lý do:</strong> {failReasonLabel(failReason)}
              </p>
            )}
            {failCallAttempts != null && (
              <p>
                <strong>Số cuộc gọi liên hệ:</strong> {failCallAttempts} lần
              </p>
            )}
            {failNote && (
              <p>
                <strong>Ghi chú shipper:</strong> {failNote}
              </p>
            )}
          </div>

          {failedPhotos.length > 0 && renderGallery(failedPhotos, 'Ảnh bằng chứng giao thất bại')}
        </div>
      )}

      {previewUrl &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4 animate-fadeIn"
            onClick={() => setPreviewUrl(null)}
          >
            <div
              className="relative max-w-2xl w-full bg-white rounded-xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-200 bg-[#fafcf9]">
                <span className="text-xs font-bold text-[#1c2216]">Ảnh Bằng Chứng Giao Hàng</span>
                <div className="flex items-center gap-2">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#326318] hover:underline"
                  >
                    <ExternalLink size={12} />
                    <span>Mở tab mới</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewUrl(null)}
                    aria-label="Đóng ảnh"
                    className="size-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
              <div className="bg-black/95 flex items-center justify-center max-h-[78vh]">
                <img
                  src={previewUrl}
                  alt="Ảnh bằng chứng giao hàng phóng to"
                  className="max-h-[78vh] w-auto object-contain"
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

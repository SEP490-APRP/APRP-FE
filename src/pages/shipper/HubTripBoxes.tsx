import { useState, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { shipperHubTripService, type HubTrip } from '@/services'
import CrateScanDialog from './CrateScanDialog'

/** Số thùng còn phải nhận trước khi chạy */
export const boxesLeft = (t: HubTrip) => Math.max(0, (t.boxTotal ?? 0) - (t.boxLoaded ?? 0))

/** Chuyến sau khi đổi các thùng đã nhận của một đơn (hiện ngay trong lúc chờ máy chủ lưu) */
function withLoaded(t: HubTrip, orderId: number, loaded: number[]): HubTrip {
  const boxes = (t.boxes ?? []).map((b) => (b.orderId === orderId ? { ...b, loaded } : b))
  return { ...t, boxes, boxLoaded: boxes.reduce((s, b) => s + b.loaded.length, 0) }
}

/** Cửa sổ tài xế nhận hàng lên xe: quét tem hoặc bấm từng thùng, đủ hết mới chạy ra hub */
export default function HubTripBoxesDialog({
  t,
  onClose,
  onChanged,
  onError,
  confirm,
}: {
  t: HubTrip
  onClose: () => void
  onChanged: () => void
  onError: (e: unknown) => void
  /** Đã nhận đủ: chụp ảnh và chạy ra hub luôn từ cửa sổ này */
  confirm: ReactNode
}) {
  const qc = useQueryClient()
  const [failed, setFailed] = useState(false)
  const mutationKey = ['hub-boxes', t.tripId]
  const save = useMutation({
    mutationKey,
    // Lưu lần lượt: quét liên tiếp không ghi đè nhau
    scope: { id: `hub-boxes-${t.tripId}` },
    mutationFn: ({ orderId, loaded }: { orderId: number; loaded: number[] }) => shipperHubTripService.loadBoxes(t.tripId, orderId, loaded),
    onMutate: ({ orderId, loaded }) => {
      setFailed(false)
      qc.setQueryData<HubTrip[]>(['shipper-hub-trips', 'mine'], (old) => old?.map((x) => (x.tripId === t.tripId ? withLoaded(x, orderId, loaded) : x)))
    },
    onError: (e) => {
      setFailed(true)
      onError(e)
    },
    onSettled: () => {
      if (qc.isMutating({ mutationKey }) <= 1) onChanged()
    },
  })
  const complete = (t.boxTotal ?? 0) > 0 && boxesLeft(t) === 0

  return (
    <CrateScanDialog
      title={`Nhận hàng lên xe ${t.tripNo}`}
      subtitle={`${t.campaignTitle} · ${t.collectionSiteName || 'Điểm tập kết'}${failed ? ' · Chưa lưu được, kiểm tra lại các thùng vừa chọn' : ''}`}
      word="nhận"
      boxes={t.boxes ?? []}
      line={(b) => `Giao tới ${b.hubName ?? 'hub'}`}
      saving={save.isPending}
      onSet={(b, loaded) => save.mutate({ orderId: b.orderId, loaded })}
      onClose={onClose}
      action={complete && !save.isPending && confirm}
    />
  )
}

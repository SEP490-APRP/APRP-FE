import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Truck } from 'lucide-react'
import { shipperPreOrderService, type HubTripBox, type PreOrderResponse } from '@/services'
import CrateScanDialog from './CrateScanDialog'

/** Shipper lấy hàng ở một hub: quét hoặc bấm đủ thùng của đơn nào thì đơn đó được lấy đi giao */
export default function HubPickupDialog({
  orders,
  onClose,
  onChanged,
  onError,
}: {
  /** Các đơn shipper đang giữ ở cùng một hub, hub đã xác nhận */
  orders: PreOrderResponse[]
  onClose: () => void
  onChanged: () => void
  onError: (e: unknown) => void
}) {
  const [ticked, setTicked] = useState<Record<number, number[]>>({})
  const boxes: HubTripBox[] = orders.map((o) => ({
    orderId: o.preOrderId,
    code: o.code,
    recipientName: o.recipientName,
    hubName: o.hubName,
    crateKg: o.crateKg,
    crates: o.crateQuantity,
    loaded: ticked[o.preOrderId] ?? [],
    qrCode: o.qrCode,
  }))
  const full = boxes.filter((b) => b.loaded.length === b.crates)
  const pickup = useMutation({
    mutationFn: async (list: HubTripBox[]) => {
      for (const b of list) await shipperPreOrderService.pickup(b.orderId, b.loaded)
    },
    onSuccess: (_r, list) => {
      onChanged()
      if (list.length === boxes.length) onClose()
    },
    onError: (e) => {
      onChanged()
      onError(e)
      onClose()
    },
  })
  const hub = orders[0]?.hubName ?? 'hub'

  return (
    <CrateScanDialog
      title={`Lấy hàng tại ${hub}`}
      subtitle={orders[0]?.hubAddress ?? ''}
      word="lấy"
      boxes={boxes}
      line={(b) => orders.find((o) => o.preOrderId === b.orderId)?.shippingAddress ?? `Lấy tại ${hub}`}
      saving={pickup.isPending}
      onSet={(b, loaded) => setTicked((x) => ({ ...x, [b.orderId]: loaded }))}
      onClose={onClose}
      action={
        <button type="button" disabled={full.length === 0 || pickup.isPending} onClick={() => pickup.mutate(full)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#326318] px-5 py-2.5 text-sm font-black text-white disabled:opacity-40">
          {pickup.isPending ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
          {full.length ? `Bắt đầu giao ${full.length} đơn đã đủ thùng` : 'Kiểm đủ thùng để giao'}
        </button>
      }
    />
  )
}

import { Loader2 } from 'lucide-react'
import { formatBackendDate, formatVnd, type OrderSettlementResponse } from '@/services/wallet.service'
import { useOrderSettlement } from '../hooks/useWalletQueries'

interface OrderSettlementCardProps {
  orderId: number
  /** Ẩn phần của sàn (ví dụ khi Shop xem) */
  viewer?: 'SHOP' | 'SHIPPER' | 'ADMIN'
}

const pct = (rate: number) => `${Math.round(rate * 1000) / 10}%`

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'minus' | 'plus' }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className={`text-xs ${strong ? 'font-bold text-[#1c2216]' : 'text-[#6e7767]'}`}>{label}</span>
      <span
        className={`text-xs ${strong ? 'font-black' : 'font-semibold'} ${
          tone === 'minus' ? 'text-[#c5221f]' : tone === 'plus' ? 'text-[#326318]' : 'text-[#1c2216]'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function Body({ s, viewer }: { s: OrderSettlementResponse; viewer: 'SHOP' | 'SHIPPER' | 'ADMIN' }) {
  const showShop = viewer !== 'SHIPPER'
  const showShipper = viewer !== 'SHOP'
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black text-[#1c2216]">Chia tiền đơn #{s.orderId}</h4>
        <span
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
            s.settled ? 'bg-[#eaf5e1] text-[#326318]' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {s.settled ? `Đã vào ví · ${formatBackendDate(s.settledAt)}` : 'Dự kiến (về ví khi khách xác nhận nhận hàng)'}
        </span>
      </div>

      {showShop && (
        <div className="rounded-2xl border border-[#e8ece3] p-3">
          <Row label="Tiền hàng" value={formatVnd(s.goodsAmount)} />
          {s.shopVoucherDiscount > 0 && (
            <Row label="Voucher của shop (shop chịu)" value={formatVnd(-s.shopVoucherDiscount)} tone="minus" />
          )}
          {s.platformVoucherDiscount > 0 && (
            <Row label="Voucher sàn (sàn bù, shop không mất)" value={formatVnd(s.platformVoucherDiscount)} />
          )}
          <Row label={`Phí dịch vụ nông dân ${pct(s.farmerFeeRate)}`} value={formatVnd(-s.farmerFee)} tone="minus" />
          <Row label="Shop nhận" value={formatVnd(s.shopReceive)} strong tone="plus" />
        </div>
      )}

      {showShipper && (
        <div className="rounded-2xl border border-[#e8ece3] p-3">
          <Row label="Cước giao hàng" value={formatVnd(s.shippingFee)} />
          {s.platformFreeshipDiscount > 0 && (
            <Row label="Freeship sàn (sàn bù cho shipper)" value={formatVnd(s.platformFreeshipDiscount)} />
          )}
          <Row label={`Phí dịch vụ shipper ${pct(s.shipperFeeRate)}`} value={formatVnd(-s.shipperFee)} tone="minus" />
          <Row
            label={s.shipper?.name ? `Shipper nhận (${s.shipper.name})` : 'Shipper nhận'}
            value={formatVnd(s.shipperReceive)}
            strong
            tone="plus"
          />
          {s.paymentMethod === 'COD' && s.codAmount != null && (
            <Row
              label={s.codSettled ? 'Tiền mặt COD đã nộp về sàn' : 'Tiền mặt COD shipper đang giữ'}
              value={formatVnd(s.codAmount)}
            />
          )}
        </div>
      )}

      {viewer === 'ADMIN' && (
        <div className="rounded-2xl bg-[#f6f8f3] p-3">
          <Row label="Khách trả" value={formatVnd(s.buyerPaid)} />
          <Row label="Sàn nhận" value={formatVnd(s.platformReceive)} strong tone={s.platformReceive < 0 ? 'minus' : 'plus'} />
          {s.refundAmount ? (
            <Row label={`Cần hoàn cho khách${s.refundReason ? `: ${s.refundReason}` : ''}`} value={formatVnd(s.refundAmount)} tone="minus" />
          ) : null}
        </div>
      )}
    </div>
  )
}

/** Bảng chia tiền 1 đơn: tiền hàng, voucher, phí dịch vụ, tiền Shop / Shipper / Sàn nhận */
export function OrderSettlementCard({ orderId, viewer = 'SHOP' }: OrderSettlementCardProps) {
  const { data, isLoading, error } = useOrderSettlement(orderId)
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#6e7767] py-3">
        <Loader2 size={14} className="animate-spin" /> Đang tính tiền chia...
      </div>
    )
  }
  if (error || !data) {
    return <p className="text-xs text-[#858f7e] py-2">Chưa xem được bảng chia tiền của đơn này.</p>
  }
  return <Body s={data} viewer={viewer} />
}

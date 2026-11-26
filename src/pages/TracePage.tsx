import { useEffect, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, CalendarClock, Package, PackageX, Snowflake, Sprout, UserRound } from 'lucide-react'
import logoIcon from '@/assets/logo-icon.png'
import { fmtLabelDay, SHELF_TEXT } from '@/features/campaign/packageLabels'
import { formatKg, readyLabel } from '@/features/campaign/utils'
import { campaignService, type PackageTrace } from '@/services'

const STATUS: Record<string, string> = {
  DEPOSIT_PAID: 'Chờ đóng gói', PROCESSING: 'Đã đóng gói', READY: 'Đang ở hub', SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao', FAILED: 'Giao chưa thành công', CANCELLED: 'Đơn đã huỷ',
}

/** Trang mở ra khi quét tem QR trên thùng hàng: ai cũng xem được, ưu tiên màn hình điện thoại */
export default function TracePage() {
  const { token = '' } = useParams()
  const q = useQuery({ queryKey: ['package-trace', token], queryFn: () => campaignService.trace(token), retry: false })

  useEffect(() => {
    document.title = 'Thông tin thùng hàng · CapNong'
  }, [])

  return (
    <main className="min-h-screen bg-[#f6faf2] px-4 py-5 text-[#1c2216]">
      <div className="mx-auto flex max-w-md flex-col gap-3">
        <a href="/" className="flex items-center gap-2 self-center">
          <img src={logoIcon} alt="" className="h-10 w-10" />
          <span className="text-xl font-black text-[#326318]">CapNong</span>
        </a>
        {q.isPending ? (
          <div className="h-80 animate-pulse rounded-3xl bg-white" />
        ) : q.isError || !q.data ? (
          <section className="flex flex-col items-center gap-2 rounded-3xl bg-white p-8 text-center shadow-sm">
            <PackageX size={40} className="text-gray-400" />
            <h1 className="text-lg font-black">Không tìm thấy thùng hàng</h1>
            <p className="text-sm text-gray-500">Mã trên tem không đúng, hoặc máy chủ đang bận. Bạn thử quét lại.</p>
            <button type="button" onClick={() => q.refetch()} className="mt-2 rounded-full bg-[#326318] px-5 py-2 text-sm font-bold text-white">Thử lại</button>
          </section>
        ) : (
          <PackageInfo p={q.data} />
        )}
      </div>
    </main>
  )
}

function PackageInfo({ p }: { p: PackageTrace }) {
  const shelf = p.shelfLifeTier ? SHELF_TEXT[p.shelfLifeTier] : undefined
  const expired = !!p.bestBefore && new Date(p.bestBefore).getTime() < Date.now()
  return (
    <>
      <section className="rounded-3xl bg-[#326318] p-5 text-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-bold text-[#ffea79]">{p.orderCode}</p>
          <span className="shrink-0 rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold">{p.status === 'READY' ? readyLabel(p.hubStage, 'Đang ở hub') : STATUS[p.status] ?? p.status}</span>
        </div>
        <p className="mt-3 text-4xl font-black tabular-nums">{formatKg(p.totalKg)}</p>
        <p className="text-sm font-bold text-white/85">{p.crateQuantity} thùng × {formatKg(p.crateKg)}</p>
        <p className="mt-4 flex items-center gap-2 text-lg font-black"><UserRound size={18} className="text-[#ffea79]" /> {p.recipientName}</p>
        <p className="text-xs text-white/70">Người nhận</p>
      </section>

      <Card icon={<BadgeCheck size={18} />} title="Chất lượng">
        <p className={`text-lg font-black ${p.qualityPassed ? 'text-[#326318]' : 'text-amber-700'}`}>{p.qualityPassed ? 'Đạt chuẩn' : 'Chưa có kết quả kiểm'}</p>
        <p className="text-sm text-gray-600">
          {p.checkedAt ? `Cân và kiểm tại ${p.collectionSiteName ?? 'điểm tập kết'} ngày ${fmtLabelDay(p.checkedAt)}` : 'Nông sản giải cứu, được cân kiểm tại điểm tập kết'}
        </p>
      </Card>

      <Card icon={<Snowflake size={18} />} title="Bảo quản">
        <p className="text-lg font-black">{shelf?.label ?? 'Để nơi thoáng mát'}</p>
        {shelf && <p className="text-sm text-gray-600">{shelf.care}</p>}
        <p className={`mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${expired ? 'bg-red-50 text-red-700' : 'bg-[#fff6c4] text-[#4a3b00]'}`}>
          <CalendarClock size={16} /> {expired ? 'Đã qua hạn tươi ngày' : 'Dùng ngon nhất trước'} {fmtLabelDay(p.bestBefore)}
        </p>
      </Card>

      <Card icon={<Sprout size={18} />} title="Nguồn hàng">
        <dl className="text-sm">
          <Row label="Nông sản" value={p.productName || p.campaignTitle} />
          <Row label="Nhà vườn" value={p.farmName || '—'} />
          <Row label="Thu hoạch" value={fmtLabelDay(p.harvestDate)} />
        </dl>
      </Card>

      <Card icon={<Package size={18} />} title="Chiến dịch">
        <p className="text-sm font-bold">{p.campaignTitle}</p>
        <p className="text-xs text-gray-500">
          Đóng gói {fmtLabelDay(p.packedAt)}{p.deliveredAt ? ` · Giao ${fmtLabelDay(p.deliveredAt)}` : ''}
        </p>
      </Card>
    </>
  )
}

function Card({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm">
      <h2 className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-500"><span className="text-[#326318]">{icon}</span> {title}</h2>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-1.5 last:border-b-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-bold">{value}</dd>
    </div>
  )
}

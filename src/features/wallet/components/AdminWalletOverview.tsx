import { useMemo, useState } from 'react'
import { Banknote, Briefcase, Lock, Percent, RotateCcw, TrendingUp, Users } from 'lucide-react'
import { usePlatformOverview } from '../hooks/useWalletQueries'
import { formatVnd, parseBackendDate } from '@/services/wallet.service'
import type { OverviewPeriod, PlatformOverviewPartner } from '@/services/wallet.types'

const PERIODS: { key: OverviewPeriod; label: string }[] = [
  { key: 'TODAY', label: 'Hôm nay' },
  { key: '7D', label: '7 ngày' },
  { key: '30D', label: '30 ngày' },
  { key: 'ALL', label: 'Tất cả' },
]
const PERIOD_TEXT: Record<OverviewPeriod, string> = { TODAY: 'hôm nay', '7D': '7 ngày', '30D': '30 ngày', ALL: 'từ trước tới nay' }

type RoleFilter = 'ALL' | 'SHOP' | 'SHIPPER'
const ROLE_TABS: { key: RoleFilter; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'SHOP', label: 'Shop' },
  { key: 'SHIPPER', label: 'Shipper' },
]

const daysSince = (value: unknown) => {
  const d = parseBackendDate(value as never)
  return d ? Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000)) : null
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}>{children}</div>
}
function Label({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
      <span>{children}</span>
      {right}
    </div>
  )
}
function Row({ label, value, tone = 'text-gray-900' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="mt-1 flex justify-between gap-2 text-xs text-gray-500">
      <span>{label}</span>
      <b className={`whitespace-nowrap ${tone}`}>{value}</b>
    </div>
  )
}

/** Khối số liệu đầu màn Ví Sàn: tiền giữ hộ, hoa hồng, ví sàn, COD chưa nộp, hoàn tiền, bảng theo đối tác */
export function AdminWalletOverview() {
  const [period, setPeriod] = useState<OverviewPeriod>('30D')
  const [heldRole, setHeldRole] = useState<RoleFilter>('ALL')
  const [tableRole, setTableRole] = useState<RoleFilter>('ALL')
  const { data: o, isLoading, isError, refetch } = usePlatformOverview(period)

  const held =
    heldRole === 'SHOP' ? o?.shopHeld : heldRole === 'SHIPPER' ? o?.shipperHeld : (o?.shopHeld ?? 0) + (o?.shipperHeld ?? 0)
  const heldOrders = heldRole === 'SHOP' ? o?.shopHeldOrders : heldRole === 'SHIPPER' ? o?.shipperHeldOrders : o?.heldOrders
  const commission = o?.commissionTotal ?? 0
  const farmerPct = commission > 0 ? ((o?.farmerFee ?? 0) / commission) * 100 : 0
  const codDays = daysSince(o?.codOldestCollectedAt)
  const partners = useMemo<PlatformOverviewPartner[]>(
    () => (o?.partners ?? []).filter((p) => tableRole === 'ALL' || p.role === tableRole),
    [o?.partners, tableRole],
  )
  const v = (n?: number | null) => (isLoading ? '...' : formatVnd(n ?? 0))

  if (isError) {
    return (
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
        Không tải được số liệu ví sàn.
        <button type="button" onClick={() => void refetch()} className="rounded-lg bg-white px-3 py-1.5 text-xs">
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Tiền sàn đang giữ hộ Shop / Shipper, hoa hồng đã thu và các khoản cần xử lý
        </p>
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${
                period === p.key ? 'border-[#326318] bg-[#326318] text-white' : 'border-gray-200 bg-white text-gray-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.35fr_1fr_1fr_1fr]">
        {/* 1. Tiền đang giữ hộ đối tác */}
        <div className="rounded-2xl bg-gradient-to-br from-[#326318] to-[#1f420e] p-5 text-white shadow-md">
          <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-[#d9ecc9]">
            <span>Tiền đang giữ hộ đối tác</span>
            <Lock size={16} />
          </div>
          <div className="mt-3 flex gap-1.5">
            {ROLE_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setHeldRole(t.key)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  heldRole === t.key ? 'bg-[#ffea79] text-[#254b12]' : 'bg-white/10 text-[#e3f1da]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="mt-3 text-3xl font-black">{v(held)}</div>
          <p className="text-xs text-[#cfe6c4]">
            Chờ đơn hoàn tất mới chuyển vào số dư rút được · {heldOrders ?? 0} đơn
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/10 p-2.5 text-xs">
              Shop (tạm giữ)
              <b className="block text-base">{v(o?.shopHeld)}</b>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5 text-xs">
              Shipper (tạm giữ)
              <b className="block text-base">{v(o?.shipperHeld)}</b>
            </div>
          </div>
        </div>

        {/* 2. Hoa hồng */}
        <Card>
          <Label right={<Percent size={14} className="text-[#326318]" />}>Tổng hoa hồng đã nhận</Label>
          <div className="mt-2 text-3xl font-black text-[#326318]">{v(commission)}</div>
          <p className="text-[11px] text-gray-400">Trong {PERIOD_TEXT[period]}</p>
          <div className="my-3 flex h-2 overflow-hidden rounded-full bg-gray-100">
            <i className="block h-full bg-[#326318]" style={{ width: `${farmerPct}%` }} />
            <i className="block h-full bg-[#8fbf6a]" style={{ width: `${commission > 0 ? 100 - farmerPct : 0}%` }} />
          </div>
          <Row label="Phí nông dân 10%" value={v(o?.farmerFee)} />
          <Row label="Phí shipper 3%" value={v(o?.shipperFee)} />
        </Card>

        {/* 3. Ví sàn */}
        <Card>
          <Label right={<Briefcase size={14} className="text-gray-400" />}>Số dư ví sàn</Label>
          <div className={`mt-2 text-3xl font-black ${(o?.platformBalance ?? 0) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {v(o?.platformBalance)}
          </div>
          <p className="mb-2 text-[11px] text-gray-400">Số dư hiện tại · các dòng dưới tính trong {PERIOD_TEXT[period]}</p>
          <Row label="Hoa hồng" value={`+${v(commission)}`} tone="text-[#326318]" />
          <Row
            label="Sàn bù voucher, freeship"
            value={`-${v((o?.voucherSubsidy ?? 0) + (o?.freeshipSubsidy ?? 0))}`}
            tone="text-red-600"
          />
          <Row label="Phần sàn đang tạm giữ" value={v(o?.platformHeld)} tone="text-amber-600" />
        </Card>

        {/* 4. COD chưa nộp */}
        <Card>
          <Label right={<Banknote size={14} className="text-amber-600" />}>COD shipper chưa nộp</Label>
          <div className="mt-2 text-3xl font-black text-amber-600">{v(o?.codPendingAmount)}</div>
          <p className="text-xs text-gray-500">
            {o?.codPendingOrders ?? 0} đơn · {o?.codPendingShippers ?? 0} shipper
            {codDays !== null ? ` · lâu nhất ${codDays} ngày` : ''}
          </p>
          <a
            href="/admin/cod"
            className="mt-3 inline-flex rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-[#326318] hover:bg-gray-50"
          >
            Đối soát COD →
          </a>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* 5. Hoàn tiền */}
        <Card>
          <Label right={<RotateCcw size={14} className="text-red-500" />}>Cần hoàn tiền cho khách</Label>
          <div className="mt-2 text-2xl font-black text-red-600">{v(o?.refundAmount)}</div>
          <p className="text-xs text-gray-500">{o?.refundOrders ?? 0} đơn đã trả online bị huỷ / giao thất bại / trả trùng</p>
        </Card>
        <Card>
          <Label right={<Users size={14} className="text-gray-400" />}>Đã trả cho đối tác (số dư rút được)</Label>
          <div className="mt-2 text-2xl font-black text-gray-900">
            {v((o?.shopAvailable ?? 0) + (o?.shipperAvailable ?? 0))}
          </div>
          <Row label="Shop" value={v(o?.shopAvailable)} />
          <Row label="Shipper (âm = đang nợ COD)" value={v(o?.shipperAvailable)} tone={(o?.shipperAvailable ?? 0) < 0 ? 'text-red-600' : 'text-gray-900'} />
        </Card>
        <Card>
          <Label right={<TrendingUp size={14} className="text-gray-400" />}>Dòng tiền {PERIOD_TEXT[period]}</Label>
          <div className="mt-2 text-2xl font-black text-gray-900">{v(o?.settledGmv)}</div>
          <p className="text-xs text-gray-500">Tổng khách đã trả cho đơn hoàn tất · {o?.settledOrders ?? 0} đơn</p>
        </Card>
      </div>

      <Card>
        <h3 className="text-base font-black text-gray-900">Chi tiết tiền đang giữ theo đối tác</h3>
        <div className="my-3 flex gap-2">
          {ROLE_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTableRole(t.key)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${
                tableRole === t.key ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] uppercase text-gray-500">
                <th className="p-2.5">Đối tác</th>
                <th className="p-2.5">Vai trò</th>
                <th className="p-2.5 text-right">Đang tạm giữ</th>
                <th className="p-2.5 text-right">Số dư rút được</th>
                <th className="p-2.5 text-right">Đơn chờ hoàn tất</th>
                <th className="p-2.5 text-right">COD chưa nộp</th>
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-xs text-gray-400">
                    {isLoading ? 'Đang tải...' : 'Chưa có ví đối tác nào.'}
                  </td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr key={p.walletId} className="border-b border-gray-50">
                    <td className="p-2.5 font-semibold text-gray-900">{p.name}</td>
                    <td className="p-2.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          p.role === 'SHOP' ? 'bg-[#eaf5e1] text-[#326318]' : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {p.role === 'SHOP' ? 'Shop' : 'Shipper'}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-bold text-amber-600">{formatVnd(p.held)}</td>
                    <td className={`p-2.5 text-right font-bold ${p.balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatVnd(p.balance)}
                    </td>
                    <td className="p-2.5 text-right font-bold">{p.pendingOrders}</td>
                    <td className="p-2.5 text-right font-bold text-amber-600">
                      {p.role === 'SHIPPER' ? formatVnd(p.codHolding ?? 0) : '–'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

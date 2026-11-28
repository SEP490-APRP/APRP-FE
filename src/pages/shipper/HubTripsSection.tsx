import { useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, CalendarClock, Check, CheckCircle2, Loader2, Navigation, PackageCheck, Truck, Undo2 } from 'lucide-react'
import { shipperHubTripService, type HubTrip } from '@/services'
import HubTripBoxesDialog, { boxesLeft } from './HubTripBoxes'
import PhotoConfirm from './PhotoConfirm'
import { formatKg, formatVnd } from '@/features/campaign/utils'

const fmtDay = (v?: string | null) => (v ? new Date(`${v.slice(0, 10)}T00:00:00`).toLocaleDateString('vi-VN') : 'chưa rõ ngày')

const STATUS: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'Đang chờ tài xế', cls: 'bg-[#ffea79] text-[#4a3f00]' },
  ACCEPTED: { label: 'Bạn đã nhận', cls: 'bg-white text-[#326318]' },
  IN_TRANSIT: { label: 'Đang chở ra hub', cls: 'bg-blue-100 text-blue-900' },
  DELIVERED: { label: 'Đã giao tới hub', cls: 'bg-emerald-100 text-emerald-900' },
}

/** 3 chặng của một chuyến đã nhận; số = chặng đang chờ làm */
const STEPS = ['Đã nhận', 'Lấy hàng', 'Tới hub']
const STEP_AT: Record<string, number> = { ACCEPTED: 1, IN_TRANSIT: 2, DELIVERED: 3 }

type Kind = 'accept' | 'decline' | 'release'

const mapsTo = (lat?: number | null, lng?: number | null) =>
  lat != null && lng != null ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : null

/** Chuyến chở hàng chiến dịch từ điểm tập kết ra hub: nhận hoặc không nhận chuyến, lấy hàng, giao tới hub */
export default function HubTripsSection({ onError }: { onError: (e: unknown) => void }) {
  const qc = useQueryClient()
  /** Chuyến đang mở cửa sổ nhận hàng */
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const open = useQuery({ queryKey: ['shipper-hub-trips', 'open'], queryFn: shipperHubTripService.open, refetchInterval: 30_000 })
  const mine = useQuery({ queryKey: ['shipper-hub-trips', 'mine'], queryFn: shipperHubTripService.mine, refetchInterval: 30_000 })
  const refresh = () => qc.invalidateQueries({ queryKey: ['shipper-hub-trips'] })
  const act = useMutation({
    mutationFn: ({ id, kind }: { id: number; kind: Kind }) => shipperHubTripService[kind](id),
    onSuccess: refresh,
    onError: (e) => {
      onError(e)
      refresh()
    },
  })

  // Bốc hàng lên xe và giao tới hub đều kèm ảnh minh chứng
  const start = useMutation({
    mutationFn: ({ id, photo }: { id: number; photo: string }) => shipperHubTripService.start(id, photo),
    onSuccess: refresh,
    onError: (e) => {
      onError(e)
      refresh()
    },
  })
  const arrive = useMutation({
    mutationFn: ({ id, hubId, photo }: { id: number; hubId: number; photo: string }) => shipperHubTripService.arriveStop(id, hubId, photo),
    onSuccess: refresh,
    onError: (e) => {
      onError(e)
      refresh()
    },
  })
  const loadConfirm = (t: HubTrip, done?: () => void) => (
    <PhotoConfirm
      alt={`Ảnh hàng lên xe ${t.tripNo}`}
      captureLabel="Chụp ảnh hàng trên xe"
      confirmLabel="Chạy ra hub"
      busy={start.isPending}
      onConfirm={(photo) => {
        done?.()
        start.mutate({ id: t.tripId, photo })
      }}
      onError={onError}
    />
  )

  const mineActive = (mine.data ?? []).filter((t) => t.status !== 'DELIVERED')
  const loadingTrip = mineActive.find((t) => t.tripId === loadingId && t.status === 'ACCEPTED')
  const mineDone = (mine.data ?? []).filter((t) => t.status === 'DELIVERED').slice(0, 5)
  const openList = (open.data ?? []).filter((t) => !t.declined)
  const declinedList = (open.data ?? []).filter((t) => t.declined)
  if (!open.isPending && !mine.isPending && (open.data ?? []).length === 0 && (mine.data ?? []).length === 0) return null

  const btn = (label: string, icon: ReactNode, kind: Kind, t: HubTrip, tone: 'main' | 'quiet' = 'main') => {
    const busy = act.isPending && act.variables?.id === t.tripId && act.variables.kind === kind
    return (
      <button
        key={kind}
        type="button"
        disabled={act.isPending}
        onClick={() => act.mutate({ id: t.tripId, kind })}
        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition disabled:opacity-50 ${
          tone === 'main' ? 'flex-[2] bg-[#326318] text-white hover:bg-[#254d12]' : 'flex-1 border border-gray-300 text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700'
        }`}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : icon} {label}
      </button>
    )
  }

  /** Hàng chỉ rời điểm tập kết từ ngày cần xe (ngày kết thúc mở điểm tập kết) */
  const tooEarly = (t: HubTrip) => !!t.pickupDate && new Date(`${t.pickupDate.slice(0, 10)}T00:00:00`).getTime() > Date.now()

  const card = (t: HubTrip, actions: ReactNode) => {
    const st = STATUS[t.status] ?? STATUS.OPEN
    const step = STEP_AT[t.status]
    return (
      <article key={t.tripId} aria-label={`Chuyến xe ${t.tripNo}`} className="flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <header className="flex items-start justify-between gap-3 bg-[#326318] px-5 py-4 text-white">
          <div className="min-w-0">
            <p className="truncate text-xs text-white/75" title={t.campaignTitle}>{t.campaignTitle}</p>
            <h4 className="text-2xl font-black">Xe {t.tripNo}</h4>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm">
              <CalendarClock size={15} className="text-[#ffea79]" /> Cần xe ngày <b>{fmtDay(t.pickupDate)}</b>
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${st.cls}`}>{st.label}</span>
        </header>

        {/* 3 con số tài xế cần để quyết định */}
        <dl className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] divide-x divide-gray-100 border-b border-gray-100">
          <div className="px-5 py-3">
            <dt className="text-xs text-gray-500">{t.paidAt ? 'Bạn đã nhận' : 'Bạn nhận'}</dt>
            <dd className="text-2xl font-black tabular-nums text-[#326318]">{formatVnd(t.netAmount)}</dd>
            <dd className="text-[11px] text-gray-400">{t.serviceFeeRate > 0 ? `Cước ${formatVnd(t.feeAmount)}, phí ${Math.round(t.serviceFeeRate * 100)}%` : 'Đủ cước theo bảng giá xe tải'}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-xs text-gray-500">Chở</dt>
            <dd className="text-xl font-black tabular-nums text-gray-900">{formatKg(t.totalKg)}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-xs text-gray-500">Quãng đường</dt>
            <dd className="text-xl font-black tabular-nums text-gray-900">{t.routeKm != null ? `${Math.round(t.routeKm)} km` : '—'}</dd>
          </div>
        </dl>

        {/* Lộ trình: lấy hàng rồi lần lượt từng hub */}
        <ol aria-label="Lộ trình" className="flex-1 px-5 py-4">
          <Stop
            mark={<PackageCheck size={15} />}
            markCls="bg-amber-500"
            kicker="Lấy hàng"
            title={t.collectionSiteName || 'Điểm tập kết'}
            address={t.collectionSiteAddress}
            href={mapsTo(t.collectionSiteLatitude, t.collectionSiteLongitude)}
            last={t.stops.length === 0}
            footer={t.loadPhotoUrl ? (
              <a href={t.loadPhotoUrl} target="_blank" rel="noreferrer" aria-label="Xem ảnh hàng lên xe">
                <img src={t.loadPhotoUrl} alt="Ảnh hàng lên xe" className="h-14 w-14 rounded-xl border border-gray-200 object-cover" />
              </a>
            ) : null}
          />
          {t.stops.map((s, i) => (
            <Stop
              key={`${s.hubId}-${i}`}
              mark={i + 1}
              markCls="bg-[#326318]"
              kicker={`Giao ${formatKg(s.kg)}${s.orderCount ? ` · ${s.orderCount} đơn` : ''}`}
              title={s.hubName || 'Hub'}
              address={s.hubAddress}
              href={mapsTo(s.hubLatitude, s.hubLongitude)}
              last={i === t.stops.length - 1}
              footer={s.arrivedAt ? (
                <span className="flex items-center gap-2">
                  {s.photoUrl && (
                    <a href={s.photoUrl} target="_blank" rel="noreferrer" aria-label={`Xem ảnh giao tại ${s.hubName}`}>
                      <img src={s.photoUrl} alt={`Ảnh giao tại ${s.hubName}`} className="h-14 w-14 rounded-xl border border-gray-200 object-cover" />
                    </a>
                  )}
                  <span className="inline-flex w-fit items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    <Check size={13} /> Đã giao lúc {new Date(s.arrivedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </span>
              ) : t.status === 'IN_TRANSIT' && s.hubId != null ? (
                <PhotoConfirm
                  alt={`Ảnh giao hàng tại ${s.hubName}`}
                  captureLabel="Chụp ảnh hàng tại hub"
                  confirmLabel={`Đã giao tới ${s.hubName}`}
                  busy={arrive.isPending && arrive.variables?.hubId === s.hubId}
                  onConfirm={(photo) => arrive.mutate({ id: t.tripId, hubId: s.hubId as number, photo })}
                  onError={onError}
                />
              ) : null}
            />
          ))}
        </ol>

        <footer className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4">
          {step != null && (
            <ol aria-label="Tiến độ chuyến" className="flex items-center gap-2">
              {STEPS.map((label, i) => (
                <li key={label} className={`flex flex-1 items-center gap-1.5 border-t-4 pt-1.5 text-xs font-bold ${i < step ? 'border-[#326318] text-[#326318]' : 'border-gray-200 text-gray-400'}`}>
                  {i < step && <Check size={13} />} {label}
                </li>
              ))}
            </ol>
          )}
          {!t.confirmed && t.status !== 'DELIVERED' && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Kế hoạch dự kiến, CapNong xác nhận sau khi cân hàng tại điểm tập kết.</p>
          )}
          {t.status === 'ACCEPTED' && t.confirmed && !tooEarly(t) && (t.boxTotal ?? 0) > 0 && boxesLeft(t) === 0 && (
            <button type="button" onClick={() => setLoadingId(t.tripId)} className="text-left text-xs font-bold text-[#326318] underline">
              Đã nhận đủ {t.boxTotal} thùng · Xem lại hàng
            </button>
          )}
          {t.status === 'ACCEPTED' && t.confirmed && !tooEarly(t) && boxesLeft(t) === 0 && loadConfirm(t)}
          <div className="flex gap-2">{actions}</div>
        </footer>
      </article>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {loadingTrip && (
        <HubTripBoxesDialog
          t={loadingTrip}
          onClose={() => setLoadingId(null)}
          onChanged={refresh}
          onError={onError}
          confirm={loadConfirm(loadingTrip, () => setLoadingId(null))}
        />
      )}
      <div>
        <h3 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-gray-900">
          <Truck className="size-5 text-primary" /> Chuyến chở hàng ra hub
        </h3>
        <p className="text-sm text-gray-500">Lấy hàng ở điểm tập kết, chở tới các hub. Shipper tại hub giao tiếp tới nhà người mua.</p>
      </div>

      {mineActive.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="text-sm font-black text-gray-800">Chuyến của bạn ({mineActive.length})</p>
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {mineActive.map((t) =>
              card(
                t,
                <>
                  {t.status === 'ACCEPTED' && btn('Không nhận nữa', <Undo2 size={16} />, 'release', t, 'quiet')}
                  {t.status === 'ACCEPTED' &&
                    (t.confirmed && !tooEarly(t) && boxesLeft(t) === 0 ? null : t.confirmed && !tooEarly(t) ? (
                      <button type="button" onClick={() => setLoadingId(t.tripId)} className="inline-flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-[#326318] px-4 py-3 text-sm font-black text-white hover:bg-[#254d12]">
                        <PackageCheck size={16} /> Nhận hàng ({t.boxLoaded ?? 0}/{t.boxTotal ?? 0} thùng)
                      </button>
                    ) : (
                      <span className="flex flex-[2] items-center justify-center rounded-2xl bg-gray-200 px-3 text-center text-xs font-bold text-gray-500">
                        {tooEarly(t) ? `Lấy hàng từ ngày ${fmtDay(t.pickupDate)}` : 'Chờ chốt xe để lấy hàng'}
                      </span>
                    ))}
                  {t.status === 'IN_TRANSIT' && (
                    <span className="flex flex-1 items-center justify-center rounded-2xl bg-blue-50 px-3 py-2.5 text-center text-xs font-bold text-blue-900">
                      Đã giao {t.stops.filter((s) => s.arrivedAt).length}/{t.stops.length} hub. Tới hub nào bấm nút ở hub đó.
                    </span>
                  )}
                </>,
              ),
            )}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <p className="text-sm font-black text-gray-800">Chuyến đang chờ tài xế ({openList.length})</p>
        {open.isPending ? (
          <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
        ) : openList.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-5 text-center text-sm text-gray-400">Chưa có chuyến nào đang kêu gọi.</p>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {openList.map((t) =>
              card(
                t,
                <>
                  {btn('Không nhận', <Ban size={16} />, 'decline', t, 'quiet')}
                  {btn('Nhận chuyến', <CheckCircle2 size={16} />, 'accept', t)}
                </>,
              ),
            )}
          </div>
        )}
      </section>

      {declinedList.length > 0 && (
        <details className="rounded-2xl border border-gray-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-gray-600">Chuyến bạn không nhận ({declinedList.length})</summary>
          <ul className="divide-y divide-gray-100 border-t border-gray-100">
            {declinedList.map((t) => (
              <li key={t.tripId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0">
                  <b className="text-gray-900">Xe {t.tripNo} · {formatKg(t.totalKg)} · {formatVnd(t.netAmount)}</b>
                  <span className="block truncate text-xs text-gray-500">{t.stops.map((s) => s.hubName).join(', ')}</span>
                </span>
                <button
                  type="button"
                  disabled={act.isPending}
                  onClick={() => act.mutate({ id: t.tripId, kind: 'accept' })}
                  className="rounded-xl border border-[#326318] px-3 py-1.5 text-xs font-black text-[#326318] disabled:opacity-50"
                >
                  Nhận lại
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {mineDone.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white text-sm">
          {mineDone.map((t) => (
            <li key={t.tripId} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-bold text-gray-800">
                Xe {t.tripNo} · {t.campaignTitle}
              </span>
              <span className="text-xs font-bold text-emerald-700">Đã giao tới hub · {formatKg(t.totalKg)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Một điểm trên lộ trình, nối với điểm kế tiếp bằng đường kẻ dọc */
function Stop({ mark, markCls, kicker, title, address, href, last, footer }: {
  mark: ReactNode
  markCls: string
  kicker: string
  title: string
  address?: string | null
  href: string | null
  last: boolean
  footer?: ReactNode
}) {
  return (
    <li className="flex gap-3">
      <span className="flex flex-col items-center">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${markCls}`}>{mark}</span>
        {!last && <span className="my-1 w-0.5 flex-1 bg-gray-200" />}
      </span>
      <span className={`min-w-0 flex-1 ${last ? '' : 'pb-4'}`}>
        <span className="block text-xs font-bold text-gray-500">{kicker}</span>
        <span className="block text-sm font-black text-gray-900">{title}</span>
        {address && <span className="block text-xs text-gray-500">{address}</span>}
        {footer && <span className="mt-2 block">{footer}</span>}
      </span>
      {href && (
        <a href={href} target="_blank" rel="noreferrer" aria-label={`Chỉ đường tới ${title}`} className="inline-flex h-fit shrink-0 items-center gap-1 rounded-xl border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:border-[#326318] hover:text-[#326318]">
          <Navigation size={13} /> Chỉ đường
        </a>
      )}
    </li>
  )
}

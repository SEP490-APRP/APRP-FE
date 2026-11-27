import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, CalendarClock, Check, EyeOff, Loader2, Plus, Search, Sprout, Timer, X } from 'lucide-react'
import { adminCampaignService, type CampaignResponse, type CampaignStatus } from '@/services'
import { getErrorMessage } from '@/utils'

/**
 * Banner đầu trang chủ: Admin chọn các chiến dịch (tối đa 10, theo thứ tự) để làm banner tự chuyển,
 * và đặt số giây giữa hai lần chuyển. Mỗi chiến dịch dùng banner đã tuỳ chỉnh ở tab "Banner trang chủ"
 * của chiến dịch đó (ảnh tải lên hoặc mẫu tự dựng từ ảnh bìa).
 */

const MAX = 10
const MIN_SEC = 3
const MAX_SEC = 30
const QUICK_SECONDS = [4, 6, 8, 10]

const STATUS_LABEL: Record<CampaignStatus, string> = {
  DRAFT: 'Chuẩn bị',
  ACTIVE: 'Đang mở đặt trước',
  THRESHOLD_MET: 'Đủ ngưỡng',
  FULFILLING: 'Đang gom hàng',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã huỷ',
}

/** Người dùng chỉ thấy banner khi chiến dịch đã đăng lời kêu gọi hoặc đang mở bán / gom hàng */
const visibleToUsers = (c: CampaignResponse) =>
  (c.status === 'DRAFT' && !!c.callPostedAt) || c.status === 'ACTIVE' || c.status === 'THRESHOLD_MET' || c.status === 'FULFILLING'

const canPick = (c: CampaignResponse) => c.status !== 'CANCELLED' && c.status !== 'COMPLETED'

/** Mốc thời gian sắp tới gần nhất của chiến dịch (đăng kêu gọi, chốt góp hàng, chốt đơn, bắt đầu, kết thúc) */
type Milestone = { label: string; at: number }
function nextMilestone(c: CampaignResponse, now = Date.now()): Milestone | null {
  const day = (d?: string | null) => (d ? `${d.slice(0, 10)}T00:00:00` : null)
  const marks: [string, string | null | undefined][] = [
    ['Đăng kêu gọi nhà vườn', c.callPostedAt ? null : c.publishAt],
    ['Chốt góp hàng', c.farmCutoffAt],
    ['Chốt đơn đặt trước', c.cutoffAt],
    ['Bắt đầu mở điểm tập kết', day(c.startDate)],
    ['Kết thúc mở điểm tập kết', day(c.endDate)],
    ['Kết thúc chiến dịch', day(c.finishDate)],
  ]
  let best: Milestone | null = null
  for (const [label, v] of marks) {
    const at = v ? new Date(v).getTime() : NaN
    if (Number.isFinite(at) && at > now && (!best || at < best.at)) best = { label, at }
  }
  return best
}

const pad2 = (n: number) => String(n).padStart(2, '0')
function milestoneText(m: Milestone | null, now = Date.now()) {
  if (!m) return 'Không còn mốc sắp tới'
  const d = new Date(m.at)
  const hours = Math.floor((m.at - now) / 3_600_000)
  const left = hours >= 48 ? `còn ${Math.floor(hours / 24)} ngày` : hours >= 1 ? `còn ${hours} giờ` : 'sắp tới'
  return `${m.label} ${pad2(d.getHours())}:${pad2(d.getMinutes())} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} · ${left}`
}

/** Sắp theo mốc gần nhất trước; chiến dịch không còn mốc nào thì xếp cuối */
const byUpcoming = (a: CampaignResponse, b: CampaignResponse) =>
  (nextMilestone(a)?.at ?? Infinity) - (nextMilestone(b)?.at ?? Infinity)

const thumbOf = (c: CampaignResponse) => (c.bannerMode === 'IMAGE' && c.bannerImageUrl) || c.coverImageUrl || c.bannerImageUrl || ''

export const homeBannerKey = ['admin-home-banners'] as const

export default function HomeBannerDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (count: number) => void }) {
  const qc = useQueryClient()
  const config = useQuery({ queryKey: homeBannerKey, queryFn: () => adminCampaignService.homeBanners() })
  const all = useQuery({ queryKey: ['admin-campaigns-home-pick'], queryFn: () => adminCampaignService.list(undefined, 0, 200) })

  const [picked, setPicked] = useState<CampaignResponse[] | null>(null)
  const [seconds, setSeconds] = useState('6')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'upcoming' | 'newest'>('upcoming')

  // Nạp cấu hình đang lưu một lần
  useEffect(() => {
    if (config.data && picked === null) {
      setPicked(config.data.campaigns)
      setSeconds(String(config.data.intervalSeconds || 6))
    }
  }, [config.data, picked])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const list = picked ?? []
  const pickedIds = new Set(list.map((c) => c.campaignId))
  const options = useMemo(() => {
    const kw = search.trim().toLowerCase()
    return (all.data?.content ?? [])
      .filter((c) => canPick(c) && !pickedIds.has(c.campaignId))
      .filter((c) => !kw || c.title.toLowerCase().includes(kw) || c.code.toLowerCase().includes(kw))
      .sort(sort === 'upcoming' ? byUpcoming : (a, b) => b.campaignId - a.campaignId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all.data, search, picked, sort])

  const sec = Number(seconds)
  const secError = !Number.isInteger(sec) || sec < MIN_SEC || sec > MAX_SEC ? `Nhập số giây từ ${MIN_SEC} tới ${MAX_SEC}` : ''

  const move = (i: number, d: -1 | 1) =>
    setPicked((s) => {
      const a = [...(s ?? [])]
      const j = i + d
      if (j < 0 || j >= a.length) return a
      ;[a[i], a[j]] = [a[j], a[i]]
      return a
    })
  const remove = (id: number) => setPicked((s) => (s ?? []).filter((c) => c.campaignId !== id))
  const add = (c: CampaignResponse) => setPicked((s) => ((s ?? []).length >= MAX ? s : [...(s ?? []), c]))

  const save = useMutation({
    mutationFn: () => adminCampaignService.saveHomeBanners(sec, list.map((c) => c.campaignId)),
    onSuccess: (res) => {
      qc.setQueryData(homeBannerKey, res)
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      onSaved(res.campaigns.length)
    },
  })

  const hiddenCount = list.filter((c) => !visibleToUsers(c)).length

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="home-banner-title" onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h3 id="home-banner-title" className="text-lg font-black text-gray-900">Banner trang chủ</h3>
            <p className="text-xs text-gray-500">
              Chọn chiến dịch để hiện ở banner lớn đầu trang chủ. Các banner tự chuyển theo thứ tự bên trái.
            </p>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100"><X size={18} /></button>
        </div>

        {config.isPending || all.isPending ? (
          <div className="flex h-60 items-center justify-center text-gray-400"><Loader2 className="animate-spin" /></div>
        ) : config.isError || all.isError ? (
          <p className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {getErrorMessage(config.error ?? all.error, 'Không tải được cấu hình banner trang chủ.')}
          </p>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
            {/* Đang gắn */}
            <section className="flex min-h-0 flex-col border-b border-gray-100 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between px-5 pb-2 pt-4">
                <h4 className="text-sm font-black text-gray-900">Đang gắn ({list.length}/{MAX})</h4>
                {list.length > 0 && (
                  <div className="flex items-center gap-3">
                    {list.length > 1 && (
                      <button type="button" onClick={() => setPicked((s) => [...(s ?? [])].sort(byUpcoming))}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#326318] hover:underline">
                        <CalendarClock size={13} /> Xếp theo mốc sắp tới
                      </button>
                    )}
                    <button type="button" onClick={() => setPicked([])} className="text-xs font-bold text-gray-500 hover:text-red-600">Bỏ hết</button>
                  </div>
                )}
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-5 pb-4">
                {list.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                    Chưa gắn chiến dịch nào. Trang chủ đang dùng banner chiến dịch chung.
                  </p>
                ) : (
                  list.map((c, i) => (
                    <div key={c.campaignId} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-2.5">
                      <span className="w-5 shrink-0 text-center text-sm font-black text-[#326318]">{i + 1}</span>
                      <Thumb url={thumbOf(c)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-900">{c.title}</p>
                        <p className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                          <span>{STATUS_LABEL[c.status]}</span>
                          <span>{c.bannerMode === 'IMAGE' && c.bannerImageUrl ? 'Ảnh banner tải lên' : 'Mẫu tự dựng'}</span>
                          <span className="w-full truncate text-[#326318]">{milestoneText(nextMilestone(c))}</span>
                          {!visibleToUsers(c) && (
                            <span className="inline-flex items-center gap-1 font-bold text-amber-700"><EyeOff size={12} /> Chưa hiện cho người dùng</span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <IconBtn label="Lên trên" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={15} /></IconBtn>
                        <IconBtn label="Xuống dưới" disabled={i === list.length - 1} onClick={() => move(i, 1)}><ArrowDown size={15} /></IconBtn>
                        <IconBtn label="Bỏ khỏi banner" onClick={() => remove(c.campaignId)} danger><X size={15} /></IconBtn>
                      </div>
                    </div>
                  ))
                )}
                {hiddenCount > 0 && (
                  <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                    Chiến dịch "Chưa hiện cho người dùng" sẽ tự lên banner khi đăng lời kêu gọi nhà vườn hoặc mở đặt trước.
                  </p>
                )}
              </div>
            </section>

            {/* Chọn thêm */}
            <section className="flex min-h-0 flex-col">
              <div className="px-5 pb-2 pt-4">
                <h4 className="text-sm font-black text-gray-900">Chọn thêm chiến dịch</h4>
                <label className="relative mt-2 block">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc mã chiến dịch"
                    className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm" />
                </label>
                <div className="mt-2 flex items-center gap-2" role="radiogroup" aria-label="Sắp xếp">
                  <span className="text-xs font-bold text-gray-500">Sắp xếp:</span>
                  {([['upcoming', 'Mốc sắp tới gần nhất'], ['newest', 'Mới tạo']] as const).map(([id, label]) => (
                    <button key={id} type="button" role="radio" aria-checked={sort === id} onClick={() => setSort(id)}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${sort === id ? 'bg-[#326318] text-white' : 'bg-[#f4f7f1] text-[#326318]'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-5 pb-4">
                {options.length === 0 ? (
                  <p className="p-6 text-center text-sm text-gray-500">Không còn chiến dịch nào để chọn.</p>
                ) : (
                  options.map((c) => (
                    <div key={c.campaignId} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-[#f7faf4] p-2.5">
                      <Thumb url={thumbOf(c)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-900">{c.title}</p>
                        <p className="truncate text-xs text-gray-500">{c.code} · {STATUS_LABEL[c.status]}</p>
                        <p className={`truncate text-xs font-medium ${nextMilestone(c) ? 'text-[#326318]' : 'text-gray-400'}`}>{milestoneText(nextMilestone(c))}</p>
                      </div>
                      <button type="button" disabled={list.length >= MAX} onClick={() => add(c)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#326318] px-2.5 py-1.5 text-xs font-bold text-[#326318] hover:bg-[#326318] hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
                        <Plus size={14} /> Gắn
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* Số giây + lưu */}
        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-700"><Timer size={15} /> Tự chuyển banner sau</span>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-xl border border-gray-200 bg-white pr-3">
                <input type="number" min={MIN_SEC} max={MAX_SEC} value={seconds} onChange={(e) => setSeconds(e.target.value)}
                  aria-label="Số giây tự chuyển" aria-invalid={!!secError}
                  className="w-16 rounded-xl px-3 py-2 text-sm font-bold tabular-nums outline-none" />
                <span className="text-sm text-gray-500">giây</span>
              </div>
              {QUICK_SECONDS.map((s) => (
                <button key={s} type="button" onClick={() => setSeconds(String(s))}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${sec === s ? 'bg-[#326318] text-white' : 'bg-white text-[#326318] border border-gray-200'}`}>
                  {s} giây
                </button>
              ))}
            </div>
            {secError && <span className="text-xs font-medium text-red-600">{secError}</span>}
            {save.isError && <span className="text-xs font-medium text-red-600">{getErrorMessage(save.error, 'Lưu banner không thành công.')}</span>}
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">Đóng</button>
            <button type="button" disabled={!!secError || save.isPending || picked === null} onClick={() => save.mutate()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#326318] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#254d12] disabled:opacity-50">
              {save.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Lưu banner
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Thumb({ url }: { url: string }) {
  return (
    <div className="relative h-11 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-[#eef5e7]">
      {url ? <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Sprout size={18} className="absolute inset-0 m-auto text-[#326318]" />}
    </div>
  )
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick}
      className={`rounded-lg p-1.5 text-gray-500 disabled:opacity-30 ${danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-gray-100 hover:text-gray-900'}`}>
      {children}
    </button>
  )
}

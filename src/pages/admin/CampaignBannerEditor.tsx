import { useRef, useState, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Loader2, RotateCcw, Save, Trash2 } from 'lucide-react'
import {
  BANNER_KEYFRAMES,
  BANNER_THEMES,
  BannerCornerCard,
  BannerPill,
  BannerPopupCard,
  bannerOf,
  defaultBanner,
  depositPctOf,
  thresholdPct,
  useCountdown,
  type BannerConfig,
  type BannerTheme,
} from '@/features/campaign/components/CampaignBanner'
import { formatKg, formatVnd, timeLeftLabel } from '@/features/campaign/utils'
import { adminCampaignService, uploadService, type CampaignResponse } from '@/services'
import { getErrorMessage } from '@/utils'
import SpotlightTip from '@/components/common/SpotlightTip'

/**
 * Admin tuỳ chỉnh banner chiến dịch hiện ở trang chủ (popup lớn, thẻ góc, viên thuốc).
 * Mặc định banner dựng từ thông tin chiến dịch; Admin sửa chữ, đổi màu, đổi ảnh, hoặc tải nguyên ảnh banner riêng.
 */
export default function CampaignBannerEditor({
  c,
  onNotice,
  guide = false,
  onGuideDone,
}: {
  c: CampaignResponse
  onNotice: (n: { ok: boolean; text: string }) => void
  /** Đang theo chỉ dẫn sau khi mở bán: chỉ vào công tắc hiện ở trang chủ */
  guide?: boolean
  onGuideDone?: () => void
}) {
  const qc = useQueryClient()
  const [b, setB] = useState<BannerConfig>(() => bannerOf(c))
  const [preview, setPreview] = useState<'popup' | 'card' | 'pill'>('popup')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const countdown = useCountdown(c.cutoffAt)
  const locked = c.status === 'CANCELLED' || c.status === 'COMPLETED'
  const set = <K extends keyof BannerConfig>(k: K, v: BannerConfig[K]) => setB((x) => ({ ...x, [k]: v }))

  const save = useMutation({
    mutationFn: () =>
      adminCampaignService.updateBanner(c.campaignId, {
        mode: b.mode,
        theme: b.theme,
        headline: b.headline,
        subline: b.subline,
        badge: b.badge,
        ctaText: b.ctaText,
        imageUrl: b.imageUrl || undefined,
        showOnHome: b.showOnHome,
      }),
    onSuccess: (r) => {
      qc.setQueryData(['admin-campaign', c.campaignId], r)
      qc.invalidateQueries({ queryKey: ['admin-campaigns'] })
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      onNotice({ ok: true, text: b.showOnHome ? 'Đã lưu banner. Người xem trang chủ sẽ thấy popup mới một lần.' : 'Đã lưu banner (đang tắt hiện ở trang chủ).' })
    },
    onError: (e) => onNotice({ ok: false, text: getErrorMessage(e, 'Không lưu được banner.') }),
  })

  const upload = async (f?: File) => {
    if (!f) return
    setUploading(true)
    try {
      const url = (await uploadService.uploadImage(f, 'campaign-banner')).result?.url
      if (url) set('imageUrl', url)
    } catch (e) {
      onNotice({ ok: false, text: getErrorMessage(e, 'Không tải được ảnh lên.') })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const pct = thresholdPct(c)
  const headlineIdeas = [
    c.title,
    `Giải cứu ${formatKg(c.targetVolumeKg)}${c.categoryName ? ` ${c.categoryName.toLowerCase()}` : ''}`,
    `${formatVnd(c.rescuePricePerKg)}/kg · đặt trước ngay`,
  ]
  const badgeIdeas = [`CHỈ CỌC ${depositPctOf(c)}%`, timeLeftLabel(c.cutoffAt).toUpperCase(), `ĐÃ ĐẶT ${pct}%`]
  const imageMissing = b.mode === 'IMAGE' && !b.imageUrl
  const noCta = (className: string, children: ReactNode) => <span className={className}>{children}</span>

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <style>{BANNER_KEYFRAMES}</style>

      {/* ── Form ── */}
      <div className="flex min-w-0 flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-gray-900">Banner trang chủ</h3>
            <p className="mt-0.5 max-w-prose text-sm text-gray-500">
              Hiện thành popup khi khách mở trang chủ, đóng lại thì thu về góc phải. Chỉ hiện khi chiến dịch đang nhận đặt trước.
            </p>
          </div>
          <label id="banner-show-on-home" className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-gray-800">
            <input type="checkbox" className="peer sr-only" checked={b.showOnHome} onChange={(e) => set('showOnHome', e.target.checked)} disabled={locked} />
            <span className="relative h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-[#326318] peer-focus-visible:ring-2 peer-focus-visible:ring-amber-400 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
            Hiện ở trang chủ
          </label>
        </div>

        {guide && !locked && !b.showOnHome && (
          <SpotlightTip
            targetId="banner-show-on-home"
            eyebrow="Bước cuối"
            title="Bật hiện ở trang chủ"
            text="Banner đang tắt nên người mua chưa thấy. Bật công tắc này, chỉnh ảnh và lời kêu gọi rồi bấm Lưu banner."
            actionLabel="Bật ngay"
            onAction={() => { set('showOnHome', true); onGuideDone?.() }}
            onClose={() => onGuideDone?.()}
          />
        )}

        {locked && <p className="rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-600">Chiến dịch đã kết thúc nên không sửa banner được nữa.</p>}
        {!locked && c.status !== 'ACTIVE' && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Chiến dịch chưa (hoặc không còn) nhận đặt trước. Banner được lưu sẵn và chỉ hiện ở trang chủ khi chiến dịch đang mở đặt trước.
          </p>
        )}

        <fieldset disabled={locked} className="flex flex-col gap-5 disabled:opacity-60">
          {/* Kiểu banner */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1" role="radiogroup" aria-label="Kiểu banner">
            {([['AUTO', 'Tạo từ thông tin chiến dịch'], ['IMAGE', 'Dùng ảnh banner riêng']] as const).map(([m, label]) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={b.mode === m}
                onClick={() => set('mode', m)}
                className={`rounded-lg px-3 py-2 text-sm font-bold ${b.mode === m ? 'bg-white text-[#326318] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Màu */}
          <Field label="Màu banner">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(BANNER_THEMES) as BannerTheme[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set('theme', k)}
                  aria-pressed={b.theme === k}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold ${b.theme === k ? 'border-[#326318] text-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <span className="size-5 rounded-full" style={{ background: BANNER_THEMES[k].bg }} />
                  {BANNER_THEMES[k].name}
                </button>
              ))}
            </div>
          </Field>

          {/* Ảnh */}
          <Field
            label={b.mode === 'IMAGE' ? 'Ảnh banner' : 'Ảnh minh hoạ'}
            hint={b.mode === 'IMAGE' ? 'Ảnh dọc tỉ lệ 4:5 (vd 1040 × 1300) hiển thị đẹp nhất. Chữ trong ảnh nên nằm giữa, tránh sát mép.' : 'Bỏ trống thì dùng ảnh bìa chiến dịch (hoặc rổ rau mặc định).'}
          >
            <div className="flex flex-wrap items-center gap-3">
              {b.imageUrl ? (
                <img src={b.imageUrl} alt="" className="h-20 w-20 rounded-xl border border-gray-200 object-cover" />
              ) : b.mode === 'AUTO' && c.coverImageUrl ? (
                <div className="relative h-20 w-20">
                  <img src={c.coverImageUrl} alt="" className="h-20 w-20 rounded-xl border border-gray-200 object-cover opacity-70" />
                  <span className="absolute inset-x-1 bottom-1 rounded bg-white/90 text-center text-[10px] font-bold text-gray-700">Ảnh bìa</span>
                </div>
              ) : (
                <div className={`grid h-20 w-20 place-items-center rounded-xl border-2 border-dashed text-[11px] font-semibold ${imageMissing ? 'border-red-300 text-red-500' : 'border-gray-300 text-gray-400'}`}>
                  {b.mode === 'IMAGE' ? 'Chưa có ảnh' : 'Ảnh bìa'}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
              <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50">
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />} {b.imageUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
              </button>
              {b.imageUrl && (
                <button type="button" onClick={() => set('imageUrl', '')} className="inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-bold text-red-600 hover:bg-red-50">
                  <Trash2 size={15} /> Bỏ ảnh
                </button>
              )}
            </div>
          </Field>

          <Field label="Tiêu đề" hint={b.mode === 'IMAGE' ? 'Dùng cho thẻ góc và người dùng trình đọc màn hình.' : undefined}>
            <input value={b.headline} maxLength={200} onChange={(e) => set('headline', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            <Ideas items={headlineIdeas} onPick={(v) => set('headline', v)} />
          </Field>

          {b.mode === 'AUTO' && (
            <>
              <Field label="Dòng phụ">
                <input value={b.subline} maxLength={300} onChange={(e) => set('subline', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Huy hiệu" hint="Từ cuối hiện to. Bỏ trống thì ẩn huy hiệu.">
                  <input value={b.badge} maxLength={60} onChange={(e) => set('badge', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                  <Ideas items={badgeIdeas} onPick={(v) => set('badge', v)} />
                </Field>
                <Field label="Chữ trên nút">
                  <input value={b.ctaText} maxLength={60} onChange={(e) => set('ctaText', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                </Field>
              </div>
            </>
          )}
          {b.mode === 'IMAGE' && (
            <Field label="Chữ trên nút">
              <input value={b.ctaText} maxLength={60} onChange={(e) => set('ctaText', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            </Field>
          )}

          <p className="rounded-xl bg-[#f1f8ec] px-3 py-2 text-xs text-[#254b12]">
            Giá {formatVnd(c.rescuePricePerKg)}/kg, % đã đặt ({pct}%), cọc {depositPctOf(c)}% và đồng hồ đếm ngược luôn lấy trực tiếp từ chiến dịch nên tự cập nhật.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={save.isPending || imageMissing || !b.headline.trim()}
              onClick={() => save.mutate()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#326318] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#254d12] disabled:opacity-50"
            >
              {save.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Lưu banner
            </button>
            <button
              type="button"
              onClick={() => setB({ ...defaultBanner(c), theme: b.theme, showOnHome: b.showOnHome })}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-800 hover:bg-gray-50"
            >
              <RotateCcw size={16} /> Tạo lại từ thông tin chiến dịch
            </button>
          </div>
          {imageMissing && <p className="text-xs font-semibold text-red-600">Tải ảnh banner lên trước khi lưu.</p>}
          {c.bannerUpdatedAt && <p className="text-xs text-gray-400">Lưu lần cuối {new Date(c.bannerUpdatedAt).toLocaleString('vi-VN')}</p>}
        </fieldset>
      </div>

      {/* ── Xem trước ── */}
      <div className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1 text-sm font-bold">
          {([['popup', 'Popup'], ['card', 'Thẻ góc'], ['pill', 'Thu nhỏ']] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setPreview(k)} className={`flex-1 rounded-lg py-1.5 ${preview === k ? 'bg-white text-[#326318] shadow-sm' : 'text-gray-500'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative grid min-h-[560px] place-items-center overflow-hidden rounded-2xl bg-[#2b3324] p-6" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)', backgroundSize: '14px 14px' }}>
          {!b.showOnHome && <span className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-gray-700">Đang tắt ở trang chủ</span>}
          {preview === 'popup' && (
            <div key={`${b.mode}-${b.theme}`} className="cs-pop w-full max-w-[340px]">
              {imageMissing ? <EmptyImage /> : <BannerPopupCard c={c} b={b} countdown={countdown} cta={noCta} onClose={() => setPreview('card')} />}
            </div>
          )}
          {preview === 'card' && (
            <div className="cs-up w-full max-w-[310px] self-end justify-self-end">
              {imageMissing ? <EmptyImage /> : <BannerCornerCard c={c} b={b} countdown={countdown} cta={noCta} onMinimize={() => setPreview('pill')} />}
            </div>
          )}
          {preview === 'pill' && (
            <div className="cs-bub self-end justify-self-end">
              <BannerPill c={c} b={b} countdown={countdown} onClick={() => setPreview('card')} />
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500">Bấm X trên popup hoặc dấu trừ trên thẻ để xem bước tiếp theo, giống khách thấy ở trang chủ.</p>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-gray-800">{label}</span>
      {children}
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </div>
  )
}

function Ideas({ items, onPick }: { items: string[]; onPick: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((v) => (
        <button key={v} type="button" onClick={() => onPick(v)} className="max-w-full truncate rounded-full bg-[#f1f8ec] px-2.5 py-1 text-[11px] font-semibold text-[#326318] hover:bg-[#e3f1da]">
          {v}
        </button>
      ))}
    </div>
  )
}

function EmptyImage() {
  return <div className="grid h-60 place-items-center rounded-2xl border-2 border-dashed border-white/30 text-sm font-semibold text-white/70">Tải ảnh banner lên để xem trước</div>
}

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ArrowRight, Camera, Sprout, Utensils, type LucideIcon } from 'lucide-react'
import aiVisionImg from '@/assets/ai-vision.jpg'
import aiMealImg from '@/assets/ai-meal.jpg'
import aiFarmerImg from '@/assets/ai-farmer.jpg'
import { money, products, type Product } from '@/mocks/catalog'
import { discountPercent } from '@/features/product'
import { cn } from '@/utils'

/**
 * Section "Công nghệ AI" – thiết kế lại 03/10/2026.
 *
 * Thay 3 card giống hệt nhau + popup bằng MỘT sân khấu ảnh lớn và một
 * "phiếu kiểm định" giấy kraft (như nhãn buộc vào bó rau ngoài chợ). Người dùng
 * thử AI ngay tại chỗ: đổi mẫu nông sản thì phiếu đổi theo, không cần mở popup.
 * Số liệu trên phiếu quét lấy từ catalog nên khớp với giá đang bán.
 */

type TabId = 'vision' | 'chef' | 'copilot'

type Tab = {
  id: TabId
  icon: LucideIcon
  title: string
  description: string
  image: string
  imageAlt: string
  cta: { label: string; href: string }
}

const TABS: Tab[] = [
  {
    id: 'vision',
    icon: Camera,
    title: 'Quét độ tươi',
    description: 'Chụp một tấm ảnh, AI chấm độ tươi và đề xuất giá giải cứu.',
    image: aiVisionImg,
    imageAlt: 'Rau củ trên thớt đá với khung quét của AI',
    cta: { label: 'Xem nông sản đang giảm giá', href: '#/nong-san-tuoi' },
  },
  {
    id: 'chef',
    icon: Utensils,
    title: 'Gợi ý món ăn',
    description: 'Lên thực đơn từ đúng những rau củ đang có trong giỏ.',
    image: aiMealImg,
    imageAlt: 'Đĩa salad rau củ nhiều màu',
    cta: { label: 'Xem combo nấu ăn trong tuần', href: '#/combo-tui-mu' },
  },
  {
    id: 'copilot',
    icon: Sprout,
    title: 'Trợ lý nhà vườn',
    description: 'Chụp một ảnh tại ruộng, tin đăng bán được soạn sẵn.',
    image: aiFarmerImg,
    imageAlt: 'Đôi tay nông dân ôm bó cà rốt và củ dền vừa nhổ',
    cta: { label: 'Mở gian hàng nhà vườn', href: '#/dang-ky?role=shop' },
  },
]

// Mẫu quét lấy thẳng từ catalog để giá trên phiếu khớp với giá bán
const SCAN_SAMPLES: Product[] = ['carrot', 'cabbage', 'tomato']
  .map((id) => products.find((p) => p.id === id))
  .filter((p): p is Product => Boolean(p))

const SHORT_NAME: Record<string, string> = {
  carrot: 'Cà rốt',
  cabbage: 'Bắp cải',
  tomato: 'Cà chua bi',
}

const MENUS = [
  {
    id: 'eatclean',
    label: 'Ăn sạch',
    dish: 'Salad rau củ nướng sốt mè',
    kcal: 420,
    minutes: 15,
    cost: '18.000đ / phần',
    uses: 'Cà rốt, củ dền, cải bó xôi',
  },
  {
    id: 'family',
    label: 'Cơm nhà',
    dish: 'Canh củ hầm và cải xào tỏi',
    kcal: 650,
    minutes: 20,
    cost: '15.000đ / người',
    uses: 'Khoai lang, bí đỏ, bắp cải',
  },
  {
    id: 'detox',
    label: 'Nước ép',
    dish: 'Nước ép cần tây cà rốt',
    kcal: 180,
    minutes: 5,
    cost: '12.000đ / ly',
    uses: 'Cà rốt, cà chua bi',
  },
] as const
type MenuId = (typeof MENUS)[number]['id']

const COPILOT_STEPS = [
  'Chụp ảnh nông sản ngay tại ruộng',
  'AI nhận diện loại, ước lượng khối lượng và đề xuất giá',
  'Duyệt tin đăng, shipper đến lấy hàng',
]

/* ------------------------------------------------------------------ */

/** Một dòng trên phiếu: nhãn trái, giá trị phải, nối bằng dấu chấm như hóa đơn chợ. */
function TagRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <dt className="shrink-0 text-[#6b5434]">{label}</dt>
      <span aria-hidden className="mb-1 min-w-4 flex-1 border-b border-dotted border-[#b99d70]" />
      <dd className="text-right font-bold text-[#2b2113]">{children}</dd>
    </div>
  )
}

/** Phiếu kiểm định giấy kraft: điểm nhấn thị giác duy nhất của section. */
function KraftTag({
  heading,
  title,
  children,
  footer,
}: {
  heading: string
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="relative w-full max-w-sm rounded-[18px] bg-[#efe2c6] px-6 pb-5 pt-8 text-[#2b2113] shadow-[0_18px_40px_-12px_rgb(0_0_0/0.6)] lg:-rotate-2 motion-reduce:rotate-0">
      {/* Lỗ xỏ dây của nhãn */}
      <span
        aria-hidden
        className="absolute left-1/2 top-3 h-3 w-3 -translate-x-1/2 rounded-full bg-[#142a0e] ring-[3px] ring-[#d9c69f]"
      />
      <p className="text-center text-caption font-semibold text-[#8a4e1d]">{heading}</p>
      <p className="mt-1 text-center text-lg font-extrabold leading-snug">{title}</p>
      <div aria-hidden className="my-4 border-t-2 border-dashed border-[#c9b48c]" />
      <dl className="flex flex-col gap-2.5 tabular-nums">{children}</dl>
      {footer}
    </div>
  )
}

function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.id === value}
          onClick={() => onChange(o.id)}
          className={cn(
            'h-10 rounded-full border px-4 text-sm font-semibold transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#142a0e]',
            o.id === value
              ? 'border-[#efe2c6] bg-[#efe2c6] text-[#2b2113]'
              : 'border-white/25 text-white/85 hover:border-white/60 hover:text-white',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function ToolControls({
  tab,
  sampleId,
  menuId,
  onSample,
  onMenu,
  cta,
}: {
  tab: TabId
  sampleId: string
  menuId: MenuId
  onSample: (id: string) => void
  onMenu: (id: MenuId) => void
  cta: Tab['cta']
}) {
  return (
    <div className="flex flex-col gap-6">
      {tab === 'vision' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-white/70">Chọn một mẫu để thử quét:</p>
          <Chips
            label="Mẫu nông sản"
            options={SCAN_SAMPLES.map((p) => ({ id: p.id, label: SHORT_NAME[p.id] ?? p.name }))}
            value={sampleId}
            onChange={onSample}
          />
        </div>
      )}
      {tab === 'chef' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-white/70">Hôm nay bạn muốn ăn gì?</p>
          <Chips label="Kiểu bữa ăn" options={MENUS} value={menuId} onChange={onMenu} />
        </div>
      )}
      {tab === 'copilot' && (
        // Đây thật sự là các bước theo thứ tự nên mới đánh số
        <ol className="flex flex-col gap-3">
          {COPILOT_STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-sm leading-relaxed text-white/85">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/30 text-caption font-bold tabular-nums">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      )}
      <a
        href={cta.href}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-sun-300 px-6 text-sm font-bold text-[#1a3a0c] transition-colors hover:bg-[#fff1a8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#142a0e] sm:w-fit"
      >
        {cta.label}
        <ArrowRight size={16} aria-hidden />
      </a>
    </div>
  )
}

/* ------------------------------------------------------------------ */

interface AiFeaturesProps {
  /** Giữ để tương thích với Home; section mới không còn popup "chưa kết nối". */
  onInfo?: (title: string) => void
}

export default function AiFeatures(_props: AiFeaturesProps) {
  const [tab, setTab] = useState<TabId>('vision')
  const [sampleId, setSampleId] = useState(SCAN_SAMPLES[0]?.id ?? '')
  const [menuId, setMenuId] = useState<MenuId>('eatclean')
  // Tăng mỗi lần đổi mẫu để chạy lại đường quét đúng 1 lần (chuyển động do người dùng kích hoạt)
  const [scanKey, setScanKey] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const baseId = useId()

  const active = TABS.find((t) => t.id === tab) ?? TABS[0]
  const sample = SCAN_SAMPLES.find((p) => p.id === sampleId) ?? SCAN_SAMPLES[0]
  const menu = MENUS.find((m) => m.id === menuId) ?? MENUS[0]

  const selectTab = (index: number, focus = false) => {
    const i = (index + TABS.length) % TABS.length
    setTab(TABS[i].id)
    setScanKey((k) => k + 1)
    if (focus) tabRefs.current[i]?.focus()
  }

  const pickSample = (id: string) => {
    setSampleId(id)
    setScanKey((k) => k + 1)
  }

  // Điều hướng bàn phím chuẩn WAI-ARIA cho tablist
  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowRight: index + 1,
      ArrowUp: index - 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: TABS.length - 1,
    }
    if (e.key in target) {
      e.preventDefault()
      selectTab(target[e.key], true)
    }
  }

  const controls = (
    <ToolControls
      tab={tab}
      sampleId={sample?.id ?? ''}
      menuId={menuId}
      onSample={pickSample}
      onMenu={setMenuId}
      cta={active.cta}
    />
  )

  return (
    <section
      id="cong-nghe-ai"
      aria-labelledby="ai-title"
      className="relative overflow-hidden bg-[#142a0e] py-16 text-white sm:py-20 lg:py-28"
    >
      {/* Quầng sáng mờ phía sau ảnh, chỉ để tách ảnh khỏi nền */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/4 h-[36rem] w-[36rem] rounded-full bg-[#326318]/35 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-x-16 lg:px-8 xl:px-12">
        {/* ---------- Cột trái: tiêu đề, chọn công cụ, điều khiển ---------- */}
        <div className="flex flex-col gap-8 lg:col-span-5">
          <header className="flex flex-col gap-4">
            <h2
              id="ai-title"
              className="text-balance text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-5xl"
            >
              AI nhìn thấy cái ngon mà vẻ ngoài che mất
            </h2>
            <p className="max-w-md text-base leading-relaxed text-white/75">
              Ba công cụ giúp bạn mua đúng giá, nấu đúng món, và giúp nhà vườn bán hết mùa vụ.
            </p>
          </header>

          <div
            role="tablist"
            aria-label="Công cụ AI"
            className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-1"
          >
            {TABS.map((t, i) => {
              const selected = t.id === tab
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[i] = el
                  }}
                  id={`${baseId}-tab-${t.id}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectTab(i)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                  className={cn(
                    'flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3 text-center transition-colors',
                    'lg:flex-row lg:items-start lg:justify-start lg:gap-4 lg:rounded-none lg:border-l-2 lg:px-5 lg:py-4 lg:text-left',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sun-300',
                    selected
                      ? 'bg-white/10 text-white lg:border-[#efe2c6] lg:bg-transparent'
                      : 'text-white/65 hover:bg-white/5 hover:text-white lg:border-white/15 lg:hover:bg-transparent',
                  )}
                >
                  <Icon
                    size={20}
                    aria-hidden
                    className={cn('shrink-0 lg:mt-1', selected && 'text-sun-300')}
                  />
                  <span className="flex flex-col gap-1">
                    <span className="text-sm font-bold sm:text-base lg:text-lg">{t.title}</span>
                    <span
                      className={cn(
                        'hidden text-sm leading-relaxed lg:block',
                        selected ? 'text-white/80' : 'text-white/55',
                      )}
                    >
                      {t.description}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {/* Desktop: điều khiển nằm dưới tab. Mobile: nằm dưới phiếu (xem cuối section) */}
          <div className="hidden lg:block">{controls}</div>
        </div>

        {/* ---------- Cột phải: ảnh + phiếu kraft ---------- */}
        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${tab}`}
          className="lg:col-span-7"
        >
          <p className="mb-4 text-sm leading-relaxed text-white/75 lg:hidden">
            {active.description}
          </p>

          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-[#0e1f09] sm:aspect-[4/3] lg:aspect-[4/5]">
              <img
                key={active.id}
                src={active.image}
                alt={active.imageAlt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-[#0e1f09]/85 via-transparent to-transparent"
              />

              {tab === 'vision' && (
                <div aria-hidden className="absolute inset-[12%]">
                  {/* Khung ngắm 4 góc */}
                  {[
                    'left-0 top-0 border-l-2 border-t-2',
                    'right-0 top-0 border-r-2 border-t-2',
                    'bottom-0 left-0 border-b-2 border-l-2',
                    'bottom-0 right-0 border-b-2 border-r-2',
                  ].map((c) => (
                    <span
                      key={c}
                      className={cn('absolute h-7 w-7 rounded-[3px] border-sun-300', c)}
                    />
                  ))}
                  {/* Đường quét: chạy một lần mỗi khi đổi mẫu hoặc mở tab */}
                  <span
                    key={scanKey}
                    className="ai-scanline absolute inset-x-0 top-0 h-0.5 bg-sun-300 opacity-0 shadow-[0_0_16px_4px_rgb(255_234_121/0.5)] motion-reduce:hidden"
                  />
                </div>
              )}
            </div>

            {/* Phiếu: chồng lên góc dưới trái của ảnh ở desktop; mobile nằm giữa, chờm lên mép ảnh */}
            <div
              aria-live="polite"
              className="relative -mt-16 flex justify-center px-3 sm:-mt-24 lg:absolute lg:-bottom-12 lg:-left-20 lg:mt-0 lg:block lg:w-[22rem] lg:px-0"
            >
              {tab === 'vision' && sample && (
                <KraftTag
                  heading="Phiếu kiểm định AI"
                  title={sample.name}
                  footer={
                    <div className="mt-4 flex items-baseline justify-between gap-2 rounded-xl bg-[#e2d1ad] px-3 py-2.5">
                      <span className="text-sm text-[#6b5434]">Giá giải cứu</span>
                      <span className="flex items-baseline gap-2 tabular-nums">
                        <del className="text-caption text-[#6b5434]">
                          <span className="sr-only">Giá gốc </span>
                          {money(sample.original)}
                        </del>
                        <strong className="text-xl font-extrabold text-[#326318]">
                          {money(sample.price)}
                        </strong>
                      </span>
                    </div>
                  }
                >
                  <TagRow label="Vẻ ngoài">{sample.flaw}</TagRow>
                  <TagRow label="Độ tươi">{sample.score}/100</TagRow>
                  <TagRow label="Rẻ hơn giá gốc">{discountPercent(sample)}%</TagRow>
                </KraftTag>
              )}
              {tab === 'chef' && (
                <KraftTag heading="Thực đơn gợi ý" title={menu.dish}>
                  <TagRow label="Năng lượng">{menu.kcal} kcal</TagRow>
                  <TagRow label="Thời gian nấu">{menu.minutes} phút</TagRow>
                  <TagRow label="Chi phí">{menu.cost}</TagRow>
                  <TagRow label="Rau củ dùng">{menu.uses}</TagRow>
                </KraftTag>
              )}
              {tab === 'copilot' && (
                <KraftTag heading="Tin đăng tự soạn" title="Cà rốt cầu vồng Đà Lạt, 120kg">
                  <TagRow label="Phân loại">Củ cong, nhiều nhánh</TagRow>
                  <TagRow label="Giá đề xuất">18.000đ/kg</TagRow>
                  <TagRow label="Chứng nhận">VietGAP</TagRow>
                  <TagRow label="Thời gian soạn">28 giây</TagRow>
                </KraftTag>
              )}
            </div>
          </div>

          <div className="mt-8 lg:hidden">{controls}</div>
        </div>
      </div>
    </section>
  )
}

import {
  ArrowRight,
  CheckCircle2,
  Gift,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import mysteryPromoImg from '@/assets/mystery-box-promo.png'
import comboMysteryImg from '@/assets/combo-mystery.jpg'
import comboGreenImg from '@/assets/combo-green.jpg'
import comboKitchenImg from '@/assets/combo-kitchen.jpg'
import comboHotpotImg from '@/assets/combo-hotpot.jpg'
import { combos, money, type Product } from '@/mocks/catalog'
import { discountPercent } from '@/features/product'
import { LinkButton } from '@/components/ui/Button'
import { cn } from '@/utils'

/**
 * Thông tin trình bày riêng cho trang chủ. GIÁ và TỒN KHO luôn lấy từ catalog
 * (trước đây ghi cứng ở đây nên trang chủ hiện 139.000đ nhưng giỏ hàng tính 189.000đ,
 * và combo "Lẩu" không có trong catalog nên bấm "Thêm vào giỏ" không thêm được gì).
 */
type ComboTeaser = {
  /** id trong catalog; null = chưa bán trực tuyến, nút sẽ dẫn sang trang Combo. */
  catalogId: string | null
  name: string
  image: string
  badgeWeight: string
  badgeHighlight: string
  category: string
  portion: string
  feature: string
  rating: number
  reviews: number
  /** Chỉ dùng khi catalogId = null. */
  fallbackPrice?: { price: number; original: number; unit: string }
}

const TEASERS: ComboTeaser[] = [
  {
    catalogId: 'mystery',
    name: 'Túi Mù Nông Sản Thần Bí',
    image: comboMysteryImg,
    badgeWeight: '5kg ngẫu nhiên',
    badgeHighlight: 'Tiết kiệm 120k',
    category: 'Hộp quà bất ngờ',
    portion: 'Gia đình 2–3 người',
    feature: 'Gồm 5–6 loại rau lá, củ hầm & quả tươi thu hoạch sáng sớm',
    rating: 4.9,
    reviews: 348,
  },
  {
    catalogId: 'green',
    name: 'Combo Rau Xanh 5 Bữa Tươi',
    image: comboGreenImg,
    badgeWeight: '6kg rau củ',
    badgeHighlight: 'Bán chạy nhất',
    category: 'Combo tuần gia đình',
    portion: 'Gia đình 3–4 người',
    feature: 'Cải bó xôi, mồng tơi, cà rốt, bí đỏ & đậu cô ve thanh mát',
    rating: 4.8,
    reviews: 215,
  },
  {
    catalogId: 'kitchen',
    name: 'Thùng Bếp Xanh Củ Quả 10kg',
    image: comboKitchenImg,
    badgeWeight: '10kg trọn gói',
    badgeHighlight: 'Trọn tuần',
    category: 'Thùng tiết kiệm',
    portion: 'Gia đình 4–5 người',
    feature: 'Khoai lang mật, củ dền, bắp cải, cà chua bi & bưởi hồng',
    rating: 5.0,
    reviews: 182,
  },
  {
    catalogId: null,
    name: 'Combo Tiệc Lẩu & Nướng Xanh',
    image: comboHotpotImg,
    badgeWeight: '4.5kg tuyển chọn',
    badgeHighlight: 'Tiệc tại gia',
    category: 'Combo tiệc cuối tuần',
    portion: 'Nhóm 4–6 người',
    feature: 'Nấm tươi, bắp ngọt, rau tần ô, cải thảo, ớt chuông & cà chua',
    rating: 4.9,
    reviews: 156,
    fallbackPrice: { price: 119000, original: 210000, unit: 'combo' },
  },
]

const BENEFITS = [
  { icon: CheckCircle2, text: '5–6 loại nông sản tươi ngon ngẫu nhiên' },
  { icon: Zap, text: 'Tiết kiệm đến 60% so với mua lẻ' },
  { icon: ShieldCheck, text: 'Đổi mới nếu có quả bị dập hỏng' },
] as const

const mystery = combos.find((c) => c.id === 'mystery')

function ComboCard({
  teaser,
  product,
  onAdd,
}: {
  teaser: ComboTeaser
  product?: Product
  onAdd?: (id: string) => void
}) {
  const pricing = product ?? teaser.fallbackPrice
  const discount = pricing ? discountPercent(pricing) : 0
  const canAdd = Boolean(product && onAdd && product.stock > 0)

  return (
    <article className="group flex h-full flex-col rounded-card border border-line bg-white p-3 shadow-card transition-[box-shadow,border-color] duration-300 hover:border-leaf-600/40 hover:shadow-card-hover sm:p-4">
      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-paper-warm sm:aspect-[16/11]">
        <img
          src={teaser.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
        />
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-sale px-2 py-0.5 text-caption font-extrabold text-white shadow-sm">
            -{discount}%
          </span>
        )}
        <span className="absolute right-2 top-2 rounded-md bg-white/95 px-2 py-0.5 text-caption font-bold text-leaf-700 shadow-sm">
          {teaser.badgeWeight}
        </span>
        <span className="absolute bottom-2 left-2 rounded-md bg-white/95 px-2 py-0.5 text-caption font-semibold text-soil-600 shadow-sm">
          {teaser.badgeHighlight}
        </span>
      </div>

      <p className="mb-1 flex items-center justify-between gap-2 text-caption text-ink-muted">
        <span className="font-semibold text-leaf-700">{teaser.category}</span>
        <span className="shrink-0">{teaser.portion}</span>
      </p>
      <h3 className="text-base font-bold leading-snug text-ink">{teaser.name}</h3>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">{teaser.feature}</p>

      <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-line pt-3">
        {pricing && (
          <p className="flex items-baseline gap-1.5">
            <strong className="text-lg font-extrabold text-leaf-700">{money(pricing.price)}</strong>
            <span className="text-caption text-ink-subtle">/{pricing.unit}</span>
            {discount > 0 && (
              <del className="text-caption text-ink-subtle">
                <span className="sr-only">Giá gốc </span>
                {money(pricing.original)}
              </del>
            )}
          </p>
        )}
        {/* Một ngôi sao + điểm số, thay cho 5 sao đầy cho mọi mức điểm */}
        <p
          className="flex items-center gap-1 text-caption text-ink-muted"
          aria-label={`Đánh giá ${teaser.rating} trên 5, ${teaser.reviews} lượt`}
        >
          <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden />
          <span className="font-bold text-ink">{teaser.rating.toFixed(1)}</span>
          <span aria-hidden>({teaser.reviews})</span>
        </p>
      </div>

      {canAdd && product ? (
        <button
          type="button"
          onClick={() => onAdd?.(product.id)}
          className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-leaf-700 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-600 focus-visible:ring-offset-2"
          aria-label={`Thêm ${teaser.name} vào giỏ`}
        >
          <ShoppingBasket size={16} aria-hidden />
          {product.id === 'mystery' ? 'Mở túi mù ngay' : 'Thêm vào giỏ'}
        </button>
      ) : (
        <LinkButton href="#/combo-tui-mu" variant="secondary" fullWidth className="mt-3">
          Xem chi tiết combo <ArrowRight size={16} aria-hidden />
        </LinkButton>
      )}
    </article>
  )
}

export default function CombosTeaser({ onAdd }: { onAdd?: (id: string) => void }) {
  return (
    <section
      id="combo-tui-mu"
      aria-labelledby="combo-teaser-title"
      className="border-b border-line bg-[#fcfaf6] py-12 md:py-16 lg:py-20"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-caption font-bold uppercase tracking-wider text-soil-600">
              <Gift size={16} aria-hidden />
              Trải nghiệm thú vị &amp; Tiết kiệm
            </p>
            <h2
              id="combo-teaser-title"
              className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl lg:text-4xl"
            >
              Combo &amp; Túi Mù Nông Sản
            </h2>
          </div>
          <a
            href="#/combo-tui-mu"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-soil-600 hover:text-soil-700"
          >
            Xem tất cả Combo &amp; Túi Mù <ArrowRight size={17} aria-hidden />
          </a>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Mobile: cuộn ngang có snap (mỗi card ~85% màn hình) thay vì 4 card xếp dọc ~2.000px. Từ sm: lưới 2 cột. */}
          <ul
            aria-label="Các combo nổi bật"
            className={cn(
              '-mx-4 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]',
              'sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0',
              'order-2 lg:order-1 lg:col-span-8 xl:col-span-9',
            )}
          >
            {TEASERS.map((teaser) => (
              <li key={teaser.name} className="w-[85%] shrink-0 snap-start sm:w-auto">
                <ComboCard
                  teaser={teaser}
                  product={
                    teaser.catalogId ? combos.find((c) => c.id === teaser.catalogId) : undefined
                  }
                  onAdd={onAdd}
                />
              </li>
            ))}
          </ul>

          {/* Banner: gọn trên mobile (ẩn ảnh lớn), đầy đủ từ sm */}
          <aside className="relative order-1 flex flex-col justify-between gap-6 overflow-hidden rounded-panel bg-gradient-to-b from-soil-600 via-[#6e3910] to-[#452008] p-6 text-white shadow-card sm:flex-row lg:order-2 lg:col-span-4 lg:flex-col xl:col-span-3">
            <div className="relative z-10 flex flex-col gap-4">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/20 px-3 py-1 text-caption font-bold uppercase tracking-wider">
                <Sparkles size={13} className="text-sun-300" aria-hidden /> Bí ẩn mỗi ngày
              </span>
              <h3 className="text-2xl font-extrabold leading-tight sm:text-3xl">
                Mở Túi Mù – Đón Bất Ngờ Từ Nhà Vườn
              </h3>
              <p className="hidden text-sm leading-relaxed text-white/85 sm:block">
                Mỗi túi là 5kg rau củ quả thu hoạch sớm nhất trong ngày, chọn ngẫu nhiên từ nhà vườn
                liên kết.
              </p>
              {mystery && (
                <p className="rounded-card border border-white/15 bg-black/20 p-3.5">
                  <span className="block text-caption uppercase tracking-wide text-white/80">
                    Giá trải nghiệm
                  </span>
                  <span className="text-2xl font-black text-sun-300 sm:text-3xl">
                    Chỉ {money(mystery.price)}
                  </span>
                  <span className="text-caption text-white/80">/túi 5kg</span>
                </p>
              )}
              <ul className="flex flex-col gap-2 text-sm text-white/90">
                {BENEFITS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2">
                    <Icon size={15} className="shrink-0 text-sun-300" aria-hidden />
                    {text}
                  </li>
                ))}
              </ul>
              <a
                href="#/combo-tui-mu"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#6e3910] shadow-md transition-colors hover:bg-[#fff7ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-soil-600 sm:w-fit"
              >
                Mở túi mù ngay <ArrowRight size={16} aria-hidden />
              </a>
            </div>
            <img
              src={mysteryPromoImg}
              alt=""
              loading="lazy"
              decoding="async"
              className="relative z-10 mx-auto hidden max-h-72 w-auto object-contain drop-shadow-xl sm:block sm:max-w-[45%] lg:max-w-full"
            />
          </aside>
        </div>
      </div>
    </section>
  )
}

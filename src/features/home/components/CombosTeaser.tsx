import {
  ArrowRight,
  CheckCircle2,
  Gift,
  ShieldCheck,
  ShoppingCart,
  Eye,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import mysteryPromoImg from '@/assets/mystery-box-promo.png'
import comboMysteryImg from '@/assets/combo-mystery.jpg'
import comboGreenImg from '@/assets/combo-green.jpg'
import comboKitchenImg from '@/assets/combo-kitchen.jpg'
import comboHotpotImg from '@/assets/combo-hotpot.jpg'
import { cn, formatCurrency } from '@/utils'
import { mysteryBoxService, comboService } from '@/services'
import { isMeaningfulComboName, mapComboToCard, mapMysteryBoxToCard } from '@/pages/combos.utils'

type ComboTeaser = {
  catalogId: string | null
  realId?: number
  itemType?: string
  name: string
  image: string
  badgeWeight: string
  badgeHighlight: string
  category: string
  portion: string
  feature: string
  rating: number
  reviews: number
  price: number
  original: number
  unit: string
  stock: number
}

const BENEFITS = [
  { icon: CheckCircle2, text: '5–6 loại nông sản tươi ngon ngẫu nhiên' },
  { icon: Zap, text: 'Tiết kiệm đến 60% so với mua lẻ' },
  { icon: ShieldCheck, text: 'Đổi mới nếu có quả bị dập hỏng' },
] as const

function ComboCard({
  teaser,
  onAdd,
}: {
  teaser: ComboTeaser
  onAdd?: (id: string | number, itemType?: string) => void
}) {
  const discount = teaser.original > teaser.price
    ? Math.round((1 - teaser.price / teaser.original) * 100)
    : 0

  const detailUrl =
    teaser.itemType === 'MYSTERY_BOX'
      ? `/tui-mu/${teaser.realId}`
      : teaser.itemType === 'BUILD_COMBO'
        ? `/combo/${teaser.realId}`
        : '/combo-tui-mu'

  const soldOut = teaser.stock <= 0

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-[#e8ece3] bg-white p-3 shadow-xs transition-all duration-300 hover:border-[#326318]/50 hover:shadow-md sm:p-4">
      {/* Khung ảnh: click vào chuyển sang trang chi tiết */}
      <Link
        to={detailUrl}
        className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-paper-warm sm:aspect-[16/11] block"
      >
        <img
          src={teaser.image}
          alt={teaser.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
        />
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-[#e53935] px-2 py-0.5 text-caption font-extrabold text-white shadow-xs">
            -{discount}%
          </span>
        )}
        <span className="absolute right-2 top-2 rounded-md bg-white/95 px-2 py-0.5 text-caption font-bold text-leaf-700 shadow-xs">
          {teaser.badgeWeight}
        </span>
        <span className="absolute bottom-2 left-2 rounded-md bg-white/95 px-2 py-0.5 text-caption font-semibold text-soil-600 shadow-xs">
          {teaser.badgeHighlight}
        </span>
      </Link>

      <p className="mb-1 flex items-center justify-between gap-2 text-caption text-ink-muted">
        <span className="font-semibold text-leaf-700">{teaser.category}</span>
        <span className="shrink-0">{teaser.portion}</span>
      </p>
      <h3 className="text-base font-bold leading-snug text-ink line-clamp-1">
        <Link to={detailUrl} className="hover:text-[#326318] transition-colors">
          {teaser.name}
        </Link>
      </h3>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">{teaser.feature}</p>

      <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-line pt-3">
        <p className="flex items-baseline gap-1.5">
          <strong className="text-lg font-extrabold text-leaf-700">{formatCurrency(teaser.price)}</strong>
          <span className="text-caption text-ink-subtle">/{teaser.unit}</span>
          {discount > 0 && (
            <del className="text-caption text-ink-subtle">
              <span className="sr-only">Giá gốc </span>
              {formatCurrency(teaser.original)}
            </del>
          )}
        </p>

        {/* Đánh giá */}
        <p
          className="flex items-center gap-1 text-caption text-ink-muted"
          aria-label={`Đánh giá ${teaser.rating} trên 5, ${teaser.reviews} lượt`}
        >
          <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden />
          <span className="font-bold text-ink">{teaser.rating.toFixed(1)}</span>
          <span aria-hidden>({teaser.reviews})</span>
        </p>
      </div>

      {/* Chuẩn hóa 2 nút: Chi tiết + Thêm giỏ (Khớp 100% với ProductCard) */}
      <div className="mt-3 flex items-center gap-2 pt-2.5 border-t border-[#f0eee6]">
        <Link
          to={detailUrl}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-2 rounded-lg border border-[#326318]/40 bg-[#f8faf6] text-[#326318] hover:bg-[#326318] hover:text-white text-xs font-bold transition-all text-center group/btn"
        >
          <Eye size={14} className="shrink-0 transition-transform group-hover/btn:scale-110" />
          <span className="truncate">Chi tiết</span>
        </Link>

        <button
          type="button"
          disabled={soldOut}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (teaser.realId && onAdd) {
              onAdd(teaser.realId, teaser.itemType ?? 'BUILD_COMBO')
            }
          }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-2 rounded-lg bg-[#326318] hover:bg-[#254b12] text-white text-xs font-bold transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:bg-[#d6dccf] disabled:text-[#838d7b] disabled:cursor-not-allowed disabled:shadow-none text-center"
        >
          <ShoppingCart size={14} className="shrink-0" />
          <span className="truncate">{soldOut ? 'Hết hàng' : 'Thêm giỏ'}</span>
        </button>
      </div>
    </article>
  )
}

export default function CombosTeaser({ onAdd }: { onAdd?: (id: string | number, itemType?: string) => void }) {
  const { data: mysteryBoxesData } = useQuery({
    queryKey: ['home-mystery-boxes'],
    queryFn: () => mysteryBoxService.getForBuyer(),
  })

  const { data: combosData } = useQuery({
    queryKey: ['home-combos'],
    queryFn: () => comboService.getCombos(),
  })

  const teasers = useMemo<ComboTeaser[]>(() => {
    const dbMystery = (mysteryBoxesData?.content ?? []).slice(0, 2).map((item) =>
      mapMysteryBoxToCard(item, comboMysteryImg),
    )
    const dbCombos = (combosData?.content ?? []).slice(0, 2).map((item) =>
      mapComboToCard(item, comboGreenImg),
    )

    const cards = [...dbMystery, ...dbCombos].filter((card) => isMeaningfulComboName(card.name))
    if (cards.length > 0) {
      return cards.slice(0, 4).map((card) => ({
        catalogId: card.id,
        realId: card.realId,
        itemType: card.itemType,
        name: card.name,
        image: card.image,
        badgeWeight: card.badgeWeight,
        badgeHighlight: card.badgeHighlight,
        category: card.category,
        portion: card.portion,
        feature: card.feature,
        rating: card.rating,
        reviews: card.reviews,
        price: card.price,
        original: card.original,
        unit: card.unit,
        stock: card.stock,
      }))
    }

    return []
  }, [mysteryBoxesData, combosData])

  const firstMystery = mysteryBoxesData?.content?.[0]
  const mysteryPrice = Number(firstMystery?.price) || 0

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
          <Link
            to="/combo-tui-mu"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-soil-600 hover:text-soil-700"
          >
            Xem tất cả Combo &amp; Túi Mù <ArrowRight size={17} aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Mobile: cuộn ngang có snap. Từ sm: lưới 2 cột. */}
          <ul
            aria-label="Các combo nổi bật"
            className={cn(
              '-mx-4 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]',
              'sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0',
              'order-2 lg:order-1 lg:col-span-8 xl:col-span-9',
            )}
          >
            {teasers.map((teaser) => (
              <li key={teaser.name} className="w-[85%] shrink-0 snap-start sm:w-auto">
                <ComboCard teaser={teaser} onAdd={onAdd} />
              </li>
            ))}
          </ul>

          {/* Banner: bo góc rounded-2xl đồng đều với từng thẻ combo */}
          <aside className="relative order-1 flex flex-col justify-between gap-6 overflow-hidden rounded-2xl bg-gradient-to-b from-soil-600 via-[#6e3910] to-[#452008] p-6 text-white shadow-card sm:flex-row lg:order-2 lg:col-span-4 lg:flex-col xl:col-span-3">
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
              <p className="rounded-card border border-white/15 bg-black/20 p-3.5">
                <span className="block text-caption uppercase tracking-wide text-white/80">
                  Giá trải nghiệm
                </span>
                <span className="text-2xl font-black text-sun-300 sm:text-3xl">
                  {mysteryPrice > 0 ? `Chỉ ${formatCurrency(mysteryPrice)}` : 'Trợ giá giải cứu'}
                </span>
                <span className="text-caption text-white/80">/túi 5kg</span>
              </p>
              <ul className="flex flex-col gap-2 text-sm text-white/90">
                {BENEFITS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2">
                    <Icon size={15} className="shrink-0 text-sun-300" aria-hidden />
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                to="/combo-tui-mu"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#6e3910] shadow-md transition-colors hover:bg-[#fff7ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-soil-600 sm:w-fit"
              >
                Mở túi mù ngay <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
            <img
              src={mysteryPromoImg}
              alt="Túi mù nông sản bí ẩn"
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

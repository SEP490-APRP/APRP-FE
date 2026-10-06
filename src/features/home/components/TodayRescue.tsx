import { ArrowRight, CheckCircle2, Flame, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import promoImg from '@/assets/fresh-veg-promo.png'
import { products, money, type Cart } from '@/mocks/catalog'
import { ProductGrid } from '@/features/product'
import { LinkButton } from '@/components/ui/Button'

const BENEFITS = [
  { icon: CheckCircle2, text: 'Không chất bảo quản' },
  { icon: Zap, text: 'Giao nhanh 2–4 giờ' },
  { icon: ShieldCheck, text: 'Đổi trả 1-1 nhanh chóng' },
] as const

// Lấy giá thấp nhất thật từ catalog thay vì ghi cứng "15.000đ"
const lowestPrice = Math.min(...products.map((p) => p.price))

export default function TodayRescue({ onAdd, cart }: { onAdd: (id: string) => void; cart?: Cart }) {
  return (
    <section
      id="giai-cuu-hom-nay"
      aria-labelledby="today-rescue-title"
      className="bg-paper-warm py-12 md:py-16 lg:py-20"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-caption font-bold uppercase tracking-wider text-leaf-700">
              <Flame size={16} className="text-soil-600" aria-hidden />
              Tươi ngon mỗi ngày
            </p>
            <h2
              id="today-rescue-title"
              className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl lg:text-4xl"
            >
              Giải cứu hôm nay
            </h2>
          </div>
          <a
            href="#/nong-san-tuoi"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-leaf-700 hover:text-leaf-800"
          >
            Xem tất cả nông sản <ArrowRight size={17} aria-hidden />
          </a>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Banner: trên mobile/tablet thành khối ngang gọn, không còn min-h 520px đẩy sản phẩm xuống */}
          <aside className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-panel bg-gradient-to-b from-leaf-700 to-leaf-900 p-6 text-white shadow-card sm:flex-row lg:col-span-4 lg:flex-col xl:col-span-3">
            <div className="relative z-10 flex flex-col gap-4">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-caption font-bold uppercase tracking-wider">
                <Sparkles size={13} className="text-sun-300" aria-hidden /> Tiết kiệm đến 50%
              </span>
              <h3 className="text-2xl font-extrabold leading-tight">
                Rau củ tươi sạch cho gian bếp gia đình
              </h3>
              <p className="rounded-card border border-white/15 bg-black/15 p-3.5">
                <span className="block text-caption uppercase tracking-wide text-white/80">
                  Ưu đãi hôm nay
                </span>
                <span className="text-2xl font-black text-sun-300 sm:text-3xl">
                  Chỉ từ {money(lowestPrice)}
                </span>
                <span className="text-caption text-white/80">/kg</span>
              </p>
              <ul className="flex flex-col gap-2 text-sm text-white/90">
                {BENEFITS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2">
                    <Icon size={15} className="shrink-0 text-leaf-300" aria-hidden />
                    {text}
                  </li>
                ))}
              </ul>
              <LinkButton
                href="#/nong-san-tuoi"
                variant="secondary"
                size="lg"
                className="w-full border-0 sm:w-fit"
              >
                Khám phá ngay <ArrowRight size={16} aria-hidden />
              </LinkButton>
            </div>
            <img
              src={promoImg}
              alt=""
              loading="lazy"
              decoding="async"
              className="relative z-10 mx-auto hidden max-h-64 w-auto object-contain drop-shadow-xl sm:block sm:max-w-[45%] lg:max-w-full"
            />
          </aside>

          {/* Dùng lại ProductGrid/ProductCard; mobile chỉ hiện 4 sản phẩm đầu, phần còn lại ở trang Nông sản tươi */}
          <div className="lg:col-span-8 xl:col-span-9">
            <ProductGrid
              products={products}
              onAdd={onAdd}
              cart={cart}
              columns="wide"
              className="xl:grid-cols-4 max-md:[&>li:nth-child(n+5)]:hidden"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

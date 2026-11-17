import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCategories } from '@/features/product/hooks/useCategoryQueries'
import type { CategoryResponse } from '@/services'

function getCategoryArtwork(name: string) {
  const n = (name || '').toLowerCase()
  if (n.includes('lá') || n.includes('rau')) {
    return (
      <svg viewBox="0 0 88 88" aria-hidden="true">
        <path d="M44 72V32M44 32Q32 16 18 22Q20 40 44 42M44 32Q56 16 70 22Q68 40 44 42M44 48Q30 38 22 46Q28 58 44 56M44 48Q58 38 66 46Q60 58 44 56" />
        <ellipse cx={44} cy={74} rx={6} ry={3} />
      </svg>
    )
  }
  if (n.includes('củ')) {
    return (
      <svg viewBox="0 0 88 88" aria-hidden="true">
        <path d="M44 28L33 72Q44 77 55 72L44 28ZM44 28C44 18 34 12 27 15M44 28C44 18 54 12 61 15M44 28V10M37 42H50M35 54H53M39 65H49" />
      </svg>
    )
  }
  if (n.includes('trái') || n.includes('quả')) {
    return (
      <svg viewBox="0 0 88 88" aria-hidden="true">
        <path d="M44 26C30 26 22 38 22 54C22 70 32 76 44 76C56 76 66 70 66 54C66 38 58 26 44 26ZM44 26C44 18 48 14 54 14M44 20C40 16 34 18 32 22M34 50Q44 60 54 50" />
      </svg>
    )
  }
  if (n.includes('hữu cơ') || n.includes('vietgap')) {
    return (
      <svg viewBox="0 0 88 88" aria-hidden="true">
        <path d="M44 16C28 16 20 30 20 46C20 62 34 74 44 74C54 74 68 62 68 46C68 30 60 16 44 16ZM44 30V62M44 40Q34 34 28 40Q32 50 44 46M44 46Q54 38 60 44Q56 54 44 52" />
      </svg>
    )
  }
  if (n.includes('nấm') || n.includes('đậu')) {
    return (
      <svg viewBox="0 0 88 88" aria-hidden="true">
        <path d="M18 48C18 30 29 20 44 20C59 20 70 30 70 48C70 51 68 52 44 52C20 52 18 51 18 48Z" />
        <path d="M36 52V68C36 72 41 74 44 74C47 74 52 72 52 68V52" />
        <circle cx={34} cy={34} r={3} />
        <circle cx={54} cy={36} r={2.5} />
        <circle cx={44} cy={27} r={2.5} />
      </svg>
    )
  }
  if (n.includes('đặc sản') || n.includes('vùng miền')) {
    return (
      <svg viewBox="0 0 88 88" aria-hidden="true">
        <path d="M44 18C44 28 35 44 35 56C35 63 39 68 44 68C49 68 53 63 53 56C53 44 44 28 44 18Z" />
        <path d="M44 42C36 44 22 50 24 62C25 67 30 70 37 68C41 67 43 62 44 56" />
        <path d="M44 42C52 44 66 50 64 62C63 67 58 70 51 68C47 67 45 62 44 56" />
        <ellipse cx={44} cy={72} rx={16} ry={3} />
      </svg>
    )
  }
  if (n.includes('combo') || n.includes('túi mù') || n.includes('hộp') || n.includes('tiết kiệm')) {
    return (
      <svg viewBox="0 0 88 88" aria-hidden="true">
        <path d="M22 36L44 24L66 36V64L44 76L22 64ZM22 36L44 48L66 36M44 48V76M34 30L54 42M44 24V43M26 38L33 34M48 48L60 41" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 88 88" aria-hidden="true">
      <path d="M16 68L36 34L48 52L60 30L72 68ZM16 68H72M32 44L44 62M54 42L64 60M26 24Q30 18 36 20Q34 28 26 24" />
    </svg>
  )
}

export default function Categories() {
  const { data: rawCategories, isLoading } = useCategories()

  const categories = (rawCategories ?? []) as CategoryResponse[]

  return (
    <section id="danh-muc" aria-labelledby="danh-muc-title">
      <div className="cat-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="cat-header">
          <div>
            <span className="cat-eyebrow">Phân loại phong phú</span>
            <h2 id="danh-muc-title" className="cat-title">
              Khám phá theo danh mục nông sản
            </h2>
          </div>
          <Link className="cat-link-all" to="/nong-san-tuoi">
            <span>Xem tất cả phân loại</span>
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="cat-grid">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={`cat-skeleton-${idx}`}
                className="cat-item animate-pulse flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-100"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-50 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-16" />
              </div>
            ))
          ) : categories.length > 0 ? (
            categories.map((cat) => {
              const isComboItem =
                (cat.name || '').toLowerCase().includes('combo') ||
                (cat.name || '').toLowerCase().includes('túi mù')

              const href = isComboItem
                ? '/combo-tui-mu'
                : `/nong-san-tuoi?categoryId=${cat.categoryId}`

              return (
                <Link key={`cat-${cat.categoryId}`} className="cat-item group" to={href}>
                  <div className="cat-art">{getCategoryArtwork(cat.name)}</div>
                  <h3>{cat.name}</h3>
                  <p>{cat.description || 'Nông sản tuyển chọn'}</p>
                </Link>
              )
            })
          ) : (
            <div className="col-span-full py-8 text-center text-sm text-gray-500">
              Chưa có danh mục nông sản nào.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

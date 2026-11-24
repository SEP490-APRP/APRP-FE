import type { ReactNode } from 'react'

interface ShopPageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  leading?: ReactNode
  actions?: ReactNode
  className?: string
}

/**
 * Header thống nhất cho toàn bộ các trang bên Kênh Nhà Vườn (đồng bộ kiểu chữ và bố cục với Báo Cáo Doanh Thu).
 */
export function ShopPageHeader({
  title,
  subtitle,
  badge,
  leading,
  actions,
  className = '',
}: ShopPageHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f1f4ed] ${className}`.trim()}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {leading}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-2xl font-black text-[#1c2216] tracking-tight">{title}</h3>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-[#737c6e] font-medium mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </div>
  )
}

import { Link, useLocation } from 'react-router'

import { ROUTES } from '@/utils/constants'

/* ===== Header Component ===== */
const Header = () => {
  const location = useLocation()

  const navLinks = [
    { label: 'Trang chủ', path: ROUTES.HOME },
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to={ROUTES.HOME} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            C
          </div>
          <span className="text-lg font-bold text-text-primary">
            Capstone
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                location.pathname === link.path
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.LOGIN}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-primary-dark"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header

import { Outlet } from 'react-router'

import { Header } from './Header'
import { Footer } from './Footer'

/**
 * Main layout wrapper that provides consistent Header + Footer
 * across all pages. Child routes render via <Outlet />.
 */
const MainLayout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout

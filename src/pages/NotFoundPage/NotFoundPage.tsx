import { Link } from 'react-router'

import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/utils/constants'

/* ===== Not Found Page ===== */
const NotFoundPage = () => {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="text-center">
        <h1 className="mb-2 text-8xl font-extrabold text-primary">404</h1>
        <h2 className="mb-4 text-2xl font-bold text-text-primary">
          Trang không tồn tại
        </h2>
        <p className="mb-8 text-text-secondary">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <Link to={ROUTES.HOME}>
          <Button size="lg">Về trang chủ</Button>
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage

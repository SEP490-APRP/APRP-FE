import { Compass } from 'lucide-react'
import { LinkButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/StateViews'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <EmptyState
        className="w-full max-w-md"
        icon={<Compass size={30} />}
        title="Không tìm thấy trang"
        description="Đường dẫn này không tồn tại hoặc đã được đổi. Bạn thử quay về trang chủ hoặc xem nông sản đang giải cứu nhé."
        action={<LinkButton href="#/">Về trang chủ</LinkButton>}
      />
    </div>
  )
}

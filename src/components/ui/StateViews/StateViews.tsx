import type { ReactNode } from 'react'
import { AlertTriangle, Leaf, RefreshCw } from 'lucide-react'
import { cn } from '@/utils'
import { Button } from '../Button'

type StateViewProps = {
  title: string
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

function StateFrame({
  title,
  description,
  icon,
  action,
  className,
  tone,
  role,
}: StateViewProps & { tone: 'neutral' | 'danger'; role?: 'alert' | 'status' }) {
  return (
    <div
      role={role}
      className={cn(
        'flex flex-col items-center gap-3 rounded-panel border px-6 py-12 text-center',
        tone === 'danger' ? 'border-red-200 bg-sale-soft' : 'border-line bg-white',
        className,
      )}
    >
      <div
        className={cn(
          'mb-1 flex h-16 w-16 items-center justify-center rounded-full',
          tone === 'danger' ? 'bg-white text-sale' : 'bg-leaf-50 text-leaf-600',
        )}
        aria-hidden
      >
        {icon}
      </div>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Danh sách rỗng: luôn nói rõ vì sao rỗng và cho người dùng một hành động tiếp theo. */
export function EmptyState({ icon = <Leaf size={32} />, ...props }: StateViewProps) {
  return <StateFrame {...props} icon={icon} tone="neutral" role="status" />
}

/** Lỗi tải dữ liệu: có nút "Thử lại" thay vì chỉ in dòng chữ đỏ. */
export function ErrorState({
  title = 'Không tải được dữ liệu',
  description = 'Kết nối bị gián đoạn. Vui lòng kiểm tra mạng và thử lại.',
  onRetry,
  ...props
}: Partial<StateViewProps> & { onRetry?: () => void }) {
  return (
    <StateFrame
      {...props}
      title={title}
      description={description}
      icon={<AlertTriangle size={30} />}
      tone="danger"
      role="alert"
      action={
        onRetry && (
          <Button
            variant="secondary"
            onClick={onRetry}
            leftIcon={<RefreshCw size={16} aria-hidden />}
          >
            Thử lại
          </Button>
        )
      }
    />
  )
}

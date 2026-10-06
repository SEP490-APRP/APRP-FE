import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils'

/**
 * Một nút dùng chung thay cho khoảng 10 biến thể className viết tay
 * (btn btn-green, bg-[#4a7c2f] ... rounded-xl, bg-[#f1eee6] hover:bg-primary ...).
 * Tất cả kích thước đều đạt vùng chạm tối thiểu 40px (md: 44px).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const base =
  'inline-flex items-center justify-center gap-2 font-bold transition-colors duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-600 focus-visible:ring-offset-2 ' +
  'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-leaf-700 text-white shadow-sm hover:bg-leaf-800',
  secondary: 'border border-line bg-white text-leaf-700 hover:border-leaf-600 hover:bg-leaf-50',
  ghost: 'text-ink-muted hover:bg-leaf-50 hover:text-leaf-700',
  accent: 'bg-sun-300 text-leaf-900 shadow-sm hover:bg-sun-500',
  danger: 'bg-sale text-white hover:bg-red-800',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-10 rounded-lg px-3 text-caption',
  md: 'h-11 rounded-xl px-4 text-sm',
  lg: 'h-12 rounded-full px-6 text-base',
  icon: 'h-10 w-10 rounded-xl',
}

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)
}

type CommonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  leftIcon?: ReactNode
}

export type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean
  }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant,
    size,
    fullWidth,
    leftIcon,
    loading = false,
    className,
    children,
    type = 'button',
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : leftIcon}
      {children}
    </button>
  )
})

export type LinkButtonProps = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>

/** Giống Button nhưng là thẻ <a>, dùng cho điều hướng (đúng ngữ nghĩa hơn button + location.hash). */
export function LinkButton({
  variant,
  size,
  fullWidth,
  leftIcon,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <a className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {leftIcon}
      {children}
    </a>
  )
}

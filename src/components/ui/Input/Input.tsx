import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

import { cn } from '@/utils/helpers'

/* ===== Input Types ===== */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

/* ===== Input Component ===== */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            error && 'border-error focus:border-error focus:ring-error/20',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-text-secondary">{helperText}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input

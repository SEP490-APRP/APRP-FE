import React, { forwardRef, useRef, useState, useEffect } from 'react'
import { X } from 'lucide-react'

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  rightElement?: React.ReactNode
  accentColor?: 'green' | 'brown' | 'teal'
  containerClassName?: string
  onClear?: () => void
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  (
    {
      icon,
      rightElement,
      accentColor = 'green',
      containerClassName = '',
      className = '',
      onFocus,
      onBlur,
      onChange,
      onClear,
      value,
      defaultValue,
      type = 'text',
      ...props
    },
    forwardedRef,
  ) => {
    const innerRef = useRef<HTMLInputElement | null>(null)
    const [isFocused, setIsFocused] = useState(false)
    const [hasText, setHasText] = useState(Boolean(value || defaultValue))

    useEffect(() => {
      if (value !== undefined) {
        setHasText(String(value).length > 0)
      }
    }, [value])

    const setRefs = (node: HTMLInputElement | null) => {
      innerRef.current = node
      if (typeof forwardedRef === 'function') forwardedRef(node)
      else if (forwardedRef) (forwardedRef as any).current = node
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      if (innerRef.current) {
        setHasText(innerRef.current.value.length > 0)
      }
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasText(e.target.value.length > 0)
      onChange?.(e)
    }

    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (innerRef.current) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )?.set
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(innerRef.current, '')
        } else {
          innerRef.current.value = ''
        }

        innerRef.current.dispatchEvent(new Event('input', { bubbles: true }))
        innerRef.current.dispatchEvent(new Event('change', { bubbles: true }))
        innerRef.current.focus()
      }
      setHasText(false)
      onClear?.()
    }

    const accentBorder = {
      green: 'focus:border-[#326318] focus:ring-2 focus:ring-[#326318]/15',
      brown: 'focus:border-[#8a4e1d] focus:ring-2 focus:ring-[#8a4e1d]/15',
      teal: 'focus:border-[#2d6f78] focus:ring-2 focus:ring-[#2d6f78]/15',
    }[accentColor]

    const showClearBtn = isFocused && hasText
    const prClass = showClearBtn && rightElement
      ? 'pr-20'
      : showClearBtn || rightElement
        ? 'pr-11'
        : 'pr-4'

    return (
      <div className={`relative w-full ${containerClassName}`}>
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8e9786] transition-colors">
            {icon}
          </div>
        )}

        <input
          ref={setRefs}
          type={type}
          value={value}
          defaultValue={defaultValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={`w-full ${icon ? 'pl-11' : 'pl-3.5'} ${prClass} py-2.5 sm:py-3 rounded-2xl bg-[#f8faf6] border border-[#cfd6c7] hover:border-[#b2bca9] ${accentBorder} focus:bg-white text-xs sm:text-sm text-[#1e2319] placeholder-[#90988a] shadow-[0_1px_2px_rgba(0,0,0,0.03)] outline-none transition-all duration-150 ${className}`}
          {...props}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
          {showClearBtn && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClear}
              title="Xóa nội dung ô này"
              aria-label="Xóa nội dung ô này"
              className="size-5 rounded-full bg-[#dbe2d5] hover:bg-[#c2ccba] text-[#55604e] hover:text-[#1e2319] flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              tabIndex={-1}
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          )}

          {rightElement && (
            <div className="flex items-center text-[#8e9786]">
              {rightElement}
            </div>
          )}
        </div>
      </div>
    )
  },
)

AuthInput.displayName = 'AuthInput'
export default AuthInput

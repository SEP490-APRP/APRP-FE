import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'
import { AuthInput, type AuthInputProps } from './AuthInput'
import { orderService, type AddressSuggestion } from '@/services'

export interface AuthAddressInputProps extends Omit<AuthInputProps, 'onChange'> {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelectSuggestion?: (address: string) => void
}

export const AuthAddressInput = React.forwardRef<HTMLInputElement, AuthAddressInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onSelectSuggestion,
      accentColor = 'green',
      icon = <MapPin size={17} />,
      ...props
    },
    ref,
  ) => {
    const [inputValue, setInputValue] = useState<string>(
      value !== undefined ? String(value) : defaultValue !== undefined ? String(defaultValue) : '',
    )
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Sync input value if controlled externally
    useEffect(() => {
      if (value !== undefined) {
        setInputValue(String(value))
      }
    }, [value])

    // Click outside to close suggestions
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Debounced address suggestions
    useEffect(() => {
      const trimmed = inputValue.trim()
      if (!isOpen || trimmed.length < 2) {
        setSuggestions([])
        return
      }

      let alive = true
      const timer = setTimeout(async () => {
        setIsLoading(true)
        try {
          const list = await orderService.getAddressSuggestions(trimmed)
          if (alive) {
            setSuggestions(list)
          }
        } catch (err) {
          console.error('Lỗi tìm gợi ý địa chỉ:', err)
        } finally {
          if (alive) setIsLoading(false)
        }
      }, 300)

      return () => {
        alive = false
        clearTimeout(timer)
      }
    }, [inputValue, isOpen])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
      setIsOpen(true)
      onChange?.(e)
    }

    const handleSelect = (description: string) => {
      setInputValue(description)
      setIsOpen(false)
      setSuggestions([])
      onSelectSuggestion?.(description)
    }

    return (
      <div ref={containerRef} className="relative w-full">
        <AuthInput
          ref={ref}
          value={inputValue}
          onChange={handleChange}
          onFocus={() => {
            if (inputValue.trim().length >= 2) setIsOpen(true)
          }}
          icon={icon}
          accentColor={accentColor}
          autoComplete="off"
          {...props}
        />

        {isOpen && (suggestions.length > 0 || isLoading) && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#cfd6c7] rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-gray-100 ring-1 ring-black/5 animate-in fade-in duration-150">
            <div className="p-2 bg-[#f4f6f1] text-[11px] font-bold text-[#44503e] flex items-center justify-between sticky top-0 z-10 backdrop-blur-xs">
              <span className="flex items-center gap-1.5">
                <span>📍</span>
                <span>Gợi ý địa chỉ từ Google Maps</span>
                {isLoading && <Loader2 size={12} className="animate-spin text-emerald-600 ml-1" />}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
            {suggestions.map((s, idx) => (
              <div
                key={s.placeId || idx}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(s.description)
                }}
                className="p-2.5 flex items-start gap-2 hover:bg-[#ebf3e7] cursor-pointer text-xs text-[#1e2319] transition-colors"
              >
                <MapPin size={14} className="text-[#326318] shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">{s.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  },
)

AuthAddressInput.displayName = 'AuthAddressInput'


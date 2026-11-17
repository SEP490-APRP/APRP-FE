import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption<T = string | number> {
  value: T
  label: string
  sublabel?: string
  icon?: React.ReactNode
}

interface CustomSelectProps<T = string | number> {
  id?: string
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: boolean
}

export function CustomSelect<T extends string | number>({
  id,
  value,
  onChange,
  options,
  placeholder = 'Chọn một mục...',
  className = '',
  disabled = false,
  error = false,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-3.5 py-2.5 rounded-2xl bg-[#f4f7f1] text-xs font-semibold text-[#1e2319] outline-none border transition-all flex items-center justify-between cursor-pointer select-none ${
          error
            ? 'border-[#c5221f] bg-red-50/40 text-red-900'
            : isOpen
            ? 'border-[#326318] bg-white ring-2 ring-[#326318]/15 shadow-sm'
            : 'border-transparent hover:border-[#c3d1b8] hover:bg-[#edf2e8]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-[#7e8779] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#326318]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-white rounded-2xl shadow-2xl border border-[#e2dcce] p-1.5 z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {options.length === 0 ? (
            <div className="p-3 text-center text-xs text-[#7e8779]">Không có lựa chọn nào</div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer mb-0.5 last:mb-0 ${
                    isSelected
                      ? 'bg-[#326318]/15 text-[#326318] font-bold'
                      : 'text-[#353d2f] hover:bg-[#326318]/10 hover:text-[#326318]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && <Check size={14} className="shrink-0 text-[#326318]" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}


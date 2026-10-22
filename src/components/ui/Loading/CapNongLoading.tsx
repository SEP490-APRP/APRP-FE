import React from 'react'
import logoIcon from '@/assets/logo-icon.png'

export interface CapNongLoadingProps {
  /** Thông điệp hiển thị dưới spinner */
  message?: string
  /** Thông điệp phụ (slogan / ghi chú) */
  subMessage?: string
  /** Kích thước: sm, md (mặc định), lg */
  size?: 'sm' | 'md' | 'lg'
  /** Hiển thị toàn màn hình dạng overlay */
  fullScreen?: boolean
  /** Giao diện nền: 'light' (kem ấm ấm áp), 'dark' (xanh rừng đêm sang trọng giống mẫu aemedia), 'transparent' */
  variant?: 'light' | 'dark' | 'transparent'
  className?: string
}

const SIZE_CONFIG = {
  sm: {
    container: 'w-24 h-24',
    viewBox: 120,
    rOuter: 52,
    rInner: 40,
    dashOuter: '100 240',
    dashInner: '60 200',
    iconSize: 'w-8 h-8',
    glowSize: 'w-10 h-10',
    textSize: 'text-xs',
    titleSize: 'text-xs',
  },
  md: {
    container: 'w-36 h-36',
    viewBox: 160,
    rOuter: 70,
    rInner: 54,
    dashOuter: '140 320',
    dashInner: '80 260',
    iconSize: 'w-14 h-14',
    glowSize: 'w-16 h-16',
    textSize: 'text-xs',
    titleSize: 'text-sm',
  },
  lg: {
    container: 'w-48 h-48',
    viewBox: 200,
    rOuter: 88,
    rInner: 68,
    dashOuter: '180 400',
    dashInner: '110 330',
    iconSize: 'w-20 h-20',
    glowSize: 'w-24 h-24',
    textSize: 'text-sm',
    titleSize: 'text-base',
  },
}

export const CapNongLoading: React.FC<CapNongLoadingProps> = ({
  message = 'Đang tải nông sản tươi ngon...',
  subMessage = 'CapNong · Nông sản xấu mã – ngon thật',
  size = 'md',
  fullScreen = false,
  variant = 'light',
  className = '',
}) => {
  const cfg = SIZE_CONFIG[size]
  const center = cfg.viewBox / 2

  const bgStyles = {
    light: 'bg-[#fcf9f1]/90 backdrop-blur-md text-[#20271c]',
    dark: 'bg-[#0b140b]/95 backdrop-blur-md text-white',
    transparent: 'bg-transparent text-inherit',
  }[variant]

  const isDark = variant === 'dark'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center transition-all duration-300 ${
        fullScreen
          ? `fixed inset-0 z-[9999] ${bgStyles} p-6`
          : `w-full flex-1 min-h-[calc(100vh-160px)] py-12 ${bgStyles} ${className}`
      }`}
    >
      {/* Vòng quay quỹ đạo (Orbital Rings) bao quanh Icon CapNong */}
      <div className={`relative ${cfg.container} flex items-center justify-center select-none`}>
        {/* Quầng sáng thở (Breathing Ambient Glow) */}
        <div
          className={`absolute rounded-full pointer-events-none transition-all ${
            isDark ? 'bg-emerald-400/25' : 'bg-emerald-500/20'
          } blur-2xl ${cfg.glowSize}`}
          style={{ animation: 'capnong-pulse-glow 2.4s ease-in-out infinite' }}
        />

        {/* SVG Các quỹ đạo chuyển động mượt mà */}
        <svg
          viewBox={`0 0 ${cfg.viewBox} ${cfg.viewBox}`}
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            {/* Gradient màu xanh lá nông sản tươi CapNong */}
            <linearGradient id="capnong-spin-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#86efac" stopOpacity="0" />
              <stop offset="50%" stopColor="#22c55e" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#15803d" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="capnong-spin-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ca8a04" stopOpacity="0" />
              <stop offset="60%" stopColor="#84cc16" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="1" />
            </linearGradient>

            {/* Filter phát sáng viền */}
            <filter id="capnong-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Vòng tĩnh mờ ngoài */}
          <circle
            cx={center}
            cy={center}
            r={cfg.rOuter}
            fill="none"
            stroke={isDark ? '#22c55e' : '#326318'}
            strokeWidth="1.2"
            strokeOpacity={isDark ? '0.15' : '0.12'}
          />

          {/* Vòng quay quỹ đạo ngoài (xoay thuận chiều kim đồng hồ) */}
          <g style={{ transformOrigin: `${center}px ${center}px`, animation: 'capnong-spin 2.2s linear infinite' }}>
            <circle
              cx={center}
              cy={center}
              r={cfg.rOuter}
              fill="none"
              stroke="url(#capnong-spin-grad-1)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeDasharray={cfg.dashOuter}
              filter="url(#capnong-glow)"
            />
            {/* Đốm sáng dẫn đầu quỹ đạo */}
            <circle
              cx={center + cfg.rOuter}
              cy={center}
              r="2.5"
              fill="#86efac"
              filter="url(#capnong-glow)"
            />
          </g>

          {/* Vòng tĩnh mờ trong */}
          <circle
            cx={center}
            cy={center}
            r={cfg.rInner}
            fill="none"
            stroke={isDark ? '#84cc16' : '#22c55e'}
            strokeWidth="1"
            strokeOpacity={isDark ? '0.2' : '0.15'}
            strokeDasharray="3 4"
          />

          {/* Vòng quay quỹ đạo trong (xoay ngược chiều) */}
          <g style={{ transformOrigin: `${center}px ${center}px`, animation: 'capnong-spin-reverse 3s linear infinite' }}>
            <circle
              cx={center}
              cy={center}
              r={cfg.rInner}
              fill="none"
              stroke="url(#capnong-spin-grad-2)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={cfg.dashInner}
            />
          </g>
        </svg>

        {/* Logo icon CapNong ở trung tâm với hiệu ứng nhịp thở êm dịu */}
        <div
          className="relative z-10 flex items-center justify-center pointer-events-none"
          style={{ animation: 'capnong-float 2.4s ease-in-out infinite' }}
        >
          <img
            src={logoIcon}
            alt="CapNong"
            className={`${cfg.iconSize} object-contain drop-shadow-[0_4px_10px_rgba(43,89,27,0.35)]`}
          />
        </div>
      </div>

      {/* Thông tin văn bản & Thanh tiến trình lấp lánh */}
      <div className="flex flex-col items-center text-center mt-5 px-4 select-none">
        <span
          className={`font-black tracking-wider uppercase ${cfg.titleSize} ${
            isDark ? 'text-emerald-400' : 'text-[#2b591b]'
          }`}
        >
          CapNong
        </span>

        <p
          className={`mt-1 font-semibold flex items-center gap-1.5 ${cfg.textSize} ${
            isDark ? 'text-gray-300' : 'text-[#55624d]'
          }`}
        >
          <span>{message}</span>
          <span className="flex gap-1 items-center">
            <span
              className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </span>
        </p>

        {subMessage && (
          <span
            className={`mt-1 text-[11px] font-medium tracking-tight opacity-70 ${
              isDark ? 'text-gray-400' : 'text-[#7a8572]'
            }`}
          >
            {subMessage}
          </span>
        )}

        {/* Thanh Shimmer Bar tinh tế bên dưới */}
        <div
          className={`w-28 h-1 rounded-full mt-3.5 overflow-hidden ${
            isDark ? 'bg-white/10' : 'bg-emerald-950/10'
          }`}
        >
          <div
            className="h-full w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full"
            style={{ animation: 'capnong-shimmer 1.8s ease-in-out infinite' }}
          />
        </div>
      </div>
    </div>
  )
}

export default CapNongLoading

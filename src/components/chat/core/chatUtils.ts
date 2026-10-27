// --- TIME & MEDIA UTILITY HELPERS FOR CHAT SYSTEM ---

export const parseDateValue = (timeVal: any): Date | null => {
  if (!timeVal) return null
  try {
    // 1. Java LocalDateTime mảng: [YYYY, MM, DD, HH, mm, ss, nnn]
    if (Array.isArray(timeVal) && timeVal.length >= 3) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = timeVal
      const d = new Date(year, month - 1, day, hour, minute, second)
      return isNaN(d.getTime()) ? null : d
    }

    // 2. Mảng số dính liền chuỗi dài: e.g. "20261022233017536975000"
    if (typeof timeVal === 'string' && /^\d{14,}$/.test(timeVal)) {
      const y = parseInt(timeVal.substring(0, 4), 10)
      const m = parseInt(timeVal.substring(4, 6), 10) - 1
      const d = parseInt(timeVal.substring(6, 8), 10)
      const h = parseInt(timeVal.substring(8, 10), 10)
      const min = parseInt(timeVal.substring(10, 12), 10)
      const s = parseInt(timeVal.substring(12, 14), 10)
      const parsed = new Date(y, m, d, h, min, s)
      if (!isNaN(parsed.getTime())) return parsed
    }

    // 3. Chuỗi ISO hoặc timestamp
    const d = new Date(timeVal)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

export const formatTimeShort = (timeVal: any): string => {
  const d = parseDateValue(timeVal)
  if (!d) return ''
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export const formatTimeFull = (timeVal: any): string => {
  const d = parseDateValue(timeVal)
  if (!d) return ''
  const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${timeStr} - ${dateStr}`
}

export const isAudioUrl = (url?: string, type?: string): boolean => {
  if (type === 'AUDIO') return true
  if (!url) return false
  return (
    /\.(webm|ogg|mp3|wav|m4a|aac)(\?.*)?$/i.test(url) ||
    url.includes('/video/upload/') && url.endsWith('.webm') ||
    url.startsWith('data:audio/') ||
    url.startsWith('blob:')
  )
}

export const isVideoUrl = (url?: string, type?: string): boolean => {
  if (type === 'VIDEO') return true
  if (!url) return false
  return /\.(mp4|mov|webm|avi|mkv)(\?.*)?$/i.test(url) || url.startsWith('data:video/')
}

export interface RoleBadgeInfo {
  label: string
  badgeClass: string
  avatarClass: string
}

export const getRoleBadgeInfo = (
  role?: string,
  otherUserId?: number | string,
): RoleBadgeInfo => {
  const normalized = (role || '').toUpperCase()
  const isSuperAdmin = normalized === 'ADMIN' || Number(otherUserId) === 1

  if (isSuperAdmin) {
    return {
      label: 'Ban Quản Trị CapNong',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      avatarClass: 'bg-blue-100 text-blue-800 border-blue-200',
    }
  }

  if (normalized === 'SHOP') {
    return {
      label: 'Nhà Vườn',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      avatarClass: 'bg-amber-100 text-amber-800 border-amber-200',
    }
  }

  return {
    label: 'Khách Mua Hàng',
    badgeClass: 'bg-gray-50 text-gray-700 border-gray-200',
    avatarClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  }
}

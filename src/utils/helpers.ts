import { STORAGE_KEYS } from './constants'

/* ===== Helper Functions ===== */

/**
 * Get a value from localStorage with JSON parsing
 */
export const getFromStorage = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key)
    return item ? (JSON.parse(item) as T) : null
  } catch {
    return null
  }
}

/**
 * Set a value in localStorage with JSON stringification
 */
export const setToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

/**
 * Remove a value from localStorage
 */
export const removeFromStorage = (key: string): void => {
  localStorage.removeItem(key)
}

/**
 * Get the access token from localStorage
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
}

/**
 * Set the access token in localStorage
 */
export const setAccessToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token)
}

/**
 * Clear all auth data from localStorage
 */
export const clearAuthData = (): void => {
  removeFromStorage(STORAGE_KEYS.ACCESS_TOKEN)
  removeFromStorage(STORAGE_KEYS.REFRESH_TOKEN)
  removeFromStorage(STORAGE_KEYS.USER)
}

/**
 * Format a date string to locale format
 */
export const formatDate = (dateString: string, locale = 'vi-VN'): string => {
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Debounce a function call
 */
export const debounce = <T extends (...args: Parameters<T>) => void>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Combine class names, filtering out falsy values
 */
export const cn = (...classes: (string | boolean | undefined | null)[]): string => {
  return classes.filter(Boolean).join(' ')
}

/* ===== API Response Types ===== */

/** Standard API response wrapper */
export interface ApiResponse<T> {
  data: T
  message: string
  statusCode: number
  success: boolean
}

/** Paginated API response */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

/** API error response */
export interface ApiError {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
}

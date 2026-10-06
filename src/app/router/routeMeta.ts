import type { Params } from 'react-router-dom'

export const DEFAULT_TITLE = 'Nông sản xấu mã – Ngon thật'

/** Tiêu đề tab của route; hàm khi tiêu đề phụ thuộc params (VD trang 404). */
export type RouteHandle = { title: string | ((params: Params) => string) }

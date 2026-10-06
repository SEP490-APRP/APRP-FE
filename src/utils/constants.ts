/** Key localStorage dùng chung, tránh gõ lại chuỗi ở nhiều nơi rồi lệch nhau. */
export const STORAGE_KEYS = {
  CART: 'capnong-cart',
  USER: 'capnong-user',
  TOKEN: 'capnong-token',
  FARMER_TOUR_DONE: 'capnong_farmer_tour_done',
} as const

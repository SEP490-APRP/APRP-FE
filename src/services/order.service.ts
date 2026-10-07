import type { ApiResponse } from '@/types'
import type { OrderResponse } from './order.types'
import { mockOrders } from '@/mocks/order.mock'
import { freshResponses } from '@/mocks/fresh'

export type * from './order.types'

export const orderService = freshResponses({
  async getAllOrders(): Promise<ApiResponse<OrderResponse[]>> {
    await new Promise((r) => setTimeout(r, 200))
    return { code: 200, result: [...mockOrders] }
  },

  async getOrderById(id: number): Promise<ApiResponse<OrderResponse>> {
    await new Promise((r) => setTimeout(r, 150))
    const o = mockOrders.find((order) => order.id === id) || mockOrders[0]
    return { code: 200, result: o }
  },
})

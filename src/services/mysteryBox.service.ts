import type { ApiResponse } from '@/types'
import type { MysteryBox } from './mysteryBox.types'
import { mockMysteryBoxes } from '@/mocks/mysteryBox.mock'
import { freshResponses } from '@/mocks/fresh'

export type * from './mysteryBox.types'

export const mysteryBoxService = freshResponses({
  async getForBuyer(): Promise<ApiResponse<MysteryBox[]>> {
    await new Promise((r) => setTimeout(r, 150))
    return { code: 200, result: [...mockMysteryBoxes] }
  },
})

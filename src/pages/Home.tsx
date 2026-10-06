import {
  AiFeatures,
  Categories,
  CombosTeaser,
  FarmerStory,
  Hero,
  Newsletter,
  RescueProcess,
  Testimonials,
  TodayRescue,
} from '@/features/home'
import type { Cart } from '@/mocks/catalog'

type HomeProps = {
  onAdd: (id: string) => void
  onInfo: (title: string) => void
  cart?: Cart
}

/**
 * Trước đây Home bắt mọi click rồi đọc chữ trên link (regex "Đăng ký|Xem bảo chứng|...")
 * để quyết định hành động. Cách đó chặn nhầm link "Đăng ký mua nông sản" (mở popup demo
 * thay vì trang đăng ký) và hỏng ngay khi đổi chữ. Giờ mỗi section tự nhận handler rõ ràng.
 */
export default function Home({ onAdd, onInfo, cart }: HomeProps) {
  return (
    <>
      <Hero />
      <Categories />
      <TodayRescue onAdd={onAdd} cart={cart} />
      <CombosTeaser onAdd={onAdd} />
      <RescueProcess onInfo={onInfo} />
      <AiFeatures onInfo={onInfo} />
      <FarmerStory />
      <Testimonials />
      <Newsletter onInfo={onInfo} />
    </>
  )
}

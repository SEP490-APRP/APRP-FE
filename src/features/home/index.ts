export { default as AiFeatures } from './components/AiFeatures'
export { default as Categories } from './components/Categories'
export { default as CombosTeaser } from './components/CombosTeaser'
export { default as FarmerStory } from './components/FarmerStory'
export { default as Hero } from './components/Hero'
export { default as Newsletter } from './components/Newsletter'
export { default as RescueProcess } from './components/RescueProcess'
export { default as Testimonials } from './components/Testimonials'
export { default as TodayRescue } from './components/TodayRescue'

/**
 * Id các section trên trang chủ. Link dạng #/quy-trinh mở trang chủ và cuộn tới section;
 * đường dẫn một cấp không nằm trong danh sách này là trang 404.
 */
export const HOME_SECTION_IDS = [
  'danh-muc',
  'giai-cuu-hom-nay',
  'quy-trinh',
  'cong-dong-tieu-dung',
  'dang-ky-dong-hanh',
  'newsletter-contact',
] as const

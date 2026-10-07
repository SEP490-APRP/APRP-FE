import { useState } from 'react'
import {
  Sparkles,
  UtensilsCrossed,
  Search,
  ShieldCheck,
  Flame,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  Camera,
  Info,
  ChefHat
} from 'lucide-react'

interface AiPageProps {
  onInfo?: (msg: string) => void
}

// 3 Chế độ ăn mẫu cho Trụ Cột 3 (FE-04)
const MEAL_PLANS = [
  {
    id: 'family',
    title: '👨‍👩‍👧‍👦 Cơm Nhà 4 Người',
    subtitle: 'Mâm cơm ấm cúng, đậm vị quê',
    descSummary: 'Mâm cơm ấm cúng, đậm vị quê, nguyên liệu giải cứu trong ngày',
    budgetDay: '58.000đ',
    originalCost: '115.000đ',
    savedPercent: '-50%',
    calories: '650 kcal/người',
    prepTime: '25 phút',
    rescueProduce: [
      { name: 'Cà rốt Đà Lạt (xấu mã)', qty: '0.5 kg', saved: '12.000đ' },
      { name: 'Bắp cải xoăn Cầu Đất', qty: '1 bắp', saved: '15.000đ' },
      { name: 'Cà chua chín muộn', qty: '0.4 kg', saved: '10.000đ' },
    ],
    meals: [
      {
        mealType: 'Bữa trưa',
        name: 'Canh Bắp Cải Cuộn Thịt & Cà Rốt Hầm',
        desc: 'Nước dùng ngọt thanh tự nhiên từ củ quả giải cứu, giữ trọn vị tươi mát.',
        image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80',
        cookTime: '20p',
      },
      {
        mealType: 'Bữa tối',
        name: 'Củ Quả Kho Quẹt & Đĩa Rau Luộc Thập Cẩm',
        desc: 'Món ăn dân dã giòn ngọt từ ngọn cải và cà rốt luộc chấm sốt kho quẹt đậm đà.',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80',
        cookTime: '15p',
      },
    ],
  },
  {
    id: 'eatclean',
    title: '🥗 Eat Clean & Giữ Dáng',
    subtitle: 'Ăn ngon, vóc dáng chuẩn tự nhiên',
    descSummary: 'Thực đơn giàu chất xơ, vitamin, ít tinh bột chế biến sẵn',
    budgetDay: '39.000đ',
    originalCost: '85.000đ',
    savedPercent: '-54%',
    calories: '430 kcal/người',
    prepTime: '15 phút',
    rescueProduce: [
      { name: 'Bí đỏ hồ lô vỏ nám', qty: '0.6 kg', saved: '14.000đ' },
      { name: 'Cần tây lá xoăn', qty: '0.3 kg', saved: '16.000đ' },
      { name: 'Bưởi da xanh rám vỏ', qty: '1 quả', saved: '32.000đ' },
    ],
    meals: [
      {
        mealType: 'Bữa sáng',
        name: 'Nước Ép Cần Tây, Táo & Bưởi Da Xanh',
        desc: 'Thanh lọc cơ thể, ngọt thanh mát từ tép bưởi mọng nước dù vỏ ngoài rám sần.',
        image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=700&q=80',
        cookTime: '5p',
      },
      {
        mealType: 'Bữa chính',
        name: 'Salad Bí Đỏ Nướng & Ức Gà Xé',
        desc: 'Bí đỏ nướng thơm bùi kết hợp sốt giấm táo hạt chia ít calo.',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80',
        cookTime: '15p',
      },
    ],
  },
  {
    id: 'budget',
    title: '⚡ Sinh Viên',
    subtitle: 'Nhanh gọn, siêu tiết kiệm',
    descSummary: 'Siêu rẻ, nấu nhanh, tối đa năng lượng cho ngày bận rộn',
    budgetDay: '22.000đ',
    originalCost: '48.000đ',
    savedPercent: '-54%',
    calories: '550 kcal/người',
    prepTime: '12 phút',
    rescueProduce: [
      { name: 'Khoai tây bi tự nhiên', qty: '0.5 kg', saved: '11.000đ' },
      { name: 'Hành tây vỏ sẫm', qty: '0.3 kg', saved: '8.000đ' },
      { name: 'Cà rốt baby phân nhánh', qty: '0.3 kg', saved: '7.000đ' },
    ],
    meals: [
      {
        mealType: 'Món nhanh',
        name: 'Khoai Tây Xào Bò Bằm & Canh Súp',
        desc: 'Tận dụng khoai bi giòn bùi nấu canh súp bổ dưỡng chỉ với 1 nồi duy nhất.',
        image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=700&q=80',
        cookTime: '12p',
      },
      {
        mealType: 'Ăn kèm',
        name: 'Trứng Bác Cà Chua & Hành Tây Ngọt',
        desc: 'Món quốc dân đậm đà hao cơm với vị ngọt tự nhiên từ hành tây giải cứu.',
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80',
        cookTime: '8p',
      },
    ],
  },
]

export default function AiPage({ onInfo }: AiPageProps) {
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0)
  const currentPlan = MEAL_PLANS[selectedPlanIdx]

  return (
    <div className="w-full bg-[#fbf9f4] text-[#1c2216] min-h-screen pb-16 font-sans">
      {/* 1. HERO HEADER: Bố cục 2 cột cân đối như Figma */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Cột trái: Tiêu đề to đậm */}
          <div className="md:col-span-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e7f4dd] border border-[#a4e876]/40 text-[#254b12] text-[11px] font-bold uppercase tracking-wider mb-3 shadow-xs">
              <span>🍃</span>
              <span>HỆ THỐNG NÔNG SẢN CAPNONG ·</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1c2216] tracking-tight leading-tight">
              Nông Sản Giải Cứu.<br />
              Mâm Cơm Tiết Kiệm.<br />
              <span className="text-[#326318]">Nhờ Trợ Lý Bếp Thông Minh.</span>
            </h1>
          </div>

          {/* Cột phải: Mô tả & ghi chú */}
          <div className="md:col-span-5 md:pl-4">
            <p className="text-xs sm:text-sm text-[#5f6b57] leading-relaxed mb-3">
              Không còn đau đầu với câu hỏi <strong className="text-[#1c2216]">"Hôm nay ăn gì?"</strong>. 
              AI của CapNong tự động kết nối nguồn nông sản dư thừa tồn kho thành thực đơn 7 ngày ngon miệng, 
              đủ chất và giúp bạn tiết kiệm tới 50% tiền chợ mỗi bữa.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#326318]">
              <span>💡</span>
              <span>Tính năng cốt lõi được quan tâm nhất năm</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRỌNG TÂM CHIẾN LƯỢC: TRỤ CỘT 3 - AI MEAL PLANNING (FE-04) - GIAO DIỆN SÁNG CHUẨN FIGMA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-white rounded-3xl p-5 sm:p-7 lg:p-8 border border-[#e5e2da] shadow-sm">
          {/* Header của thẻ FE-04 */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-[#f0ede4]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e7f4dd] text-[#254b12] text-[11px] font-bold uppercase tracking-wider mb-2">
                <ChefHat size={13} />
                <span>TRỌNG TÂM NỀN TẢNG</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1c2216] tracking-tight">
                Trợ Lý Bếp AI: Lên Thực Đơn Từ Kho Tồn Sàn
              </h2>
            </div>
            <p className="text-xs text-[#5f6b57] leading-relaxed max-w-md">
              Cơ chế độc quyền: AI phân tích sản lượng rau củ các nhà vườn đang cần giải cứu 
              để lên mâm cơm cá nhân hóa, tự tính calo và gom trọn bộ combo nấu ăn với giá tiết kiệm nhất.
            </p>
          </div>

          {/* Bộ chọn 3 nhu cầu (Chọn nhu cầu của bạn) - 3 thẻ ngang như Figma */}
          <div className="mt-5 mb-6">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1c2216] mb-3">
              <span className="text-[#326318]">🍲</span>
              <span>Chọn nhu cầu của bạn</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MEAL_PLANS.map((plan, idx) => {
                const isActive = selectedPlanIdx === idx
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanIdx(idx)}
                    className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                      isActive
                        ? 'border-[#326318] bg-[#f4f9f0] shadow-xs ring-1 ring-[#326318]/20'
                        : 'border-[#e5e2da] bg-white hover:border-[#326318]/50 hover:bg-[#fafaf8]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs sm:text-sm text-[#1c2216]">
                        {plan.title}
                      </span>
                      {isActive && (
                        <CheckCircle2 size={16} className="text-[#326318] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#5f6b57] line-clamp-1">
                      {plan.subtitle}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Nội dung chi tiết: 2 Món ăn bên trái + Bảng nguyên liệu chi phí bên phải */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Cột trái: Gợi ý món ăn hôm nay (7 cột) */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between text-xs text-[#5f6b57]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1c2216]">
                  <UtensilsCrossed size={14} className="text-[#326318]" />
                  <span>Gợi ý món ăn hôm nay</span>
                </div>
                <span className="bg-[#f5f5f0] px-2.5 py-0.5 rounded-full text-[11px] font-medium text-[#5f6b57]">
                  ⏱️ Chuẩn bị: {currentPlan.prepTime}
                </span>
              </div>
              <p className="text-[11px] text-[#5f6b57] -mt-1 mb-1">
                {currentPlan.descSummary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
                {currentPlan.meals.map((m, mIdx) => (
                  <div
                    key={mIdx}
                    className="bg-white rounded-2xl overflow-hidden border border-[#e5e2da] flex flex-col justify-between shadow-xs hover:border-[#326318]/40 transition-all"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                      <img
                        src={m.image}
                        alt={m.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded border border-white/10">
                        {m.mealType}
                      </span>
                    </div>

                    <div className="p-3.5 flex flex-col flex-1 justify-between">
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-[#1c2216] leading-snug line-clamp-1">
                          {m.name}
                        </h4>
                        <p className="text-[#5f6b57] text-[11px] mt-1 leading-relaxed line-clamp-2">
                          {m.desc}
                        </p>
                      </div>

                      <div className="pt-2.5 mt-2.5 border-t border-[#f0ede4] flex items-center justify-between text-[10px] text-[#5f6b57]">
                        <span className="flex items-center gap-1 text-[#8a4e1d] font-medium">
                          <Clock size={11} />
                          Nấu: {m.cookTime}
                        </span>
                        <span className="text-[#326318] font-bold flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          Chuẩn vị tươi
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột phải: Bảng Nguyên liệu & Chi phí (5 cột) - Màu xanh nhạt sang trọng */}
            <div className="lg:col-span-5 bg-[#f4f7f0] rounded-2xl p-4 sm:p-5 border border-[#e0e9d8] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#e0e9d8]">
                  <div>
                    <h3 className="text-xs font-bold text-[#1c2216] uppercase tracking-wider flex items-center gap-1">
                      <span>📋</span>
                      <span>Nguyên liệu & chi phí</span>
                    </h3>
                    <span className="text-[10px] text-[#5f6b57] block mt-0.5">
                      Nguyên liệu giải cứu trong kho
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#e7f4dd] text-[#254b12] font-black border border-[#a4e876]/40">
                    Tiết kiệm {currentPlan.savedPercent}
                  </span>
                </div>

                {/* Danh sách nông sản */}
                <div className="py-3 space-y-2.5">
                  {currentPlan.rescueProduce.map((item, pIdx) => (
                    <div
                      key={pIdx}
                      className="flex items-center justify-between text-xs bg-white/70 px-3 py-2 rounded-xl border border-black/5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#326318]" />
                        <div>
                          <strong className="text-[#1c2216] block font-semibold">{item.name}</strong>
                          <span className="text-[10px] text-[#5f6b57]">Khẩu phần: {item.qty}</span>
                        </div>
                      </div>
                      <span className="text-xs text-[#8a4e1d] font-bold">
                        - {item.saved}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tổng chi phí & Calo */}
                <div className="pt-2 border-t border-[#e0e9d8] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[#5f6b57] text-[11px]">
                    <span>Tổng năng lượng:</span>
                    <strong className="text-[#1c2216] flex items-center gap-1">
                      <Flame size={12} className="text-[#e67e22]" />
                      {currentPlan.calories}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[#5f6b57] text-[11px]">
                    <span>Giá nếu mua ngoài chợ:</span>
                    <span className="line-through text-[#8c9684]">{currentPlan.originalCost}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-[#1c2216]">Chi phí trọn gói mâm cơm:</span>
                    <span className="text-2xl font-black text-[#254b12]">
                      {currentPlan.budgetDay}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút Mua Trọn Combo 1-Click */}
              <div className="mt-4 pt-2.5 border-t border-[#e0e9d8]">
                <a
                  href="/combo-tui-mu"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#254b12] hover:bg-[#1a350c] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <ShoppingBag size={15} />
                  <span>Mua trọn combo nguyên liệu</span>
                </a>
                <p className="text-[10px] text-center text-[#5f6b57] mt-2">
                  * Nông sản được tự động đóng gói từ các nhà vườn đang dư hàng hôm nay
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BỘ ĐÔI TRỤ CỘT BỔ TRỢ (FE-03 & FE-02): CHUẨN XÁC THEO FIGMA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#326318] block mb-1">
              CÔNG NGHỆ BỔ TRỢ HỆ SINH THÁI
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#1c2216] tracking-tight">
              Hai Trụ Cột Hỗ Trợ Toàn Diện
            </h3>
          </div>
          <p className="text-xs text-[#5f6b57] max-w-md">
            Đảm bảo tính minh bạch, tiện lợi từ lúc nông dân đăng bán đến khi người mua nhận hàng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* TRỤ CỘT 2: FE-03 - VISUAL SEARCH */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-[#e5e2da] hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6b57] flex items-center gap-1">
                  <span>🛒</span>
                  <span>DÀNH CHO NGƯỜI MUA</span>
                </span>
              </div>

              <h4 className="text-base font-black text-[#1c2216] mb-1.5">
                Tìm Kiếm Nông Sản Bằng Hình Ảnh (Visual Search)
              </h4>
              <p className="text-xs text-[#5f6b57] leading-relaxed mb-4">
                Người mua chỉ cần chụp ảnh một củ quả ngoài chợ hoặc chụp đĩa ăn yêu thích, AI phân tích các đặc trưng thị giác để tìm đúng nông sản giải cứu tương ứng có giá rẻ nhất trên sàn.
              </p>

              {/* Demo mockup Visual Search */}
              <div className="bg-[#fbf9f4] rounded-2xl p-3 border border-[#e5e2da]/70 flex items-center gap-3 mb-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-black/10">
                  <img
                    src="https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=200&q=80"
                    alt="Quét tìm kiếm"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#326318]/20 flex items-center justify-center">
                    <Camera size={16} className="text-white drop-shadow" />
                  </div>
                </div>

                <div className="flex-1 text-xs">
                  <div className="font-bold text-[#1c2216] flex items-center gap-1">
                    <span>AI nhận diện:</span>
                    <span className="text-[#326318]">Cà Rốt (Độ khớp 96%)</span>
                  </div>
                  <p className="text-[11px] text-[#5f6b57] mt-0.5">
                    Tìm thấy: <strong className="text-[#1c2216]">4 gian hàng giải cứu</strong> từ 18.000đ/kg
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-[#326318] font-bold bg-[#e7f4dd] px-2 py-0.5 rounded">
                    ✓ Tiết kiệm 48% so với siêu thị
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-[#e5e2da] flex items-center justify-between text-xs">
              <span className="text-[#5f6b57] text-[11px]">Hỗ trợ ảnh chụp thực phẩm & món ăn</span>
              <a
                href="/nong-san-tuoi"
                className="font-bold text-[#326318] hover:underline inline-flex items-center gap-1 text-[11px]"
              >
                <span>Thử tìm kiếm</span>
                <ArrowRight size={12} />
              </a>
            </div>
          </div>

          {/* TRỤ CỘT 1: FE-02 - IMAGE VERIFICATION */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-[#e5e2da] hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6b57] flex items-center gap-1">
                  <span>🌾</span>
                  <span>DÀNH CHO NHÀ VƯỜN</span>
                </span>
              </div>

              <h4 className="text-base font-black text-[#1c2216] mb-1.5">
                Kiểm Duyệt Hình Ảnh Tự Động Khi Đăng Bán
              </h4>
              <p className="text-xs text-[#5f6b57] leading-relaxed mb-4">
                Khi nông dân chụp hình nông sản đăng lên sàn, mô hình Computer Vision tự động xác thực: ảnh có chứa nông sản hợp lệ hay không, ngăn chặn 100% ảnh rác, ảnh mạng và tin lừa đảo.
              </p>

              {/* Demo mockup Image Moderation */}
              <div className="bg-[#fbf9f4] rounded-2xl p-3 border border-[#e5e2da]/70 flex items-center gap-3 mb-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-black/10 bg-white flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=200&q=80"
                    alt="Xác thực ảnh nông sản"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 right-1 bg-[#326318] text-white p-0.5 rounded-full">
                    <CheckCircle2 size={11} />
                  </div>
                </div>

                <div className="flex-1 text-xs">
                  <div className="font-bold text-[#1c2216] flex items-center gap-1">
                    <span>Trạng thái:</span>
                    <span className="text-[#326318] font-bold">Đã duyệt tự động</span>
                  </div>
                  <p className="text-[11px] text-[#5f6b57] mt-0.5">
                    Phát hiện: <strong className="text-[#1c2216]">Rau Bắp Cải (Hợp lệ)</strong>
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-[#326318] font-bold bg-[#e7f4dd] px-2 py-0.5 rounded">
                    🛡️ Tuân thủ tiêu chuẩn sàn CapNong
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-[#e5e2da] flex items-center justify-between text-xs">
              <span className="text-[#5f6b57] text-[11px]">Xử lý trong dưới 1 giây</span>
              <a
                href="/dang-ky?role=shop"
                className="font-bold text-[#326318] hover:underline inline-flex items-center gap-1 text-[11px]"
              >
                <span>Dành cho nhà vườn</span>
                <ArrowRight size={12} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOOTER NOTE */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 text-[11px] font-medium text-[#5f6b57] bg-white px-4 py-2 rounded-full border border-[#e5e2da] shadow-xs">
          <Info size={14} className="text-[#326318] shrink-0" />
          <span>
            Hệ thống AI CapNong luôn tuân thủ tính minh bạch thuật toán · Tập trung hỗ trợ nhà vườn giải phóng tồn kho và tối ưu chi tiêu bữa ăn gia đình.
          </span>
        </div>
      </section>
    </div>
  )
}

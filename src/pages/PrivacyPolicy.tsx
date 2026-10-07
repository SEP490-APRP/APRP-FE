import React, { useState } from 'react'
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  UserCheck,
  Database,
  PhoneCall,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Mail,
  MapPin,
  Sparkles,
  Cpu,
} from 'lucide-react'

interface PrivacyPolicyProps {
  onNavigateHome?: () => void
}

export default function PrivacyPolicy({ onNavigateHome }: PrivacyPolicyProps) {
  const [activeSection, setActiveSection] = useState('muc-dich')

  const SECTIONS = [
    { id: 'muc-dich', title: '1. Mục đích thu thập thông tin', icon: FileText },
    { id: 'loai-thong-tin', title: '2. Phạm vi dữ liệu thu thập', icon: Database },
    { id: 'su-dung', title: '3. Mục đích sử dụng dữ liệu', icon: Eye },
    { id: 'bao-ve', title: '4. Biện pháp an toàn & Bảo mật', icon: Lock },
    { id: 'tai-chinh', title: '5. Bảo mật thanh toán & Ví tiền', icon: ShieldCheck },
    { id: 'quyen-han', title: '6. Quyền của người dùng', icon: UserCheck },
    { id: 'ai-cookie', title: '7. Cookie & Công nghệ AI', icon: Cpu },
    { id: 'lien-he', title: '8. Liên hệ & Giải quyết khiếu nại', icon: PhoneCall },
  ]

  const scrollTo = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="bg-[#fcf9f1] min-h-screen text-[#2c2416] pb-20">
      {/* 1. TOP BREADCRUMB & HERO BANNER */}
      <div className="bg-gradient-to-b from-[#254b12] to-[#326318] text-white pt-8 pb-16 px-4 sm:px-6 relative overflow-hidden">
        {/* Background decorative patterns */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#a3e635]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-white/70 mb-6">
            <button
              type="button"
              onClick={
                onNavigateHome ||
                (() => {
                  window.location.hash = '/'
                })
              }
              className="hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Trang chủ</span>
            </button>
            <span>/</span>
            <span className="text-white font-bold">Chính sách bảo mật thông tin</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-[#ddedcd] text-xs font-black uppercase tracking-wider mb-4">
            <ShieldCheck size={16} className="text-[#a3e635]" />
            <span>Cam kết minh bạch &amp; an toàn dữ liệu 100%</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
            Chính Sách Bảo Mật Thông Tin
          </h1>

          <p className="text-sm sm:text-base text-white/85 max-w-3xl leading-relaxed">
            CapNong tôn trọng và cam kết bảo vệ quyền riêng tư cá nhân của người mua hàng, nhà vườn
            đối tác và đơn vị vận chuyển. Mọi quy trình xử lý dữ liệu đều tuân thủ nghiêm ngặt theo
            Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân tại Việt Nam.
          </p>
        </div>
      </div>

      {/* 2. MAIN CONTENT LAYOUT (SIDEBAR NAV + DETAILED SECTIONS) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sticky Table of Contents */}
          <aside className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-[#e8ece3] shadow-sm">
              <h2 className="text-xs font-black text-[#7e8779] uppercase tracking-wider mb-4 px-2">
                Mục lục chính sách
              </h2>
              <nav className="space-y-1">
                {SECTIONS.map((sec) => {
                  const Icon = sec.icon
                  const isActive = activeSection === sec.id
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => scrollTo(sec.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#326318] text-white shadow-sm'
                          : 'text-[#566050] hover:bg-[#f1f5ee] hover:text-[#1c2216]'
                      }`}
                    >
                      <Icon
                        size={16}
                        className={`shrink-0 ${isActive ? 'text-white' : 'text-[#879181]'}`}
                      />
                      <span className="flex-1 truncate">{sec.title}</span>
                      <ChevronRight size={14} className={isActive ? 'opacity-90' : 'opacity-40'} />
                    </button>
                  )
                })}
              </nav>

              <div className="mt-6 pt-5 border-t border-[#f1f4ed] text-xs text-[#7e8779] space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#326318]">
                  <Sparkles size={14} />
                  <span>Tổng đài bảo mật thông tin</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Cần hỗ trợ gấp về quyền riêng tư hoặc tài khoản?
                </p>
                <a
                  href="tel:19001234"
                  className="block w-full text-center py-2 rounded-xl bg-[#f4f7f0] hover:bg-[#ebf1e5] text-[#326318] font-black transition-colors"
                >
                  Hotline: 1900 1234
                </a>
              </div>
            </div>
          </aside>

          {/* Right Detailed Body Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Section 1 */}
            <section
              id="muc-dich"
              className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8ece3] shadow-sm scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#326318]/10 text-[#326318] flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <h2 className="text-xl font-black text-[#1c2216]">
                  1. Mục Đích Thu Thập Thông Tin
                </h2>
              </div>
              <div className="text-xs sm:text-sm text-[#4d5648] space-y-3 leading-relaxed">
                <p>
                  CapNong thu thập thông tin cá nhân của người dùng nhằm mục đích cung cấp giải pháp
                  sàn kết nối nông nghiệp bền vững, hỗ trợ tiêu thụ nông sản tươi và các hộp túi mù
                  giải cứu.
                </p>
                <div className="bg-[#f7faf5] rounded-2xl p-4 border border-[#e2ebd9] space-y-2">
                  <div className="font-black text-[#326318] text-xs uppercase">
                    Các mục đích cốt lõi gồm:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-[#525d4c]">
                    <li>
                      Xác thực và tạo đơn đặt hàng nông sản, túi mù trực tiếp từ các nhà vườn đối
                      tác.
                    </li>
                    <li>
                      Điều phối đội ngũ shipper giao nhận đơn hàng nông sản nhanh nhất, đảm bảo độ
                      tươi mới và dinh dưỡng.
                    </li>
                    <li>
                      Thanh toán trực tuyến và đối soát số dư tiền bán hàng minh bạch cho nông dân.
                    </li>
                    <li>
                      Gửi thông báo tiến độ giao hàng, phản hồi khiếu nại và đổi trả nếu nông sản bị
                      hư hao do vận chuyển.
                    </li>
                    <li>
                      Cải tiến trải nghiệm người dùng thông qua công nghệ phân tích chất lượng nông
                      sản AI.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section
              id="loai-thong-tin"
              className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8ece3] shadow-sm scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#2d5c99]/10 text-[#2d5c99] flex items-center justify-center font-bold">
                  <Database size={20} />
                </div>
                <h2 className="text-xl font-black text-[#1c2216]">2. Phạm Vi Dữ Liệu Thu Thập</h2>
              </div>
              <div className="text-xs sm:text-sm text-[#4d5648] space-y-4 leading-relaxed">
                <p>
                  Tùy thuộc vào vai trò của bạn trong hệ sinh thái CapNong (Người mua hàng, Nhà vườn
                  hoặc Đối tác giao hàng), chúng tôi sẽ thu thập các trường thông tin tương ứng:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#fafcf9] border border-[#edf3e8]">
                    <div className="font-extrabold text-[#326318] mb-1.5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#326318]" />
                      Dành cho Người mua (Buyer)
                    </div>
                    <ul className="text-xs text-[#5f6959] space-y-1 list-disc list-inside">
                      <li>Họ và tên, số điện thoại, địa chỉ nhận hàng.</li>
                      <li>Lịch sử đơn hàng, sản phẩm yêu thích và số lượng túi mù đã mua.</li>
                      <li>Đánh giá chất lượng sản phẩm và phản hồi dịch vụ.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#fdfbf6] border border-[#f5eedf]">
                    <div className="font-extrabold text-[#8a4e1d] mb-1.5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#8a4e1d]" />
                      Dành cho Nhà vườn (Farmer / Shop)
                    </div>
                    <ul className="text-xs text-[#6e5d48] space-y-1 list-disc list-inside">
                      <li>Tên chủ vườn, tên Hợp tác xã (HTX), số điện thoại liên hệ.</li>
                      <li>Địa chỉ vườn thu hoạch, kho tập kết nông sản.</li>
                      <li>Chứng nhận VietGAP / Hữu cơ (nếu có) để xét duyệt đăng bán.</li>
                      <li>Thông tin tài khoản ngân hàng để chuyển tiền bán nông sản.</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#f5f8fc] border border-[#e1eaf7]">
                  <div className="font-extrabold text-[#2d5c99] mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2d5c99]" />
                    Dành cho Tài xế vận chuyển (Shipper)
                  </div>
                  <p className="text-xs text-[#52637a]">
                    Họ tên tài xế, số điện thoại, biển số xe, tải trọng phương tiện và vị trí tọa độ
                    khi đang thực hiện chuyến giao nông sản từ vườn đến kho.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section
              id="su-dung"
              className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8ece3] shadow-sm scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#16a34a]/10 text-[#16a34a] flex items-center justify-center font-bold">
                  <Eye size={20} />
                </div>
                <h2 className="text-xl font-black text-[#1c2216]">
                  3. Mục Đích &amp; Nguyên Tắc Sử Dụng Dữ Liệu
                </h2>
              </div>
              <div className="text-xs sm:text-sm text-[#4d5648] space-y-3 leading-relaxed">
                <p>
                  CapNong chỉ sử dụng thông tin cá nhân trong phạm vi đã thông báo và được người
                  dùng đồng ý. Chúng tôi thực hiện nguyên tắc:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#f8faf6] border border-[#e9eee5]">
                    <CheckCircle2 size={16} className="text-[#326318] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-[#1c2216]">Minh bạch tuyệt đối</div>
                      <div className="text-[11px] text-[#717a6c] mt-0.5">
                        Không sử dụng thông tin cho mục đích ngoài các dịch vụ cung cấp trên sàn.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#f8faf6] border border-[#e9eee5]">
                    <CheckCircle2 size={16} className="text-[#326318] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-[#1c2216]">
                        Không phát tán rác (No Spam)
                      </div>
                      <div className="text-[11px] text-[#717a6c] mt-0.5">
                        Chỉ gửi thông báo trạng thái đơn hàng và các tin mùa vụ quan trọng.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#f8faf6] border border-[#e9eee5]">
                    <CheckCircle2 size={16} className="text-[#326318] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-[#1c2216]">Giới hạn nội bộ</div>
                      <div className="text-[11px] text-[#717a6c] mt-0.5">
                        Shipper chỉ xem được địa chỉ và số điện thoại khi đơn hàng đang trong hành
                        trình giao.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#f8faf6] border border-[#e9eee5]">
                    <CheckCircle2 size={16} className="text-[#326318] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-[#1c2216]">Bảo vệ người tiêu dùng</div>
                      <div className="text-[11px] text-[#717a6c] mt-0.5">
                        Ẩn một phần số điện thoại khi hiển thị đánh giá công khai trên website.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section
              id="bao-ve"
              className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8ece3] shadow-sm scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#b45309]/10 text-[#b45309] flex items-center justify-center font-bold">
                  <Lock size={20} />
                </div>
                <h2 className="text-xl font-black text-[#1c2216]">
                  4. Biện Pháp An Toàn &amp; Kỹ Thuật Bảo Mật
                </h2>
              </div>
              <div className="text-xs sm:text-sm text-[#4d5648] space-y-4 leading-relaxed">
                <p>
                  Hạ tầng máy chủ của CapNong được thiết kế theo tiêu chuẩn an ninh thông tin nhiều
                  lớp để phòng ngừa các cuộc tấn công mạng, rò rỉ dữ liệu hoặc xâm nhập trái phép:
                </p>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#fafcf9] border border-[#e6eee1]">
                    <div className="font-bold text-xs text-[#1c2216] flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#326318] text-white text-[10px] font-black">
                        HTTPS / SSL
                      </span>
                      Mã hóa toàn bộ lưu lượng web
                    </div>
                    <p className="text-xs text-[#626d5d] mt-1">
                      Chứng chỉ số SSL 256-bit bảo đảm việc truyền dữ liệu giữa trình duyệt của bạn
                      và hệ thống CapNong hoàn toàn bảo mật, không bị nghe lén hay sửa đổi.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#fafcf9] border border-[#e6eee1]">
                    <div className="font-bold text-xs text-[#1c2216] flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#2d5c99] text-white text-[10px] font-black">
                        HASH BCRYPT
                      </span>
                      Mã hóa mật khẩu một chiều
                    </div>
                    <p className="text-xs text-[#626d5d] mt-1">
                      Mật khẩu của bạn được băm một chiều bằng thuật toán mã hóa tiên tiến. Ngay cả
                      đội ngũ kỹ thuật của CapNong cũng không thể xem hoặc giải mã mật khẩu gốc của
                      bạn.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#fafcf9] border border-[#e6eee1]">
                    <div className="font-bold text-xs text-[#1c2216] flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#b45309] text-white text-[10px] font-black">
                        FIREWALL &amp; DDOS
                      </span>
                      Hệ thống tường lửa đa tầng
                    </div>
                    <p className="text-xs text-[#626d5d] mt-1">
                      Giám sát luồng truy cập thời gian thực 24/7, tự động chặn các lượt quét lỗ
                      hổng và tấn công mạng từ chối dịch vụ.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section
              id="tai-chinh"
              className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8ece3] shadow-sm scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#326318]/10 text-[#326318] flex items-center justify-center font-bold">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-xl font-black text-[#1c2216]">
                  5. Bảo Mật Giao Dịch &amp; Ví Tiền Nhà Vườn
                </h2>
              </div>
              <div className="text-xs sm:text-sm text-[#4d5648] space-y-3 leading-relaxed">
                <p>
                  Đối với các giao dịch tài chính, rút tiền về tài khoản ngân hàng của nông dân và
                  thanh toán của khách hàng:
                </p>
                <div className="bg-[#fcf8f0] p-4 rounded-2xl border border-[#faecd5] space-y-2">
                  <div className="font-bold text-xs text-[#8a4e1d]">Cam kết bảo vệ tài chính:</div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-[#6e5d48]">
                    <li>
                      Mọi yêu cầu rút tiền đều yêu cầu xác nhận tài khoản chính chủ qua SMS/Email
                      OTP hoặc xác thực ngân hàng.
                    </li>
                    <li>
                      Lịch sử giao dịch được ghi nhận bất biến, giúp nhà vườn dễ dàng đối soát số dư
                      khả dụng và số dư chờ quyết toán.
                    </li>
                    <li>
                      CapNong kết nối với các cổng thanh toán được Ngân hàng Nhà nước cấp phép,
                      không lưu trữ thông tin thẻ thanh toán quốc tế (CVV/CVC) trên máy chủ.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section
              id="quyen-han"
              className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8ece3] shadow-sm scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#e5a00d]/10 text-[#b47a05] flex items-center justify-center font-bold">
                  <UserCheck size={20} />
                </div>
                <h2 className="text-xl font-black text-[#1c2216]">
                  6. Quyền Hạn Của Bạn Đối Với Dữ Liệu
                </h2>
              </div>
              <div className="text-xs sm:text-sm text-[#4d5648] space-y-3 leading-relaxed">
                <p>
                  Người dùng có toàn quyền kiểm soát thông tin cá nhân của mình trên CapNong theo
                  quy định pháp luật:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#fafcf9] border border-[#e8ece3]">
                    <div className="font-extrabold text-xs text-[#1c2216]">✏️ Quyền chỉnh sửa</div>
                    <div className="text-xs text-[#6b7565] mt-1">
                      Cập nhật họ tên, địa chỉ, ảnh đại diện, thông tin nông trại trực tiếp trong
                      mục Hồ sơ cá nhân.
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#fafcf9] border border-[#e8ece3]">
                    <div className="font-extrabold text-xs text-[#1c2216]">
                      🗑️ Quyền xóa tài khoản
                    </div>
                    <div className="text-xs text-[#6b7565] mt-1">
                      Gửi yêu cầu đóng tài khoản và xóa vĩnh viễn thông tin cá nhân khỏi hệ thống
                      máy chủ.
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#fafcf9] border border-[#e8ece3]">
                    <div className="font-extrabold text-xs text-[#1c2216]">🔍 Quyền tra cứu</div>
                    <div className="text-xs text-[#6b7565] mt-1">
                      Xem lại toàn bộ lịch sử đơn hàng, giao dịch ví tiền và các đóng góp giải cứu
                      nông sản.
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#fafcf9] border border-[#e8ece3]">
                    <div className="font-extrabold text-xs text-[#1c2216]">
                      🚫 Quyền từ chối thông báo
                    </div>
                    <div className="text-xs text-[#6b7565] mt-1">
                      Tắt nhận bản tin khuyến mãi mùa vụ trong phần cài đặt thông báo tài khoản.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section
              id="ai-cookie"
              className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8ece3] shadow-sm scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#326318]/10 text-[#326318] flex items-center justify-center font-bold">
                  <Cpu size={20} />
                </div>
                <h2 className="text-xl font-black text-[#1c2216]">
                  7. Chính Sách Cookie &amp; Công Nghệ AI Phân Tích
                </h2>
              </div>
              <div className="text-xs sm:text-sm text-[#4d5648] space-y-3 leading-relaxed">
                <p>
                  CapNong sử dụng Cookie và các công nghệ lưu trữ cục bộ (Local Storage) nhằm mục
                  đích duy trì phiên đăng nhập và lưu giỏ hàng của bạn khi chuyển trang.
                </p>
                <div className="p-4 rounded-2xl bg-[#f4f8f0] border border-[#dce9d5] space-y-2">
                  <div className="font-bold text-xs text-[#326318] flex items-center gap-1.5">
                    <Sparkles size={16} />
                    Cam kết bảo mật công nghệ AI (CapNong AI Vision):
                  </div>
                  <p className="text-xs text-[#52634d]">
                    Khi nhà vườn chụp ảnh nông sản xấu mã để quét bằng AI (định giá giải cứu và kiểm
                    tra độ tươi), hình ảnh chỉ được dùng để nhận diện đặc điểm nông sản. Chúng tôi
                    không bao giờ thu thập khuôn mặt hay dữ liệu đời tư xung quanh bức ảnh.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section
              id="lien-he"
              className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8ece3] shadow-sm scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#2d5c99]/10 text-[#2d5c99] flex items-center justify-center font-bold">
                  <PhoneCall size={20} />
                </div>
                <h2 className="text-xl font-black text-[#1c2216]">
                  8. Liên Hệ &amp; Cơ Chế Giải Quyết Khiếu Nại
                </h2>
              </div>
              <div className="text-xs sm:text-sm text-[#4d5648] space-y-4 leading-relaxed">
                <p>
                  Nếu bạn có bất kỳ câu hỏi, góp ý hoặc phát hiện dấu hiệu vi phạm quyền riêng tư,
                  vui lòng liên hệ ngay với Bộ phận Bảo Mật Thông Tin của CapNong:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#f7faf5] border border-[#e2ebd9] flex items-start gap-3">
                    <Mail size={18} className="text-[#326318] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold text-xs text-[#1c2216]">
                        Email chuyên trách bảo mật
                      </div>
                      <a
                        href="mailto:privacy@capnong.vn"
                        className="text-xs font-bold text-[#326318] hover:underline mt-0.5 block"
                      >
                        privacy@capnong.vn
                      </a>
                      <div className="text-[10px] text-[#788472] mt-0.5">
                        Phản hồi trong vòng 24 giờ làm việc
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#f7faf5] border border-[#e2ebd9] flex items-start gap-3">
                    <PhoneCall size={18} className="text-[#326318] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold text-xs text-[#1c2216]">
                        Hotline hỗ trợ khách hàng
                      </div>
                      <a
                        href="tel:19001234"
                        className="text-xs font-bold text-[#326318] hover:underline mt-0.5 block"
                      >
                        1900 1234
                      </a>
                      <div className="text-[10px] text-[#788472] mt-0.5">
                        8:00 – 21:00 hàng ngày (kể cả T7, CN)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#fafaf6] border border-[#ecebe1] flex items-start gap-3">
                  <MapPin size={18} className="text-[#8a4e1d] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-[#1c2216]">Văn phòng điều hành CapNong:</span>
                    <p className="text-[#697262] mt-0.5">
                      Trụ sở: Hà Nội &amp; TP. Hồ Chí Minh · Trung tâm điều phối nông sản sạch Việt
                      Nam.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Navigation CTA */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#326318] to-[#254b12] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div>
                <h3 className="text-base font-black">Khám phá các nông sản tươi đang được mùa</h3>
                <p className="text-xs text-white/80 mt-0.5">
                  Mua trực tiếp từ nông hộ, cùng chung tay giảm lãng phí thực phẩm.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={
                    onNavigateHome ||
                    (() => {
                      window.location.hash = '/'
                    })
                  }
                  className="px-5 py-2.5 rounded-full bg-white text-[#326318] hover:bg-[#f4f7f0] font-black text-xs transition-colors cursor-pointer"
                >
                  Về trang chủ
                </button>
                <a
                  href="#/nong-san-tuoi"
                  className="px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs transition-colors cursor-pointer"
                >
                  Mua nông sản
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

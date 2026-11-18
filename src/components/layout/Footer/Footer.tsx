import { Phone, MapPin, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import logoIcon from '@/assets/logo-icon.png'

export default function Footer({ onInfo }: { onInfo: (s: string) => void }) {
  return (
    <footer className="site-footer">
      <div className="page-container footer-grid">
        <div>
          <Link to="/" className="flex gap-2.5 items-center text-xl font-bold text-white mb-2">
            <img
              src={logoIcon}
              alt="CapNong"
              className="h-9 w-auto object-contain"
            />
            <span>CapNong</span>
          </Link>
          <p>
            Nền tảng kết nối người tiêu dùng với nông dân Việt Nam, trân trọng từng mùa vụ và giảm
            lãng phí thực phẩm.
          </p>
        </div>
        <div>
          <h3>Dành cho người mua</h3>
          <Link to="/nong-san-tuoi">Khám phá nông sản tươi</Link>
          <Link to="/combo-tui-mu">Combo &amp; Túi mù</Link>
          <a href="#quy-trinh">Quy trình giải cứu 4 bước</a>
          <Link to="/ke-hoach-an-uong">Kế hoạch ăn uống AI</Link>
          <Link to="/bao-mat-thong-tin">Chính sách bảo mật &amp; đổi trả</Link>
        </div>
        <div>
          <h3>Hỗ trợ &amp; Hợp tác</h3>
          <Link to="/cau-chuyen-nong-dan">Chuyện nhà vườn Việt Nam</Link>
          <Link to="/chien-dich">Chiến dịch cứu trợ mùa vụ</Link>
          <a
            href="mailto:hotro@capnong.vn"
            className="flex items-center gap-1.5 hover:underline"
          >
            <Mail size={15} />
            <span>hotro@capnong.vn</span>
          </a>
        </div>
        <div>
          <h3>Liên hệ CapNong</h3>
          <p className="flex gap-2">
            <MapPin size={17} />
            TP. Hồ Chí Minh &amp; Đà Lạt
          </p>
          <p className="flex gap-2">
            <Phone size={17} />
            8:00 – 21:00 mỗi ngày
          </p>
        </div>
      </div>
      <div className="page-container footer-bottom">
        <span>© 2026 CapNong. Vì nông dân, vì môi trường.</span>
        <Link
          to="/bao-mat-thong-tin"
          className="hover:underline text-white font-medium cursor-pointer"
        >
          Bảo mật thông tin
        </Link>
      </div>
    </footer>
  )
}

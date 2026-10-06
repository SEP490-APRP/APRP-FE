import { Leaf, Phone, MapPin } from 'lucide-react'

export default function Footer({ onInfo }: { onInfo: (s: string) => void }) {
  return (
    <footer className="site-footer">
      <div className="page-container footer-grid">
        <div>
          <a href="#/" className="flex gap-2 items-center text-xl font-bold text-white">
            <Leaf />
            CapNong
          </a>
          <p>
            Nền tảng kết nối người tiêu dùng với nông dân Việt Nam, trân trọng từng mùa vụ và giảm
            lãng phí thực phẩm.
          </p>
        </div>
        <div>
          <h3>Dành cho người mua</h3>
          <a href="#/nong-san-tuoi">Khám phá nông sản tươi</a>
          <a href="#/combo-tui-mu">Combo &amp; Túi mù</a>
          <a href="#/quy-trinh">Hướng dẫn mua hàng</a>
          <button type="button" onClick={() => onInfo('Chính sách đổi trả')}>
            Chính sách đổi trả
          </button>
        </div>
        <div>
          <h3>Dành cho đối tác</h3>
          {['Đăng ký nhà vườn', 'Đối tác giao hàng', 'Hợp tác B2B'].map((t) => (
            <button key={t} type="button" onClick={() => onInfo(t)}>
              {t}
            </button>
          ))}
        </div>
        <div>
          <h3>Liên hệ CapNong</h3>
          <p className="flex gap-2">
            <MapPin size={17} />
            Hà Nội &amp; TP. Hồ Chí Minh
          </p>
          <p className="flex gap-2">
            <Phone size={17} />
            8:00 – 21:00 mỗi ngày
          </p>
          <span className="demo-label">Giao diện trải nghiệm · Dữ liệu minh họa</span>
        </div>
      </div>
      <div className="page-container footer-bottom">
        <span>© 2026 CapNong. Vì nông dân, vì môi trường.</span>
        <a
          href="#/bao-mat-thong-tin"
          className="hover:underline text-white font-medium cursor-pointer"
        >
          Bảo mật thông tin
        </a>
      </div>
    </footer>
  )
}

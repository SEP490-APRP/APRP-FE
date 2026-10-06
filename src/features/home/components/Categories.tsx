import { ArrowRight } from 'lucide-react'

export default function Categories() {
  return (
    <section id="danh-muc" aria-labelledby="danh-muc-title">
      <div className="cat-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="cat-header">
          <div>
            <span className="cat-eyebrow">Phân loại phong phú</span>
            <h2 id="danh-muc-title" className="cat-title">
              Khám phá theo danh mục nông sản
            </h2>
          </div>
          <a className="cat-link-all" href="#/nong-san-tuoi">
            <span>Xem tất cả phân loại</span>
            <ArrowRight size={18} aria-hidden />
          </a>
        </div>

        {/* Categories Grid */}
        <div className="cat-grid">
          {/* Category 1: Rau ăn lá tươi */}
          <a className="cat-item group" href="#/nong-san-tuoi?danh-muc=rau-an-la">
            <div className="cat-art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <path d="M44 72V32M44 32Q32 16 18 22Q20 40 44 42M44 32Q56 16 70 22Q68 40 44 42M44 48Q30 38 22 46Q28 58 44 56M44 48Q58 38 66 46Q60 58 44 56" />
                <ellipse cx={44} cy={74} rx={6} ry={3} />
              </svg>
            </div>
            <h3>Rau ăn lá tươi</h3>
            <p>45+ món sẵn có</p>
          </a>

          {/* Category 2: Củ quả mộc mạc */}
          <a className="cat-item group" href="#/nong-san-tuoi?danh-muc=cu-qua">
            <div className="cat-art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <path d="M44 28L33 72Q44 77 55 72L44 28ZM44 28C44 18 34 12 27 15M44 28C44 18 54 12 61 15M44 28V10M37 42H50M35 54H53M39 65H49" />
              </svg>
            </div>
            <h3>Củ quả mộc mạc</h3>
            <p>60+ loại củ ngon</p>
          </a>

          {/* Category 3: Trái cây nhiệt đới */}
          <a className="cat-item group" href="#/nong-san-tuoi?danh-muc=trai-cay">
            <div className="cat-art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <path d="M44 26C30 26 22 38 22 54C22 70 32 76 44 76C56 76 66 70 66 54C66 38 58 26 44 26ZM44 26C44 18 48 14 54 14M44 20C40 16 34 18 32 22M34 50Q44 60 54 50" />
              </svg>
            </div>
            <h3>Trái cây nhiệt đới</h3>
            <p>32+ thức quả ngọt</p>
          </a>

          {/* Category 4: Chuẩn hữu cơ */}
          <a className="cat-item group" href="#/nong-san-tuoi?danh-muc=huu-co">
            <div className="cat-art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <path d="M44 16C28 16 20 30 20 46C20 62 34 74 44 74C54 74 68 62 68 46C68 30 60 16 44 16ZM44 30V62M44 40Q34 34 28 40Q32 50 44 46M44 46Q54 38 60 44Q56 54 44 52" />
              </svg>
            </div>
            <h3>Chuẩn hữu cơ</h3>
            <p>Không hóa chất</p>
          </a>

          {/* Category 5: Đặc sản bản địa */}
          <a className="cat-item group" href="#/nong-san-tuoi?danh-muc=da-lat">
            <div className="cat-art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <path d="M16 68L36 34L48 52L60 30L72 68ZM16 68H72M32 44L44 62M54 42L64 60M26 24Q30 18 36 20Q34 28 26 24" />
              </svg>
            </div>
            <h3>Đặc sản bản địa</h3>
            <p>Đà Lạt, Gia Lai...</p>
          </a>

          {/* Category 6: Combo tiết kiệm */}
          <a className="cat-item group" href="#/combo-tui-mu">
            <div className="cat-art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <path d="M22 36L44 24L66 36V64L44 76L22 64ZM22 36L44 48L66 36M44 48V76M34 30L54 42M44 24V43M26 38L33 34M48 48L60 41" />
              </svg>
            </div>
            <h3>Combo tiết kiệm</h3>
            <p>Giảm thêm 15%</p>
          </a>
        </div>
      </div>
    </section>
  )
}

export default function RescueProcess({ onInfo }: { onInfo: (title: string) => void }) {
  return (
    <section id="quy-trinh" aria-labelledby="quy-trinh-title">
      <div className="rescue-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="rescue-header">
          <span className="rescue-eyebrow">Trải nghiệm đơn giản &amp; an tâm</span>
          <h2 id="quy-trinh-title" className="rescue-title">
            Quy trình giải cứu 4 bước minh bạch
          </h2>
          <p className="rescue-desc">
            Từ một nông sản chưa đạt chuẩn hình thức đến bữa ăn ngon lành trên bàn của bạn.
          </p>
        </div>

        {/* 4 Steps Flow */}
        <ol className="rescue-flow">
          {/* Step 1 */}
          <li className="rescue-step">
            <div className="rescue-art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <path d="M17 65Q43 58 70 65M43 59V37M43 46Q32 24 18 26Q22 41 43 43M44 37Q57 19 70 20Q64 36 44 38M21 28L39 40M66 23L48 35" />
                <ellipse cx={43} cy={74} rx={6} ry={3} />
                <path d="M41 74l5-2" />
              </svg>
            </div>
            <div className="rescue-info">
              <h3>Chọn nông sản</h3>
              <p>Khám phá rau củ xấu mã nhưng vẫn tươi ngon, an toàn.</p>
              <a className="rescue-btn" href="#/giai-cuu-hom-nay">
                Khám phá ngay
              </a>
            </div>
          </li>

          {/* Arrow 1 */}
          <li className="rescue-arrow" aria-hidden="true">
            →
          </li>

          {/* Step 2 */}
          <li className="rescue-step">
            <div className="rescue-art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <path d="M26 23Q33 33 43 30Q55 29 60 23L65 31Q67 36 63 41L63 69Q63 75 56 75H29Q22 75 23 68L24 42Q19 33 26 23ZM25 42Q44 37 63 42M29 29Q26 35 30 39M59 28Q62 34 57 39M44 46V67M43 52Q32 45 33 51Q35 56 43 55M44 58Q54 48 55 54Q53 60 44 61" />
                <path d="M39 47q4-3 9 0M38 69h11" />
              </svg>
            </div>
            <div className="rescue-info">
              <h3>Đặt hàng</h3>
              <p>Thanh toán linh hoạt, tiền được bảo chứng đến khi bạn hài lòng.</p>
              <button type="button" className="rescue-btn" onClick={() => onInfo('Xem bảo chứng')}>
                Xem bảo chứng
              </button>
            </div>
          </li>

          {/* Arrow 2 */}
          <li className="rescue-arrow" aria-hidden="true">
            →
          </li>

          {/* Step 3 */}
          <li className="rescue-step">
            <div className="rescue-art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <path d="M23 35L45 24L67 35V62L45 76L23 62ZM23 35L45 48L67 35M45 48V76M34 30L56 42M56 30L34 42M45 24V43M27 36L34 32M48 47L61 39" />
              </svg>
            </div>
            <div className="rescue-info">
              <h3>Đóng gói</h3>
              <p>Nhà vườn đóng gói bằng vật liệu tái chế, giữ trọn độ tươi.</p>
              <a className="rescue-btn" href="#/cau-chuyen-nong-dan">
                Xem nhà vườn
              </a>
            </div>
          </li>

          {/* Arrow 3 */}
          <li className="rescue-arrow" aria-hidden="true">
            →
          </li>

          {/* Step 4 */}
          <li className="rescue-step">
            <div className="rescue-art">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <path d="M23 62V29H54V62H37M54 40H66L77 52V65H72M54 62H59M61 44H65L72 53H61ZM15 36H6M17 45H3M15 54H8M23 65H27" />
                <circle cx={32} cy={65} r={6} />
                <circle cx={66} cy={65} r={6} />
                <circle cx={32} cy={65} r={2} />
                <circle cx={66} cy={65} r={2} />
              </svg>
            </div>
            <div className="rescue-info">
              <h3>Giao tận nơi</h3>
              <p>Shipper xanh giao nhanh trong 2–4 giờ, đổi trả rõ ràng.</p>
              <button type="button" className="rescue-btn" onClick={() => onInfo('Xem chính sách')}>
                Xem chính sách
              </button>
            </div>
          </li>
        </ol>
      </div>
    </section>
  )
}

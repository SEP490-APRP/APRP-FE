import type { PreOrderResponse } from '@/services'
import { formatKg } from './utils'

/** Tem QR dán trên thùng hàng chiến dịch: nội dung tem và file PDF để in (mỗi thùng một tem, 8 tem / trang A4) */

export const SHELF_TEXT: Record<string, { label: string; care: string }> = {
  DAYS_2_3: { label: 'Giữ tươi 2–3 ngày', care: 'Hàng dễ dập, héo: để ngăn mát và dùng sớm.' },
  DAYS_3_4: { label: 'Giữ tươi 3–4 ngày', care: 'Để ngăn mát hoặc nơi thoáng mát, tránh đè ép.' },
  DAYS_5_6: { label: 'Giữ tươi 5–6 ngày', care: 'Để nơi khô thoáng, tránh nắng và ẩm.' },
}

export const fmtLabelDay = (v?: string | null) =>
  v ? new Date(`${v.slice(0, 10)}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

/** Địa chỉ trang tra cứu mà mã QR trỏ tới */
export const traceUrl = (webUrl: string, token: string) => `${webUrl.trim().replace(/\/+$/, '')}/truy-xuat/${token}`

export const WEB_URL_KEY = 'capnong-label-web-url'

/** Địa chỉ web in trên QR: lần nhập gần nhất, rồi cấu hình VITE_PUBLIC_WEB_URL, rồi địa chỉ đang mở */
export function savedWebUrl(): string {
  try {
    const saved = localStorage.getItem(WEB_URL_KEY)
    if (saved) return saved
  } catch {
    // trình duyệt chặn lưu trữ: dùng mặc định
  }
  return import.meta.env.VITE_PUBLIC_WEB_URL || window.location.origin
}

/** Địa chỉ chỉ mở được trên chính máy này nên điện thoại quét sẽ không vào được */
export const isLocalUrl = (url: string) => /^(https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\])(?=[:/]|$)/i.test(url.trim())

/** Mã tem an toàn do máy chủ cấp (đơn đóng gói trước đây có thể mang mã kiểu cũ) */
export const isPackageToken = (t?: string | null): t is string => !!t && /^CN[0-9a-f]{32}$/.test(t)

export interface PackageLabel {
  order: PreOrderResponse
  crate: number
  crates: number
}

/** Mỗi thùng của đơn một tem */
export const toLabels = (orders: PreOrderResponse[]): PackageLabel[] =>
  orders.flatMap((order) =>
    Array.from({ length: order.crateQuantity }, (_, i) => ({ order, crate: i + 1, crates: order.crateQuantity })),
  )

type Node = Record<string, unknown>

function labelCell({ order: o, crate, crates }: PackageLabel, webUrl: string): Node {
  const shelf = o.shelfLifeTier ? SHELF_TEXT[o.shelfLifeTier] : undefined
  const line = (text: string, extra: Node = {}): Node => ({ text, margin: [0, 1.5, 0, 0], ...extra })
  return {
    margin: [6, 6, 6, 6],
    columns: [
      {
        width: '*',
        stack: [
          { text: 'CAPNONG', bold: true, color: '#326318', fontSize: 10 },
          line(o.recipientName || o.buyerName || '—', { fontSize: 13, bold: true }),
          line(`Thùng ${crate}/${crates} · ${formatKg(o.crateKg)}`, { fontSize: 11, bold: true }),
          line([o.sourceProductName, o.sourceShopName].filter(Boolean).join(' · ') || o.campaignTitle),
          line(`Thu hoạch: ${fmtLabelDay(o.sourceHarvestDate)}`),
          line(shelf?.label ?? 'Bảo quản nơi thoáng mát', { bold: true }),
          line(`Dùng trước: ${fmtLabelDay(o.deliverBy)}`, { bold: true }),
          line(o.code, { color: '#6b7363', fontSize: 7 }),
        ],
      },
      {
        width: 96,
        stack: [
          // Số thùng giúp tài xế quét nhận đúng từng thùng, trang truy xuất bỏ qua tham số này
          { qr: `${traceUrl(webUrl, o.qrCode ?? '')}?thung=${crate}`, fit: 96, eccLevel: 'M' },
          { text: 'Quét để xem thông tin thùng', alignment: 'center', fontSize: 7, margin: [0, 3, 0, 0] },
        ],
      },
    ],
    columnGap: 6,
  }
}

export function labelsPdfDoc(labels: PackageLabel[], webUrl: string) {
  const rows: Node[][] = []
  for (let i = 0; i < labels.length; i += 2) {
    rows.push([labelCell(labels[i], webUrl), labels[i + 1] ? labelCell(labels[i + 1], webUrl) : { text: '' }])
  }
  // Viền nét đứt để cắt tem
  const cut = {
    hLineWidth: () => 0.7,
    vLineWidth: () => 0.7,
    hLineColor: () => '#9aa592',
    vLineColor: () => '#9aa592',
    hLineStyle: () => ({ dash: { length: 3 } }),
    vLineStyle: () => ({ dash: { length: 3 } }),
  }
  return {
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 20],
    info: { title: 'Tem thùng hàng CapNong', author: 'CapNong' },
    defaultStyle: { fontSize: 8.5, color: '#111111' },
    content: [{ table: { widths: ['*', '*'], heights: 184, dontBreakRows: true, body: rows }, layout: cut }],
  }
}

/** Tải file PDF tem về máy; thư viện chỉ tải khi bấm nút */
export async function downloadLabelsPdf(labels: PackageLabel[], webUrl: string, fileName: string) {
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts')])
  pdfMake.addVirtualFileSystem(fonts)
  await pdfMake.createPdf(labelsPdfDoc(labels, webUrl)).download(`${fileName}.pdf`)
}

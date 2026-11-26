import { buildXlsx, columnName, type XlsxCell, type XlsxSheet, type XlsxStyle } from '@/utils/xlsx'
import type { CampaignResponse, HubTrip, PreOrderResponse } from '@/services'
import { fmtDay, orderShipFee, ratingOf, type CampaignReport } from './report'
import { adminReadyLabel, formatKg, formatVnd } from './utils'

/**
 * Xuất báo cáo tổng kết chiến dịch:
 * - PDF (tải thẳng về máy, tạo bằng pdfmake): bản đọc / trình ký / lưu trữ
 * - Excel: số liệu chi tiết để đối soát
 * Cả hai không xuất số điện thoại và địa chỉ của người mua.
 */

export interface ReportInput {
  c: CampaignResponse
  report: CampaignReport
  orders: PreOrderResponse[]
  trips: HubTrip[]
  /** Nhận xét, bài học, kiến nghị do admin nhập */
  note: string
}

const ORDER_STATUS: Record<PreOrderResponse['status'], string> = {
  PENDING: 'Chờ cọc', DEPOSIT_PAID: 'Đã cọc', PROCESSING: 'Đã đóng gói', READY: 'Tại hub',
  SHIPPING: 'Đang giao', DELIVERED: 'Đã giao', CANCELLED: 'Đã huỷ', FAILED: 'Giao thất bại',
}
const orderStatus = (o: PreOrderResponse) => (o.status === 'READY' ? adminReadyLabel(o) : ORDER_STATUS[o.status] ?? o.status)
const TRIP_STATUS: Record<string, string> = { OPEN: 'Chưa có tài xế', ACCEPTED: 'Đã nhận', IN_TRANSIT: 'Đang chở', DELIVERED: 'Đã tới hub', CANCELLED: 'Đã huỷ' }

export const reportFileName = (c: CampaignResponse) => `BaoCao_${c.code.replace(/[^\w-]+/g, '_')}_${new Date().toLocaleDateString('sv-SE')}`

/** Bảng thu chi: dùng chung cho PDF và Excel */
const moneyRows = (r: CampaignReport): [string, number][] => [
  ['Thu từ người mua (cọc đã giải ngân + trả khi nhận)', r.money.collected],
  ['Trả nhà vườn', -r.money.farmPay],
  ['Cước shipper giao hàng', -r.money.shipPay],
  ['Cước xe chở ra hub', -r.money.tripPay],
  ['Bồi thường hàng hư', -r.money.damagePay],
]

const summaryLine = (c: CampaignResponse, r: CampaignReport) =>
  `Chiến dịch đã giải cứu ${formatKg(r.rescuedKg)} (${r.pctTarget}% mục tiêu ${formatKg(r.target)}), giao thành công ${r.delivered.length}/${r.validCount} đơn cho ${r.buyers} người mua. ` +
  `${r.farms.length} nhà vườn đã nhận ${formatVnd(r.money.farmPay)}; sàn ${r.money.platform < 0 ? 'bù' : 'còn lại'} ${formatVnd(Math.abs(r.money.platform))}.` +
  (r.score != null ? ` Đánh giá chung: ${ratingOf(r.score).label} (${r.score}%).` : '') +
  (c.cancelReason ? ` Ghi chú: ${c.cancelReason}.` : '')

const issueOrders = (orders: PreOrderResponse[]) =>
  orders.filter((o) => o.status === 'FAILED' || o.status === 'CANCELLED' || Number(o.damageRefundTotal ?? 0) > 0)

const issueReason = (o: PreOrderResponse) =>
  [o.failReason, o.cancelReason, Number(o.damageRefundTotal ?? 0) > 0 ? `Hoàn ${formatVnd(Number(o.damageRefundTotal))} do hàng hư` : null]
    .filter(Boolean)
    .join('; ') || '—'

/* ─────────────────────────── Excel ─────────────────────────── */

const cell = (v: XlsxCell['v'], s?: XlsxStyle): XlsxCell => ({ v, s })
/** Một dòng chỉ có ô đầu mang giá trị, các ô còn lại cùng kiểu để gộp ô vẫn đủ màu và viền */
const band = (v: XlsxCell['v'], s: XlsxStyle, cols: number): XlsxCell[] => [cell(v, s), ...Array.from({ length: cols - 1 }, () => cell(null, s))]

interface Column<T> {
  title: string
  width: number
  kind: 'text' | 'num' | 'money'
  value: (row: T) => string | number | null
  /** Cộng tổng cột này ở dòng cuối */
  total?: boolean
}

/** Sheet dạng bảng: tiêu đề lớn, dòng đầu cột cố định + bộ lọc, dòng kẻ xen màu, dòng tổng bằng công thức SUM */
function tableSheet<T>(name: string, title: string, columns: Column<T>[], data: T[], totalLabel = `Tổng cộng (${data.length} dòng)`): XlsxSheet {
  const n = columns.length
  const last = columnName(n - 1)
  const first = 4
  const body = data.map((row, i) =>
    columns.map((c): XlsxCell => {
      const base = c.kind === 'text' ? 'text' : c.kind === 'num' ? 'num' : 'money'
      return cell(c.value(row), i % 2 ? (`${base}Alt` as XlsxStyle) : base)
    }),
  )
  const end = first + data.length - 1
  const totals = columns.map((c, k): XlsxCell => {
    if (k === 0) return cell(totalLabel, 'totalText')
    if (!c.total) return cell(null, 'totalText')
    const sum = data.reduce((acc, row) => acc + Number(c.value(row) || 0), 0)
    return { v: sum, f: `SUM(${columnName(k)}${first}:${columnName(k)}${end})`, s: c.kind === 'money' ? 'totalMoney' : 'totalNum' }
  })
  return {
    name,
    widths: columns.map((c) => c.width),
    rows: [
      band(title, 'title', n),
      [],
      columns.map((c) => cell(c.title, 'head')),
      ...(data.length ? [...body, totals] : [band('Không có dữ liệu', 'text', n)]),
    ],
    merges: [`A1:${last}1`, ...(data.length ? [] : [`A${first}:${last}${first}`])],
    heights: { 1: 32, 3: 30, ...Object.fromEntries(Array.from({ length: data.length + 1 }, (_, i) => [first + i, 21])) },
    freezeRows: 3,
    filter: data.length ? `A3:${last}${end}` : undefined,
    landscape: true,
  }
}

/** Sheet đầu: tiêu đề, các con số chính, thông tin, mức độ hoàn thành (thanh dữ liệu), tóm tắt và nhận xét */
function overviewSheet({ c, report: r, note }: ReportInput): XlsxSheet {
  const rows: XlsxCell[][] = []
  const merges: string[] = []
  const heights: Record<number, number> = {}
  const dataBars: string[] = []
  /** Thêm một dòng, trả số thứ tự dòng trong Excel */
  const push = (cells: XlsxCell[], height?: number) => {
    rows.push(cells)
    if (height) heights[rows.length] = height
    return rows.length
  }
  const full = (v: string, s: XlsxStyle, height?: number) => {
    const at = push(band(v, s, 6), height)
    merges.push(`A${at}:F${at}`)
  }
  const section = (title: string) => {
    push([], 10)
    full(title, 'section', 22)
  }

  full('BÁO CÁO TỔNG KẾT CHIẾN DỊCH', 'title', 38)
  full(`${c.title}  ·  ${c.code}`, 'subtitle', 28)
  full(`CapNong · Xuất ngày ${new Date().toLocaleString('vi-VN')}`, 'muted')
  push([], 10)

  push(['Đã giải cứu (kg)', 'So với mục tiêu', 'Đơn đã giao', 'Người mua', 'Nhà vườn', 'Sàn nhận được (đ)'].map((v) => cell(v, 'kpiLabel')), 22)
  push(
    [
      cell(r.rescuedKg, 'kpiText'),
      cell(r.target > 0 ? r.rescuedKg / r.target : 0, 'kpiPercent'),
      cell(`${r.delivered.length}/${r.validCount}`, 'kpiText'),
      cell(r.buyers, 'kpiText'),
      cell(r.farms.length, 'kpiText'),
      cell(Math.round(r.money.platform), 'kpiMoney'),
    ],
    36,
  )

  section('THÔNG TIN CHIẾN DỊCH')
  const info: [string, string][] = [
    ['Danh mục / mùa vụ', [c.categoryName, c.season].filter(Boolean).join(' · ') || '—'],
    ['Điểm tập kết', [c.collectionSiteName, c.collectionSiteAddress].filter(Boolean).join(' · ') || '—'],
    ['Bắt đầu (đăng kêu gọi)', fmtDay(r.start)],
    [r.hasFinishDate ? 'Kết thúc chiến dịch' : 'Kết thúc (ngày hoàn tất)', `${fmtDay(r.end)}${r.days ? `  (${r.days} ngày)` : ''}`],
    ['Giá thu mua', `${formatVnd(Number(c.rescuePricePerKg ?? 0))}/kg · cọc ${Math.round(Number(c.depositPercent ?? 0) * 100)}%`],
    ['Ngưỡng / mục tiêu', `${formatKg(Number(c.minThresholdKg ?? 0))} / ${formatKg(r.target)}`],
    ['Hub giao hàng', String(r.hubs)],
    ['Đơn thất bại / đã huỷ', `${r.failed.length} / ${r.cancelled.length}`],
  ]
  for (const [label, value] of info) {
    const at = push([cell(label, 'label'), ...band(value, 'wrap', 5)], value.length > 80 ? 32 : 20)
    merges.push(`B${at}:F${at}`)
  }

  section('MỨC ĐỘ HOÀN THÀNH')
  const headAt = push([cell('Chỉ tiêu', 'head'), cell(null, 'head'), cell('Thực hiện', 'head'), cell('Kế hoạch / tổng', 'head'), cell('Tỷ lệ', 'head'), cell('Đơn vị', 'head')], 22)
  merges.push(`A${headAt}:B${headAt}`)
  const metricAt = r.metrics.map((m) => {
    const at = push([cell(m.label, 'text'), cell(null, 'text'), cell(m.done, 'num'), cell(m.total, 'num'), cell(m.pct / 100, 'percent'), cell(m.unit, 'text')], 22)
    merges.push(`A${at}:B${at}`)
    return at
  })
  if (metricAt.length) dataBars.push(`E${metricAt[0]}:E${metricAt[metricAt.length - 1]}`)
  if (r.score != null) {
    const at = push(
      [...band('Điểm chung', 'totalText', 4), cell(r.score / 100, 'totalPercent'), cell(ratingOf(r.score).label, 'totalText')],
      24,
    )
    merges.push(`A${at}:D${at}`)
  }

  section('TÓM TẮT')
  full(summaryLine(c, r), 'wrap', 52)

  section('NHẬN XÉT, BÀI HỌC VÀ KIẾN NGHỊ')
  const text = note.trim()
  full(text, 'wrap', Math.min(300, Math.max(70, (text.split('\n').length + Math.ceil(text.length / 100)) * 17)))

  return { name: 'Tổng quan', widths: [24, 17, 17, 17, 15, 21], rows, merges, heights, dataBars }
}

export function reportSheets(input: ReportInput): XlsxSheet[] {
  const { report: r, orders, trips } = input
  const vnd = (v: number) => Math.round(v)
  return [
    overviewSheet(input),
    tableSheet<[string, number]>(
      'Tài chính',
      'THU CHI CỦA SÀN',
      [
        { title: 'Khoản', width: 56, kind: 'text', value: (x) => x[0] },
        // Dòng tổng chính là số tiền sàn nhận được
        { title: 'Số tiền (đ)', width: 22, kind: 'money', value: (x) => vnd(x[1]), total: true },
      ],
      moneyRows(r),
      'Sàn nhận được',
    ),
    tableSheet<CampaignReport['farms'][number]>('Nhà vườn', 'NHÀ VƯỜN THAM GIA', [
      { title: 'Nhà vườn', width: 36, kind: 'text', value: (f) => f.name },
      { title: 'Phân bổ (kg)', width: 15, kind: 'num', value: (f) => f.allocatedKg, total: true },
      { title: 'Cân (kg)', width: 13, kind: 'num', value: (f) => f.receivedKg, total: true },
      { title: 'Hư (kg)', width: 12, kind: 'num', value: (f) => f.rejectedKg, total: true },
      { title: 'Tính tiền (kg)', width: 16, kind: 'num', value: (f) => f.countedKg, total: true },
      { title: 'Đã trả (đ)', width: 18, kind: 'money', value: (f) => vnd(f.pay), total: true },
    ], r.farms),
    tableSheet<PreOrderResponse>('Đơn hàng', 'ĐƠN ĐẶT TRƯỚC', [
      { title: 'Mã đơn', width: 24, kind: 'text', value: (o) => o.code },
      { title: 'Người nhận', width: 24, kind: 'text', value: (o) => o.recipientName ?? o.buyerName ?? '' },
      { title: 'Số kg', width: 10, kind: 'num', value: (o) => Number(o.totalKg ?? 0), total: true },
      { title: 'Tiền hàng (đ)', width: 16, kind: 'money', value: (o) => vnd(Number(o.totalAmount ?? 0)), total: true },
      { title: 'Phí ship (đ)', width: 14, kind: 'money', value: (o) => vnd(orderShipFee(o)), total: true },
      { title: 'Tiền cọc (đ)', width: 15, kind: 'money', value: (o) => vnd(Number(o.depositAmount ?? 0)), total: true },
      { title: 'Trả khi nhận (đ)', width: 17, kind: 'money', value: (o) => vnd(Number(o.remainingAmount ?? 0)), total: true },
      { title: 'Trạng thái', width: 16, kind: 'text', value: orderStatus },
      { title: 'Hub', width: 24, kind: 'text', value: (o) => o.hubName ?? '' },
      { title: 'Shipper', width: 22, kind: 'text', value: (o) => o.shipperName ?? '' },
      { title: 'Ngày giao', width: 13, kind: 'text', value: (o) => (o.deliveredAt ? fmtDay(o.deliveredAt) : '') },
      { title: 'Ghi chú', width: 40, kind: 'text', value: (o) => (issueReason(o) === '—' ? '' : issueReason(o)) },
    ], orders),
    tableSheet<HubTrip>('Xe ra hub', 'XE CHỞ HÀNG RA HUB', [
      { title: 'Xe', width: 16, kind: 'text', value: (t) => `Xe ${t.tripNo}` },
      { title: 'Tài xế', width: 28, kind: 'text', value: (t) => t.driverName ?? '' },
      { title: 'Biển số', width: 16, kind: 'text', value: (t) => t.vehicleNumber ?? '' },
      { title: 'Số kg', width: 12, kind: 'num', value: (t) => Number(t.totalKg ?? 0), total: true },
      { title: 'Hub', width: 44, kind: 'text', value: (t) => t.stops.map((s) => s.hubName).join(', ') },
      { title: 'Trạng thái', width: 18, kind: 'text', value: (t) => TRIP_STATUS[t.status] ?? t.status },
      { title: 'Tài xế nhận (đ)', width: 18, kind: 'money', value: (t) => (t.paidAt ? vnd(Number(t.netAmount ?? 0)) : null), total: true },
    ], trips),
  ]
}

export function downloadReportExcel(input: ReportInput) {
  const blob = new Blob([buildXlsx(reportSheets(input))], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${reportFileName(input.c)}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ─────────────────────────── PDF ─────────────────────────── */

type Node = Record<string, unknown>

const GREEN = '#326318'
const LINE = '#d9e2d2'
const GRAY = '#6b7363'
/** Bề ngang phần nội dung trang A4 với lề 40pt */
const WIDTH = 515

const grid = {
  hLineWidth: () => 0.6,
  vLineWidth: () => 0.6,
  hLineColor: () => LINE,
  vLineColor: () => LINE,
  paddingTop: () => 3,
  paddingBottom: () => 3,
}

const heading = (text: string): Node => ({ text, style: 'h2' })
/** Giữ tiêu đề đi cùng nội dung trên một trang (chỉ dùng cho mục ngắn) */
const section = (title: string, ...content: Node[]): Node => ({ stack: [heading(title), ...content], unbreakable: true })

/** Bảng có dòng tiêu đề lặp lại khi sang trang; cột trong `right` canh phải (số) */
function table(head: string[], rows: (string | number)[][], widths: (string | number)[], right: number[] = []): Node {
  const cell = (v: string | number, i: number, extra: Node = {}): Node => ({ text: String(v), alignment: right.includes(i) ? 'right' : 'left', ...extra })
  const body = rows.length
    ? rows.map((r) => r.map((v, i) => cell(v, i)))
    : [[{ text: 'Không có', colSpan: head.length, color: GRAY }, ...head.slice(1).map(() => ({}))]]
  return {
    table: { headerRows: 1, dontBreakRows: true, widths, body: [head.map((v, i) => cell(v, i, { bold: true, fillColor: '#eef6e7' })), ...body] },
    layout: grid,
  }
}

/** Mục gồm một bảng: bảng ngắn thì không tách trang, bảng dài thì để tự chảy sang trang sau */
const tableSection = (title: string, rows: number, content: Node): Node =>
  rows <= 18 ? section(title, content) : { stack: [heading(title), content] }

export function reportPdfDoc({ c, report: r, orders, trips, note }: ReportInput) {
  const signed = (v: number) => `${v < 0 ? '−' : v > 0 ? '+' : ''}${formatVnd(Math.abs(v))}`
  const amount = (v: number) => (v < 0 ? `−${formatVnd(-v)}` : formatVnd(v))
  const qty = (v: number, unit: string) => (unit === 'kg' ? formatKg(v) : `${v} đơn`)

  const info: [string, string][] = [
    ['Danh mục / mùa vụ', [c.categoryName, c.season].filter(Boolean).join(' · ') || '—'],
    ['Điểm tập kết', [c.collectionSiteName, c.collectionSiteAddress].filter(Boolean).join(' · ') || '—'],
    ['Thời gian', `${fmtDay(r.start)} (đăng kêu gọi) đến ${fmtDay(r.end)} (${r.hasFinishDate ? 'kết thúc chiến dịch' : 'ngày hoàn tất'})${r.days ? `, ${r.days} ngày` : ''}`],
    ['Giá thu mua', `${formatVnd(Number(c.rescuePricePerKg ?? 0))}/kg · cọc ${Math.round(Number(c.depositPercent ?? 0) * 100)}%`],
    ['Ngưỡng / mục tiêu', `${formatKg(Number(c.minThresholdKg ?? 0))} / ${formatKg(r.target)}`],
  ]
  const milestones: [string, string | null | undefined][] = [
    ['Đăng bài kêu gọi', r.start], ['Chốt góp hàng', c.farmCutoffAt], ['Chốt đơn đặt trước', c.cutoffAt],
    ['Bắt đầu mở điểm tập kết', c.startDate], ['Kết thúc mở điểm tập kết', c.endDate],
    ['Kết thúc chiến dịch', c.finishDate], ['Hoàn tất & chi trả', c.completedAt],
  ]
  const kpis: [string, string][] = [
    [formatKg(r.rescuedKg), 'Đã giải cứu'],
    [`${r.delivered.length}/${r.validCount}`, 'Đơn đã giao'],
    [String(r.buyers), 'Người mua'],
    [String(r.farms.length), 'Nhà vườn'],
  ]
  const bars: Node[] = r.metrics.map((m) => ({
    stack: [
      { columns: [{ text: m.label }, { text: [`${qty(m.done, m.unit)} / ${qty(m.total, m.unit)} · `, { text: `${m.pct}%`, bold: true }], alignment: 'right' }] },
      {
        canvas: [
          { type: 'rect', x: 0, y: 0, w: WIDTH, h: 7, color: '#e4f0dc' },
          // Bỏ hình chữ nhật rộng 0 khi tỉ lệ bằng 0
          ...(m.pct > 0 ? [{ type: 'rect', x: 0, y: 0, w: (WIDTH * m.pct) / 100, h: 7, color: GREEN }] : []),
        ],
        margin: [0, 2, 0, 0],
      },
    ],
    margin: [0, 0, 0, 6],
  }))
  const money = moneyRows(r)
  const issues = issueOrders(orders)
  const sign = (title: string): Node => ({ stack: [{ text: title, bold: true }, { text: '(Ký, ghi rõ họ tên)', color: GRAY, fontSize: 8 }], alignment: 'center' })

  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 46],
    info: { title: reportFileName(c), author: 'CapNong' },
    defaultStyle: { fontSize: 9, color: '#1c2216', lineHeight: 1.15 },
    styles: { h2: { fontSize: 11.5, bold: true, color: GREEN, margin: [0, 12, 0, 5] } },
    footer: (page: number, pages: number) => ({
      columns: [{ text: `CapNong · ${c.code}` }, { text: `Trang ${page}/${pages}`, alignment: 'right' }],
      color: GRAY,
      fontSize: 7.5,
      margin: [40, 16, 40, 0],
    }),
    content: [
      {
        columns: [
          { stack: [{ text: 'CAPNONG', fontSize: 17, bold: true, color: GREEN }, { text: 'Nông sản xấu mã, ngon thật', fontSize: 7.5, color: GRAY }] },
          { text: `Ngày xuất: ${new Date().toLocaleString('vi-VN')}`, alignment: 'right', fontSize: 7.5, color: GRAY, margin: [0, 18, 0, 0] },
        ],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: WIDTH, y2: 0, lineWidth: 2.5, lineColor: GREEN }], margin: [0, 5, 0, 0] },
      { text: 'BÁO CÁO TỔNG KẾT CHIẾN DỊCH', fontSize: 15, bold: true, margin: [0, 10, 0, 2] },
      { text: [{ text: c.title, bold: true }, ` · ${c.code}`] },
      section('1. Thông tin chiến dịch', {
        table: { widths: [130, '*'], body: info.map(([k, v]) => [{ text: k, bold: true, fillColor: '#f7faf4' }, { text: v }]) },
        layout: grid,
      }),
      section(
        '2. Tóm tắt kết quả',
        { text: summaryLine(c, r) },
        {
          table: {
            widths: ['*', '*', '*', '*'],
            body: [kpis.map(([value, label]) => ({ stack: [{ text: value, fontSize: 15, bold: true, color: GREEN }, { text: label, fontSize: 8 }], margin: [3, 3, 3, 3] }))],
          },
          layout: grid,
          margin: [0, 6, 0, 0],
        },
      ),
      section(`3. Mức độ hoàn thành${r.score != null ? `: ${r.score}% · ${ratingOf(r.score).label}` : ''}`, ...bars),
      section('4. Mốc thời gian', table(['Mốc', 'Ngày'], milestones.filter(([, d]) => d).map(([k, d]) => [k, fmtDay(d)]), ['*', 110])),
      section(
        '5. Tài chính',
        {
          table: {
            headerRows: 1,
            widths: ['*', 110],
            body: [
              [{ text: 'Khoản', bold: true, fillColor: '#eef6e7' }, { text: 'Số tiền', bold: true, fillColor: '#eef6e7', alignment: 'right' }],
              ...money.map(([k, v]) => [{ text: k }, { text: signed(v), alignment: 'right' }]),
              [{ text: 'Sàn nhận được', bold: true, fontSize: 10, fillColor: '#fff8d6' }, { text: amount(r.money.platform), bold: true, fontSize: 10, fillColor: '#fff8d6', alignment: 'right' }],
            ],
          },
          layout: grid,
        },
        { text: ['Tiền hàng đã giao: ', { text: formatVnd(r.goodsValue), bold: true }, ' · Hoàn lại người mua: ', { text: formatVnd(r.money.refunded), bold: true }], margin: [0, 5, 0, 0] },
      ),
      tableSection('6. Nhà vườn tham gia', r.farms.length, table(
        ['Nhà vườn', 'Phân bổ', 'Cân', 'Hư', 'Tính tiền', 'Đã trả'],
        r.farms.map((f) => [f.name, formatKg(f.allocatedKg), formatKg(f.receivedKg), formatKg(f.rejectedKg), formatKg(f.countedKg), formatVnd(f.pay)]),
        ['*', 52, 52, 42, 52, 70], [1, 2, 3, 4, 5],
      )),
      tableSection('7. Vận chuyển ra hub', trips.length, table(
        ['Xe', 'Tài xế', 'Số kg', 'Hub', 'Trạng thái', 'Tài xế nhận'],
        trips.map((t) => [t.tripNo, t.driverName ?? '—', formatKg(t.totalKg), t.stops.map((x) => x.hubName).join(', '), TRIP_STATUS[t.status] ?? t.status, t.paidAt ? formatVnd(t.netAmount) : '—']),
        [20, 95, 48, '*', 68, 68], [2, 5],
      )),
      tableSection('8. Sự cố (đơn thất bại, huỷ, báo hư)', issues.length, table(
        ['Mã đơn', 'Số kg', 'Trạng thái', 'Lý do'],
        issues.map((o) => [o.code, formatKg(o.totalKg), orderStatus(o), issueReason(o)]),
        [120, 45, 75, '*'], [1],
      )),
      note.trim()
        ? { stack: [heading('9. Nhận xét, bài học và kiến nghị'), { table: { widths: ['*'], body: [[{ text: note.trim(), margin: [3, 3, 3, 3] }]] }, layout: grid }] }
        : section('9. Nhận xét, bài học và kiến nghị', ...Array.from({ length: 4 }, (): Node => ({
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: WIDTH, y2: 0, lineWidth: 0.6, lineColor: '#999999', dash: { length: 1.5 } }],
            margin: [0, 16, 0, 0],
          }))),
      { columns: [sign('Người lập báo cáo'), sign('Đại diện CapNong')], unbreakable: true, margin: [0, 24, 0, 60] },
    ],
  }
}

/** Tạo file PDF và tải thẳng về máy. Thư viện và phông chữ chỉ tải khi bấm nút (khá nặng) */
export async function downloadReportPdf(input: ReportInput) {
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts')])
  pdfMake.addVirtualFileSystem(fonts)
  await pdfMake.createPdf(reportPdfDoc(input)).download(`${reportFileName(input.c)}.pdf`)
}

/**
 * Tạo file Excel .xlsx nhỏ gọn ngay trên trình duyệt (không cần thư viện): nhiều sheet, màu nền, viền, định dạng
 * tiền / phần trăm, gộp ô, đóng băng tiêu đề, lọc cột, thanh dữ liệu. File .xlsx là một gói zip chứa XML; zip không nén.
 */

interface Style {
  font?: 'bold' | 'title' | 'subtitle' | 'muted' | 'white' | 'section' | 'kpi'
  fill?: 'brand' | 'leaf' | 'sun' | 'zebra'
  border?: boolean
  /** Mã định dạng số: 0 thường, 9 phần trăm, 164 tiền */
  numFmt?: 0 | 9 | 164
  h?: 'left' | 'center' | 'right'
  wrap?: boolean
}

const STYLES = {
  title: { font: 'title', fill: 'brand', h: 'center' },
  subtitle: { font: 'subtitle', fill: 'sun', h: 'center', wrap: true },
  muted: { font: 'muted', h: 'right' },
  section: { font: 'section', fill: 'leaf' },
  head: { font: 'white', fill: 'brand', border: true, h: 'center', wrap: true },
  kpiLabel: { font: 'muted', fill: 'zebra', border: true, h: 'center', wrap: true },
  kpiText: { font: 'kpi', fill: 'zebra', border: true, h: 'center' },
  kpiMoney: { font: 'kpi', fill: 'zebra', border: true, h: 'center', numFmt: 164 },
  kpiPercent: { font: 'kpi', fill: 'zebra', border: true, h: 'center', numFmt: 9 },
  label: { font: 'bold', fill: 'zebra', border: true },
  text: { border: true },
  textAlt: { border: true, fill: 'zebra' },
  wrap: { border: true, wrap: true },
  num: { border: true, h: 'right' },
  numAlt: { border: true, h: 'right', fill: 'zebra' },
  money: { border: true, numFmt: 164 },
  moneyAlt: { border: true, numFmt: 164, fill: 'zebra' },
  percent: { border: true, numFmt: 9, h: 'center' },
  totalText: { font: 'bold', fill: 'sun', border: true },
  totalNum: { font: 'bold', fill: 'sun', border: true, h: 'right' },
  totalMoney: { font: 'bold', fill: 'sun', border: true, numFmt: 164 },
  totalPercent: { font: 'bold', fill: 'sun', border: true, numFmt: 9, h: 'center' },
} satisfies Record<string, Style>

export type XlsxStyle = keyof typeof STYLES

/** Một ô: giá trị + kiểu trình bày; `f` là công thức (giá trị `v` là kết quả đã tính sẵn) */
export interface XlsxCell {
  v?: string | number | null
  s?: XlsxStyle
  f?: string
}

export interface XlsxSheet {
  name: string
  /** Độ rộng từng cột (số ký tự) */
  widths: number[]
  rows: XlsxCell[][]
  merges?: string[]
  /** Chiều cao riêng (điểm) theo số thứ tự dòng, bắt đầu từ 1 */
  heights?: Record<number, number>
  /** Số dòng đầu giữ cố định khi cuộn */
  freezeRows?: number
  /** Vùng bật bộ lọc, vd "A3:F10" */
  filter?: string
  /** Vùng vẽ thanh dữ liệu 0-100% */
  dataBars?: string[]
  landscape?: boolean
}

const esc = (s: string) =>
  s
    // Bỏ ký tự điều khiển XML không cho phép
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const columnName = (i: number): string => (i >= 26 ? columnName(Math.floor(i / 26) - 1) : '') + String.fromCharCode(65 + (i % 26))

const styleNames = Object.keys(STYLES) as XlsxStyle[]

function stylesXml() {
  const font = (size: number, color: string, bold = false) =>
    `<font>${bold ? '<b/>' : ''}<sz val="${size}"/><color rgb="FF${color}"/><name val="Calibri"/><family val="2"/></font>`
  const fonts = {
    base: font(11, '1C2216'), bold: font(11, '1C2216', true), title: font(18, 'FFFFFF', true), subtitle: font(13, '2B5619', true),
    muted: font(9, '6B7363'), white: font(11, 'FFFFFF', true), section: font(12, '2B5619', true), kpi: font(18, '326318', true),
  }
  const solid = (color: string) => `<fill><patternFill patternType="solid"><fgColor rgb="FF${color}"/><bgColor indexed="64"/></patternFill></fill>`
  const fills = { brand: solid('326318'), leaf: solid('E4F0DC'), sun: solid('FFF2B3'), zebra: solid('F6FAF3') }
  const fontIds = Object.keys(fonts)
  // Hai fill đầu là bắt buộc theo chuẩn Excel
  const fillIds = ['none', 'gray125', ...Object.keys(fills)]
  const edge = (tag: string) => `<${tag} style="thin"><color rgb="FFCFDCC6"/></${tag}>`
  const xfs = styleNames.map((name) => {
    const s: Style = STYLES[name]
    return (
      `<xf numFmtId="${s.numFmt ?? 0}" fontId="${fontIds.indexOf(s.font ?? 'base')}" fillId="${s.fill ? fillIds.indexOf(s.fill) : 0}" borderId="${s.border ? 1 : 0}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">` +
      `<alignment vertical="center"${s.h ? ` horizontal="${s.h}"` : ''}${s.wrap ? ' wrapText="1"' : ''}/></xf>`
    )
  })
  return (
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0;[Red]\\-#,##0"/></numFmts>' +
    `<fonts count="${fontIds.length}">${Object.values(fonts).join('')}</fonts>` +
    `<fills count="${fillIds.length}"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>${Object.values(fills).join('')}</fills>` +
    `<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border>${edge('left')}${edge('right')}${edge('top')}${edge('bottom')}<diagonal/></border></borders>` +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    // Kiểu 0 là mặc định, các kiểu đặt tên bắt đầu từ 1
    `<cellXfs count="${xfs.length + 1}"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>${xfs.join('')}</cellXfs>` +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'
  )
}

function sheetXml(sheet: XlsxSheet) {
  const rows = sheet.rows.map((cells, r) => {
    const xml = cells.map((cell, c) => {
      const ref = `${columnName(c)}${r + 1}`
      const style = cell.s ? ` s="${styleNames.indexOf(cell.s) + 1}"` : ''
      if (cell.f) return `<c r="${ref}"${style}><f>${esc(cell.f)}</f><v>${Number(cell.v ?? 0)}</v></c>`
      if (typeof cell.v === 'number') return `<c r="${ref}"${style}><v>${cell.v}</v></c>`
      if (cell.v == null || cell.v === '') return style ? `<c r="${ref}"${style}/>` : ''
      return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${esc(cell.v)}</t></is></c>`
    })
    const height = sheet.heights?.[r + 1]
    return `<row r="${r + 1}"${height ? ` ht="${height}" customHeight="1"` : ''}>${xml.join('')}</row>`
  })
  const cols = sheet.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')
  const pane = sheet.freezeRows
    ? `<pane ySplit="${sheet.freezeRows}" topLeftCell="A${sheet.freezeRows + 1}" activePane="bottomLeft" state="frozen"/>`
    : ''
  const merges = sheet.merges?.length ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : ''
  const bars = (sheet.dataBars ?? [])
    .map((ref, i) => `<conditionalFormatting sqref="${ref}"><cfRule type="dataBar" priority="${i + 1}"><dataBar><cfvo type="num" val="0"/><cfvo type="num" val="1"/><color rgb="FF8CC474"/></dataBar></cfRule></conditionalFormatting>`)
    .join('')
  // Thứ tự các thẻ phải đúng theo chuẩn, nếu không Excel báo file lỗi
  return (
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' +
    `<sheetViews><sheetView workbookViewId="0" showGridLines="0">${pane}</sheetView></sheetViews>` +
    '<sheetFormatPr defaultRowHeight="18" customHeight="1"/>' +
    `<cols>${cols}</cols><sheetData>${rows.join('')}</sheetData>` +
    (sheet.filter ? `<autoFilter ref="${sheet.filter}"/>` : '') +
    merges +
    bars +
    '<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>' +
    `<pageSetup paperSize="9" orientation="${sheet.landscape ? 'landscape' : 'portrait'}" fitToWidth="1" fitToHeight="0"/>` +
    '</worksheet>'
  )
}

export function buildXlsx(sheets: XlsxSheet[]): Uint8Array<ArrayBuffer> {
  const head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
  const type = 'application/vnd.openxmlformats-officedocument.spreadsheetml'
  // Tên sheet Excel: tối đa 31 ký tự, không chứa [ ] : * ? / \
  const names = sheets.map((s) => esc(s.name.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31)))
  const files: [string, string][] = [
    ['[Content_Types].xml',
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="${type}.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="${type}.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="${type}.worksheet+xml"/>`).join('')}</Types>`],
    ['_rels/.rels',
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml',
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${rel}"><sheets>${names.map((n, i) => `<sheet name="${n}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels',
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${rel}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="${rel}/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml', stylesXml()],
    ...sheets.map((s, i): [string, string] => [`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s)]),
  ]
  return zip(files.map(([name, xml]) => [name, new TextEncoder().encode(head + xml)]))
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(data: Uint8Array) {
  let c = 0xffffffff
  for (const b of data) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** Zip kiểu "store" (không nén) */
function zip(files: [string, Uint8Array][]): Uint8Array<ArrayBuffer> {
  const u16 = (v: number) => [v & 0xff, (v >>> 8) & 0xff]
  const u32 = (v: number) => [...u16(v & 0xffff), ...u16(v >>> 16)]
  const parts: Uint8Array[] = []
  const directory: Uint8Array[] = []
  let offset = 0
  for (const [name, data] of files) {
    const nameBytes = new TextEncoder().encode(name)
    // phiên bản 20, cờ tên UTF-8, không nén, giờ 0, ngày 01/01/1980
    const common = [...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc32(data)), ...u32(data.length), ...u32(data.length), ...u16(nameBytes.length), ...u16(0)]
    const local = new Uint8Array([...u32(0x04034b50), ...common])
    parts.push(local, nameBytes, data)
    directory.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...common, ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), nameBytes)
    offset += local.length + nameBytes.length + data.length
  }
  const dirSize = directory.reduce((n, p) => n + p.length, 0)
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(dirSize), ...u32(offset), ...u16(0)])
  const all = [...parts, ...directory, end]
  const out = new Uint8Array(all.reduce((n, p) => n + p.length, 0))
  let pos = 0
  for (const p of all) {
    out.set(p, pos)
    pos += p.length
  }
  return out
}

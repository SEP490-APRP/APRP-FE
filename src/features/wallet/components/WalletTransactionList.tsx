import { useState } from 'react'
import { ArrowDownRight, ArrowUpRight, ChevronDown, Clock, History } from 'lucide-react'
import {
  formatBackendDate,
  formatVnd,
  WALLET_TX_LABEL,
  type WalletTransactionResponse,
} from '@/services/wallet.service'

interface WalletTransactionListProps {
  items: WalletTransactionResponse[]
  isLoading?: boolean
  emptyText?: string
}

/** Nguồn tiền của bút toán, để sổ cái minh bạch: tiền này từ đâu, vì sao */
function sourceOf(tx: WalletTransactionResponse): { label: string; tone: string; explain: string } {
  const t = tx.type as string
  if (t === 'CAMPAIGN_DEPOSIT_HOLD')
    return { label: 'Cọc chiến dịch', tone: 'bg-amber-100 text-amber-800', explain: 'Tiền cọc người mua trả khi đặt trước. Sàn chỉ cầm giữ hộ, chưa phải doanh thu: huỷ chiến dịch thì hoàn lại người mua, hoàn tất thì giải ngân trả nhà vườn.' }
  if (t === 'CAMPAIGN_DEPOSIT_REFUNDED')
    return { label: 'Hoàn cọc chiến dịch', tone: 'bg-sky-100 text-sky-800', explain: 'Cọc đang giữ được trả lại vào ví CapNong của người mua (chiến dịch huỷ hoặc thiếu hàng).' }
  if (t === 'CAMPAIGN_DEPOSIT_RELEASED')
    return { label: 'Giải ngân cọc', tone: 'bg-emerald-100 text-emerald-800', explain: 'Chiến dịch hoàn tất: cọc chuyển từ tạm giữ sang số dư sàn để chi trả nhà vườn.' }
  if (t === 'CAMPAIGN_DEPOSIT_WALLET_PAID' || t === 'CAMPAIGN_DEPOSIT_WALLET_REFUND')
    return { label: 'Cọc chiến dịch', tone: 'bg-amber-100 text-amber-800', explain: 'Phần cọc người mua trả bằng số dư ví CapNong.' }
  if (t.startsWith('CAMPAIGN_'))
    return { label: 'Chiến dịch', tone: 'bg-lime-100 text-lime-800', explain: 'Bút toán thuộc chiến dịch giải cứu (thu phần còn lại, chi trả nhà vườn / shipper, bồi thường hàng hư).' }
  if (t.startsWith('WITHDRAW')) return { label: 'Rút tiền', tone: 'bg-gray-100 text-gray-700', explain: 'Lệnh rút tiền về tài khoản ngân hàng.' }
  if (t === 'TOP_UP') return { label: 'Nạp ví', tone: 'bg-gray-100 text-gray-700', explain: 'Nạp tiền vào ví qua PayOS.' }
  if (t.startsWith('COD')) return { label: 'COD', tone: 'bg-gray-100 text-gray-700', explain: 'Tiền mặt thu hộ khi giao đơn COD.' }
  return { label: tx.orderId ? 'Đơn hàng' : 'Khác', tone: 'bg-gray-100 text-gray-700', explain: tx.orderId ? 'Bút toán của đơn hàng thường.' : '' }
}

/** Lấy mã chiến dịch và mã đơn đặt trước từ mô tả bút toán (BE ghi dạng "... đơn XXX ... chiến dịch YYY") */
function refsOf(description?: string) {
  const d = description ?? ''
  const campaign = /chiến dịch\s+([A-Z][A-Z0-9-]{4,})/u.exec(d)?.[1]
  const preOrder = /đơn(?: đặt trước)?\s+([A-Z][A-Z0-9-]{4,})/u.exec(d)?.[1]
  return { campaign, preOrder }
}

/** Danh sách biến động ví (dùng chung cho Shop, Shipper, Admin). Bấm 1 dòng để xem chi tiết nguồn tiền */
export function WalletTransactionList({
  items,
  isLoading,
  emptyText = 'Chưa có giao dịch biến động nào. Doanh thu tiền bán nông sản sẽ tự động được ghi nhận tại đây khi đơn hoàn tất.',
}: WalletTransactionListProps) {
  const [openId, setOpenId] = useState<number | null>(null)
  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-[#f3f6ef] animate-pulse" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-12 px-4 text-center rounded-2xl bg-[#fafbfa] border border-dashed border-[#e3e8dd]">
        <div className="w-12 h-12 rounded-full bg-[#f0f4ec] text-[#6b7b64] flex items-center justify-center mx-auto mb-3">
          <History size={24} />
        </div>
        <h5 className="text-sm font-bold text-[#2d3429]">Chưa có biến động số dư</h5>
        <p className="text-xs text-[#788472] mt-1.5 max-w-sm mx-auto leading-relaxed">
          {emptyText}
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#f1f4ed]">
      {items.map((tx) => {
        const isIn = tx.amount >= 0
        // Giữ chỗ ký quỹ COD hiển thị như tạm giữ: không đổi số dư, chỉ đổi số dư khả dụng
        const isHold = tx.hold === true || tx.reserve === true
        const src = sourceOf(tx)
        const refs = refsOf(tx.description)
        const open = openId === tx.id
        return (
          <div key={tx.id}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : tx.id)}
              className="flex w-full items-center justify-between gap-3 py-3.5 px-2 rounded-xl text-left hover:bg-[#fafbfa] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center ${
                    isHold
                      ? 'bg-amber-50 text-amber-600 border border-amber-200'
                      : isIn
                        ? 'bg-[#eaf5e1] text-[#2b5619] border border-[#cbe5bd]'
                        : 'bg-[#fdeeed] text-[#c5221f] border border-[#fac8c6]'
                  }`}
                >
                  {isHold ? <Clock size={18} /> : isIn ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div className="min-w-0">
                  <h5 className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#1c2216]">
                    <span className={`rounded-full px-1.5 py-px text-[10px] font-bold ${src.tone}`}>{src.label}</span>
                    <span className="truncate">
                      {WALLET_TX_LABEL[tx.type] ?? tx.type}
                      {tx.orderId ? ` · Đơn #${tx.orderId}` : ''}
                      {refs.campaign ? ` · ${refs.campaign}` : ''}
                    </span>
                  </h5>
                  {tx.description && (
                    <p className="text-[11px] text-[#6e7767] truncate mt-0.5" title={tx.description}>
                      {tx.description}
                    </p>
                  )}
                  <span className="text-[10px] text-[#858f7e] mt-0.5 inline-block">{formatBackendDate(tx.createdAt)}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="text-right">
                  <div
                    className={`text-sm font-black ${
                      isHold ? 'text-amber-600' : isIn ? 'text-[#2b5619]' : 'text-[#c5221f]'
                    }`}
                  >
                    {formatVnd(tx.amount, true)}
                  </div>
                  <div className="text-[10px] text-[#858f7e] mt-0.5">
                    {tx.reserve
                      ? `Số dư: ${formatVnd(tx.balanceAfter)}`
                      : isHold
                        ? `Tạm giữ: ${formatVnd(tx.frozenAfter ?? 0)}`
                        : `Số dư: ${formatVnd(tx.balanceAfter)}`}
                  </div>
                </div>
                <ChevronDown size={14} className={`text-[#858f7e] transition-transform ${open ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {open && (
              <dl className="mb-3 grid gap-x-6 gap-y-2 rounded-2xl bg-[#f7faf4] border border-[#e8efe2] p-4 text-xs sm:grid-cols-2">
                <Info label="Nguồn tiền" value={src.label} />
                <Info label="Loại bút toán" value={WALLET_TX_LABEL[tx.type] ?? tx.type} />
                {refs.campaign && <Info label="Chiến dịch" value={refs.campaign} />}
                {refs.preOrder && <Info label="Đơn đặt trước / đơn" value={refs.preOrder} />}
                {tx.orderId != null && <Info label="Đơn hàng" value={`#${tx.orderId}`} />}
                <Info label={isHold ? 'Thay đổi tiền tạm giữ' : 'Thay đổi số dư'} value={formatVnd(tx.amount, true)} />
                <Info label="Tạm giữ sau bút toán" value={formatVnd(tx.frozenAfter ?? 0)} />
                <Info label="Số dư sau bút toán" value={formatVnd(tx.balanceAfter)} />
                <Info label="Thời gian" value={formatBackendDate(tx.createdAt)} />
                <Info label="Mã bút toán" value={`#${tx.id}`} />
                {src.explain && <p className="text-[11px] leading-relaxed text-[#5d6657] sm:col-span-2">{src.explain}</p>}
                {tx.description && <p className="whitespace-pre-line text-[11px] text-[#1c2216] sm:col-span-2">Ghi chú: {tx.description}</p>}
              </dl>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-[#858f7e]">{label}</dt>
      <dd className="break-words font-bold text-[#1c2216]">{value}</dd>
    </div>
  )
}

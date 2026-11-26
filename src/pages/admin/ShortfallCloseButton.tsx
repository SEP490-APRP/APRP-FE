import { useState } from 'react'
import { Loader2, Scissors } from 'lucide-react'
import { adminCampaignService, type CampaignResponse } from '@/services'
import { globalShowAlert, globalShowConfirm } from '@/components/common/Popup'
import { formatKg, formatVnd } from '@/features/campaign/utils'
import { getErrorMessage } from '@/utils'

/**
 * Không còn nhà vườn bổ sung: xem trước đơn nào bị bớt thùng hoặc huỷ, đồng ý thì hệ thống tính lại đơn,
 * hoàn cọc phần dư và đóng kêu gọi bổ sung.
 */
export default function ShortfallCloseButton({ c, onNotice }: { c: CampaignResponse; onNotice: (n: { ok: boolean; text: string }) => void }) {
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    try {
      const p = await adminCampaignService.previewShortfall(c.campaignId)
      if (p.items.length === 0) {
        await globalShowAlert('Không có đơn chưa đóng gói nào cần giảm.', 'info')
        return
      }
      const cancelled = p.items.filter((i) => i.newCrates === 0).length
      const agreed = await globalShowConfirm(
        'Không còn nhà vườn bổ sung?',
        'Hệ thống bớt thùng sao cho ít người mua bị ảnh hưởng nhất, hoàn cọc phần dư vào ví và báo cho từng người. Không hoàn tác được.',
        {
          danger: true,
          confirmText: 'Chốt thiếu và hoàn cọc',
          details: [
            `Thiếu ${formatKg(p.shortfallKg)}, bớt ${formatKg(p.removedKg)} ở ${p.items.length} đơn${cancelled ? ` (huỷ ${cancelled})` : ''}`,
            `Tổng hoàn cọc ${formatVnd(p.refundTotal)}`,
            ...p.items.map((i) =>
              i.newCrates === 0
                ? `${i.recipientName} · ${i.code}: huỷ đơn ${i.oldCrates * i.crateKg} kg, hoàn ${formatVnd(i.refund)}`
                : `${i.recipientName} · ${i.code}: còn ${i.newCrates}/${i.oldCrates} thùng ${i.crateKg} kg, hoàn ${formatVnd(i.refund)}`,
            ),
          ],
        },
      )
      if (!agreed) return
      await adminCampaignService.action(c.campaignId, 'resolve-shortfall')
      onNotice({ ok: true, text: `Đã chốt phần thiếu: bớt ${formatKg(p.removedKg)} ở ${p.items.length} đơn và hoàn cọc.` })
    } catch (e) {
      onNotice({ ok: false, text: getErrorMessage(e, 'Không chốt được phần thiếu.') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" disabled={busy} onClick={() => void run()}
      className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3.5 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">
      {busy ? <Loader2 size={16} className="animate-spin" /> : <Scissors size={16} />} Không còn hàng bổ sung, chốt thiếu
    </button>
  )
}

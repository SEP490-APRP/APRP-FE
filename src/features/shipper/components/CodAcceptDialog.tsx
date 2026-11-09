import { useState } from 'react'
import { ShieldCheck, Wallet } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { money } from '@/mocks/catalog'
import { TopupDialog, useMyWallet } from '@/features/wallet'

interface CodAcceptDialogProps {
  orderId: number
  /** Tiền mặt sẽ thu của khách = số tiền phải ký quỹ */
  codAmount: number
  shopName?: string
  accepting?: boolean
  onConfirm: () => void
  onClose: () => void
}

/**
 * Nhận đơn COD: tài xế chỉ nhận được khi số dư khả dụng trong ví >= tiền COD.
 * Tiền được giữ chỗ khi nhận đơn, trừ ví khi giao xong (khách trả tiền mặt), trả lại nếu giao thất bại.
 */
export function CodAcceptDialog({ orderId, codAmount, shopName, accepting, onConfirm, onClose }: CodAcceptDialogProps) {
  const walletQuery = useMyWallet()
  const [topupOpen, setTopupOpen] = useState(false)
  const w = walletQuery.data
  const available = Number(w?.availableBalance ?? w?.balance ?? 0)
  const missing = Math.max(0, codAmount - available)
  const enough = !walletQuery.isLoading && missing === 0

  return (
    <>
      <Modal title={`Nhận đơn COD #${orderId}`} onClose={onClose}>
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            {shopName ? `Đơn của ${shopName}. ` : ''}Khách trả tiền mặt khi nhận hàng. Hệ thống giữ chỗ số tiền này trong ví của
            bạn để đảm bảo tiền thu hộ được nộp về sàn.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-card border border-line p-4">
              <p className="text-caption font-bold text-ink-muted">Cần ký quỹ</p>
              <p className="mt-1 text-xl font-extrabold text-ink">{money(codAmount)}</p>
            </div>
            <div className={`rounded-card border p-4 ${enough ? 'border-leaf-200 bg-leaf-50' : 'border-sale/30 bg-sale-soft'}`}>
              <p className="text-caption font-bold text-ink-muted">Số dư khả dụng</p>
              <p className={`mt-1 text-xl font-extrabold ${enough ? 'text-leaf-700' : 'text-sale'}`}>
                {walletQuery.isLoading ? '...' : money(Math.max(0, available))}
              </p>
            </div>
          </div>
          <ul className="space-y-1 text-caption text-ink-muted">
            <li className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-leaf-600" /> Giao xong: tiền mặt bạn thu chính là tiền ký quỹ, ví bị trừ đúng số này.</li>
            <li className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-leaf-600" /> Giao thất bại: tiền ký quỹ được trả lại ngay.</li>
            <li className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-leaf-600" /> Cước giao vào ví khi khách xác nhận đã nhận hàng.</li>
          </ul>
          {!enough && !walletQuery.isLoading && (
            <p className="rounded-xl bg-sale-soft p-3 text-sm font-semibold text-sale">
              Ví còn thiếu {money(missing)}. Nạp thêm để nhận đơn này.
            </p>
          )}
          <div className="flex gap-3">
            {enough ? (
              <>
                <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={accepting}>
                  Để sau
                </Button>
                <Button type="button" fullWidth onClick={onConfirm} loading={accepting}>
                  Ký quỹ và nhận đơn
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" fullWidth onClick={onClose}>
                  Đóng
                </Button>
                <Button type="button" variant="accent" fullWidth leftIcon={<Wallet className="size-4" />} onClick={() => setTopupOpen(true)}>
                  Nạp ví
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>
      <TopupDialog open={topupOpen} onClose={() => setTopupOpen(false)} suggestedAmount={missing} />
    </>
  )
}

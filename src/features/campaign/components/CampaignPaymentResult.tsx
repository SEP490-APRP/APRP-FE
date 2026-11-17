import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { campaignService, type PreOrderResponse } from '@/services'
import { formatKg, formatVnd } from '@/features/campaign/utils'
import { getErrorMessage } from '@/utils'

/**
 * PayOS quay về /payment/result?type=campaign&preOrderId=...
 * Thanh toán xong: gọi confirm-payment để BE đối soát với PayOS. Huỷ: gọi cancel cho đơn đặt trước.
 */
export default function CampaignPaymentResult() {
  const [params] = useSearchParams()
  const preOrderId = Number(params.get('preOrderId'))
  const cancelled =
    params.get('cancel') === 'true' || params.get('status') === 'CANCELLED' || params.get('source') === 'payos-cancel'
  const started = useRef(false)

  const run = useMutation<PreOrderResponse>({
    mutationFn: () =>
      cancelled ? campaignService.cancelPreOrder(preOrderId) : campaignService.confirmDepositPayment(preOrderId),
  })
  const { mutate } = run

  useEffect(() => {
    if (!preOrderId || started.current) return
    started.current = true
    mutate()
  }, [preOrderId, mutate])

  const p = run.data
  const paid = !cancelled && !!p && p.status !== 'PENDING' && p.status !== 'CANCELLED'

  return (
    <div className="page-container flex justify-center py-16">
      <div className="w-full max-w-lg rounded-3xl border border-[#e4ddcc] bg-white p-8 text-center shadow-lg">
        {!preOrderId ? (
          <>
            <XCircle size={48} className="mx-auto text-[#b3261e]" />
            <h1 className="mt-4 text-xl font-black text-[#1c1c18]">Thiếu mã đơn đặt trước</h1>
          </>
        ) : run.isError ? (
          <>
            <XCircle size={48} className="mx-auto text-[#b3261e]" />
            <h1 className="mt-4 text-xl font-black text-[#1c1c18]">Chưa xác nhận được tiền cọc</h1>
            <p className="mt-2 text-sm text-[#42493c]">{getErrorMessage(run.error)}</p>
          </>
        ) : !p ? (
          <>
            <Loader2 size={44} className="mx-auto animate-spin text-[#4a7c2f]" />
            <h1 className="mt-4 text-xl font-black text-[#1c1c18]">Đang xác nhận tiền cọc…</h1>
          </>
        ) : paid ? (
          <>
            <CheckCircle2 size={48} className="mx-auto text-[#4a7c2f]" />
            <h1 className="mt-4 text-2xl font-black text-[#1c1c18]">Cảm ơn bạn đã góp một thùng!</h1>
            <p className="mt-2 text-sm text-[#42493c]">
              Đơn {p.code} cho chiến dịch “{p.campaignTitle}” đã được giữ chỗ. CapNong giữ khoản cọc tới khi chiến dịch
              kết thúc.
            </p>
          </>
        ) : (
          <>
            <XCircle size={48} className="mx-auto text-[#c27c00]" />
            <h1 className="mt-4 text-xl font-black text-[#1c1c18]">
              {cancelled ? 'Bạn đã huỷ thanh toán cọc' : 'Chưa nhận được tiền cọc'}
            </h1>
            <p className="mt-2 text-sm text-[#42493c]">
              Đơn đặt trước chưa được giữ chỗ. Bạn có thể đặt lại trong trang chiến dịch.
            </p>
          </>
        )}

        {p && (
          <dl className="mt-6 rounded-2xl bg-[#f5f1e6] p-4 text-left text-sm">
            <div className="flex justify-between py-1">
              <dt>
                {p.crateQuantity} thùng × {p.crateKg} kg
              </dt>
              <dd className="font-bold">{formatKg(p.totalKg)}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt>Tiền cọc</dt>
              <dd className="font-bold">{formatVnd(p.depositAmount)}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt>Trả khi nhận hàng</dt>
              <dd className="font-bold">{formatVnd(p.remainingAmount)}</dd>
            </div>
          </dl>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {p && (
            <a
              href={`/chien-dich/${p.campaignId}`}
              className="rounded-full bg-[#4a7c2f] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2b5619]"
            >
              Về trang chiến dịch
            </a>
          )}
          <a href="/chien-dich" className="rounded-full border border-[#c9c2b1] px-5 py-2.5 text-sm font-bold text-[#2b5619]">
            Xem chiến dịch khác
          </a>
        </div>
      </div>
    </div>
  )
}

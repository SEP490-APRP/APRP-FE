import React, { useEffect, useState } from 'react'
import { QrCode, ExternalLink, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Modal from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { paymentService } from '@/services'

interface PaymentQrModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmed: () => void
  qrCodeUrl?: string
  checkoutUrl?: string
  amount: number
  orderCode: string
}

export const PaymentQrModal: React.FC<PaymentQrModalProps> = ({
  isOpen,
  onClose,
  onConfirmed,
  qrCodeUrl,
  checkoutUrl,
  amount,
  orderCode,
}) => {
  const [isVerifying, setIsVerifying] = useState(false)

  // Kiểm tra xem chuỗi có phải link ảnh trực tiếp không
  const isDirectImageUrl = (val?: string) => {
    if (!val) return false
    return (
      val.startsWith('http://') ||
      val.startsWith('https://') ||
      val.startsWith('data:image/')
    ) && (
      val.includes('.png') ||
      val.includes('.jpg') ||
      val.includes('.jpeg') ||
      val.includes('.svg') ||
      val.includes('vietqr.io') ||
      val.startsWith('data:image/')
    )
  }

  // Giá trị mã QR để sinh hình ảnh (VietQR payload hoặc link thanh toán)
  const qrPayload = qrCodeUrl || checkoutUrl

  // Tự động kiểm tra trạng thái thanh toán định kỳ mỗi 3s khi modal đang mở
  useEffect(() => {
    if (!isOpen || !orderCode) return

    const interval = setInterval(async () => {
      try {
        const res = await paymentService.confirmPayment(orderCode)
        if (res && res.status === 'PAID') {
          clearInterval(interval)
          onConfirmed()
        }
      } catch {
        // Tiếp tục lắng nghe
      }
    }, 3500)

    return () => clearInterval(interval)
  }, [isOpen, orderCode, onConfirmed])

  if (!isOpen) return null

  const handleManualCheck = async () => {
    setIsVerifying(true)
    try {
      const res = await paymentService.confirmPayment(orderCode)
      if (res && res.status === 'PAID') {
        onConfirmed()
      } else {
        // Vẫn chưa nhận được tiền hoặc đang xử lý
        alert('Giao dịch chưa được ghi nhận trên cổng thanh toán. Nếu bạn vừa chuyển tiền, vui lòng chờ trong giây lát hệ thống sẽ tự động cập nhật.')
      }
    } catch {
      alert('Chưa nhận được giao dịch. Vui lòng kiểm tra lại ứng dụng ngân hàng của bạn.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Modal title="Thanh toán qua mã QR VietQR (PayOS)" onClose={onClose}>
      <div className="flex flex-col items-center text-center p-2">
        <p className="text-sm text-gray-500 mb-3">
          Sử dụng ứng dụng ngân hàng hoặc ví điện tử bất kỳ để quét mã QR bên dưới.
        </p>

        <div className="bg-white p-4 rounded-2xl border-2 border-emerald-500/20 shadow-md mb-4 inline-block">
          {isDirectImageUrl(qrCodeUrl) ? (
            <img
              src={qrCodeUrl}
              alt="Mã QR thanh toán PayOS"
              className="w-64 h-64 object-contain rounded-lg mx-auto"
            />
          ) : qrPayload ? (
            <div className="flex flex-col items-center justify-center">
              <QRCodeSVG
                value={qrPayload}
                size={240}
                level="M"
                includeMargin={true}
                className="rounded-lg shadow-sm"
              />
              <span className="text-[11px] text-gray-500 mt-2 font-medium">
                VietQR · Quét bằng mọi app ngân hàng & ví
              </span>
            </div>
          ) : (
            <div className="w-64 h-64 flex flex-col items-center justify-center bg-gray-50 text-gray-400 rounded-lg">
              <QrCode size={48} className="mb-2 opacity-50" />
              <span className="text-xs">Đang tải mã QR...</span>
            </div>
          )}
        </div>

        <div className="w-full bg-gray-50 rounded-xl p-3 mb-4 text-left border border-gray-100">
          <div className="flex justify-between items-center text-sm py-1 border-b border-gray-200/60">
            <span className="text-gray-500">Số tiền:</span>
            <span className="font-bold text-emerald-700 text-base">
              {amount.toLocaleString('vi-VN')} đ
            </span>
          </div>
          <div className="flex justify-between items-center text-sm py-1 border-b border-gray-200/60">
            <span className="text-gray-500">Mã đơn hàng:</span>
            <span className="font-mono font-medium text-gray-700">{orderCode}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-700 mt-2 bg-amber-50 p-2 rounded-lg">
            <ShieldAlert size={15} className="shrink-0" />
            <span>Vui lòng không thay đổi nội dung chuyển khoản để hệ thống tự động xử lý.</span>
          </div>
        </div>

        <div className="flex flex-col w-full gap-2">
          {checkoutUrl && (
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button variant="secondary" className="w-full gap-2 justify-center">
                <ExternalLink size={15} />
                Mở cổng thanh toán PayOS
              </Button>
            </a>
          )}
          <div className="flex items-center justify-center gap-2 text-xs text-amber-600 mb-2 py-1 bg-amber-50 rounded-lg">
            <Loader2 size={13} className="animate-spin text-amber-600" />
            <span>Đang lắng nghe chuyển khoản tự động...</span>
          </div>

          <Button
            variant="primary"
            onClick={handleManualCheck}
            disabled={isVerifying}
            className="w-full gap-2 justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isVerifying ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            Tôi đã hoàn tất chuyển khoản
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full text-xs text-gray-500 hover:text-gray-700">
            Thanh toán sau (Đóng)
          </Button>
        </div>
      </div>
    </Modal>
  )
}

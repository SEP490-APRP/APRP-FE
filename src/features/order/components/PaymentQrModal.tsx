import React from 'react'
import { QrCode, ExternalLink, CheckCircle, ShieldAlert } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

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
  if (!isOpen) return null

  return (
    <Modal title="Thanh toán qua mã QR VietQR (PayOS)" onClose={onClose}>
      <div className="flex flex-col items-center text-center p-2">
        <p className="text-sm text-gray-500 mb-3">
          Sử dụng ứng dụng ngân hàng hoặc ví điện tử bất kỳ để quét mã QR bên dưới.
        </p>

        <div className="bg-white p-3 rounded-2xl border-2 border-emerald-500/20 shadow-md mb-4 inline-block">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="Mã QR thanh toán PayOS"
              className="w-64 h-64 object-contain rounded-lg mx-auto"
            />
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
          <Button
            variant="primary"
            onClick={onConfirmed}
            className="w-full gap-2 justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle size={16} />
            Tôi đã hoàn tất chuyển khoản
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full text-xs text-gray-400">
            Hủy bỏ
          </Button>
        </div>
      </div>
    </Modal>
  )
}

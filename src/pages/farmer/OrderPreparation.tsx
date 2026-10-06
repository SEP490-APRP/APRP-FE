import React from 'react'
import { ArrowLeft } from 'lucide-react'

interface OrderPreparationProps {
  orderId?: string
  onBack: () => void
  onInfo?: (msg: string) => void
}

export default function OrderPreparation({ orderId, onBack, onInfo }: OrderPreparationProps) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-[#e8ece3] shadow-sm space-y-6 animate-fadeIn max-w-2xl">
      <div className="flex items-center justify-between pb-4 border-b border-[#f1f4ed]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-[#f4f7f1] text-[#616a5b] cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h3 className="text-xl font-black text-[#1c2216]">Chuẩn Bị &amp; Đóng Gói Đơn Hàng</h3>
            <span className="text-xs text-[#326318] font-bold">Mã đơn: {orderId || 'DH-8921'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 text-xs">
        <div className="p-4 rounded-2xl bg-[#fafcf9] border border-[#e5edd9] space-y-2">
          <div className="font-extrabold text-[#326318] uppercase text-[10px]">
            Danh Sách Nông Sản Cần Đóng Thùng:
          </div>
          <ul className="list-disc list-inside space-y-1 text-[#3b4334]">
            <li>5 kg Khoai Lang Mật Đà Lạt (Rũ sạch đất, bọc giấy thoáng khí)</li>
            <li>2 kg Cà chua Bi vườn hữu cơ (Xếp khay chống dập)</li>
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-[#fdfaf3] border border-[#f3e4cf] space-y-1">
          <div className="font-bold text-[#8a4e1d]">Lưu ý bảo quản tươi:</div>
          <p className="text-[#646e5e]">
            Dán mã QR kiểm định của nhà vườn lên mặt trên của thùng trước khi bàn giao cho tài xế xe
            lạnh.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            onInfo?.(`Đã xác nhận đóng gói hoàn tất cho đơn ${orderId || 'DH-8921'}`)
            onBack()
          }}
          className="w-full py-3.5 rounded-2xl bg-[#326318] hover:bg-[#254b12] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
        >
          Xác Nhận Đóng Thùng Xong ➔ Chuyển Tới Kho
        </button>
      </div>
    </div>
  )
}

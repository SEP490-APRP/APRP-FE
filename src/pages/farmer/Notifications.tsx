import React from 'react'
import { Bell, ShieldCheck, Coins } from 'lucide-react'

export default function Notifications() {
  const list = [
    {
      id: '1',
      title: 'Tiền quyết toán 14.280.000đ đã chuyển vào tài khoản',
      desc: 'Khoản thanh toán tự động cho 12 đơn hàng hoàn tất tuần qua.',
      time: 'Hôm nay · 08:30',
      icon: Coins,
      read: false,
    },
    {
      id: '2',
      title: 'Camera AI kiểm định lô bắp cải đạt chuẩn 98% tươi ngon',
      desc: 'Lô hàng đã được duyệt và đưa lên sàn giải cứu ưu tiên.',
      time: 'Hôm qua',
      icon: ShieldCheck,
      read: true,
    },
    {
      id: '3',
      title: 'Có 3 đơn hàng mới đang chờ bạn chuẩn bị đóng gói',
      desc: 'Vui lòng kiểm tra mục Chuẩn bị hàng trước 17:00 chiều.',
      time: '2 ngày trước',
      icon: Bell,
      read: true,
    },
  ]

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm space-y-4 animate-fadeIn max-w-3xl">
      <div className="flex items-center justify-between pb-3 border-b border-[#f1f4ed]">
        <h3 className="text-2xl font-black text-[#1c2216]">Thông Báo Hệ Thống</h3>
        <span className="text-xs text-[#326318] font-bold">1 thông báo mới</span>
      </div>

      <div id="tour-notifications-list" className="divide-y divide-[#f1f4ed]">
        {list.map((nt) => (
          <div
            key={nt.id}
            className="py-4 flex items-start gap-4 hover:bg-[#fafcf9] px-2 rounded-2xl transition-colors"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#326318]/10 text-[#326318] flex items-center justify-center shrink-0 mt-0.5">
              <nt.icon size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-[#1c2216]">{nt.title}</h5>
                <span className="text-[10px] text-[#879080]">{nt.time}</span>
              </div>
              <p className="text-xs text-[#636c5f] mt-0.5">{nt.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

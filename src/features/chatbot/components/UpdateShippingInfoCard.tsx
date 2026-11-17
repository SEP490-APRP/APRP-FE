import React from 'react'
import { MapPin, Phone, AlertTriangle, Headphones, ArrowRight, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { UpdateShippingInfoDto } from '@/services/chatbot.types'
import { useChatbotStore } from '../stores/useChatbotStore'

interface UpdateShippingInfoCardProps {
  info: UpdateShippingInfoDto
}

export const UpdateShippingInfoCard: React.FC<UpdateShippingInfoCardProps> = ({ info }) => {
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)

  const isPhone = info.updateType === 'PHONE'

  const guidanceText =
    info.guidance ||
    info.note ||
    info.suggestedAction ||
    (isPhone
      ? 'Hệ thống không hỗ trợ sửa trực tiếp số điện thoại trên đơn đã chốt để tránh xung đột dữ liệu vận chuyển. Bạn hãy liên hệ trực tiếp với tài xế giao hàng hoặc bộ phận hỗ trợ để được chuyển số mới nhé!'
      : 'Hệ thống CapNong tính cước vận chuyển tự động theo toạ độ Google Maps giữa nhà vườn và người nhận nên không hỗ trợ đổi trực tiếp địa chỉ trên đơn đã chốt. Nếu đơn chưa giao, bạn có thể Hủy đơn trong mục Đơn hàng của tôi để đặt lại địa chỉ mới nhé!')

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-amber-50/90 via-sky-50/50 to-slate-50 border border-amber-200/90 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-200/70 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#326318] text-white shadow-2xs">
            {isPhone ? (
              <Phone className="w-4 h-4 text-[#ffba41]" />
            ) : (
              <MapPin className="w-4 h-4 text-[#ffba41]" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-soil-900">
              {info.orderId > 0 ? `Đơn hàng #${info.orderId}` : 'Thông tin nhận hàng'}
            </h4>
            <span className="text-[10px] text-soil-600 font-medium">
              {info.orderStatus
                ? `Trạng thái: ${info.orderStatus}`
                : isPhone
                ? 'Số điện thoại đã lưu vào đơn'
                : 'Địa chỉ giao hàng đã chốt'}
            </span>
          </div>
        </div>
        <div>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center gap-1 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            {isPhone ? 'Không thể tự sửa trên app' : 'Không thể đổi trực tiếp'}
          </span>
        </div>
      </div>

      {/* Current Shipping Info */}
      <div className="p-2.5 rounded-lg bg-white/95 border border-slate-200/80 space-y-1.5 text-xs shadow-2xs">
        <div className="flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-soil-600 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-soil-700 leading-tight">
            <span className="text-soil-500 font-normal">Địa chỉ nhận: </span>
            <span className="font-medium text-soil-900">{info.currentAddress || 'Chưa cập nhật'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
          <Phone className="w-3.5 h-3.5 text-soil-600 flex-shrink-0" />
          <div className="text-[11px] text-soil-700">
            <span className="text-soil-500 font-normal">SĐT người nhận hiện tại: </span>
            <span className="font-semibold text-soil-900">{info.currentPhone || 'Chưa cập nhật'}</span>
          </div>
        </div>
        {info.shipperPhone && (
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 bg-emerald-50/70 p-2 rounded-lg">
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <div className="text-[11px] text-soil-700">
                <span className="text-emerald-800 font-semibold">Tài xế giao hàng: </span>
                <span className="text-soil-900">{info.shipperName || 'Shipper CapNong'}</span>
              </div>
            </div>
            <a
              href={`tel:${info.shipperPhone}`}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              <span>{info.shipperPhone}</span>
            </a>
          </div>
        )}
      </div>

      {/* Note / Policy explanation */}
      <div className="text-[11px] text-soil-700 leading-relaxed bg-amber-50/80 p-2.5 rounded-lg border border-amber-200">
        <p className="font-medium text-amber-900 mb-0.5">📌 Hướng dẫn xử lý:</p>
        <p>{guidanceText}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isPhone && info.shipperPhone ? (
          <>
            <a
              href={`tel:${info.shipperPhone}`}
              className="flex-1 py-2 px-3 text-xs font-bold text-white bg-[#15803d] hover:bg-[#166534] rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-white" />
              <span>Gọi Shipper báo số mới</span>
            </a>
            {info.supportContact && (
              <a
                href={`tel:${info.supportContact}`}
                className="py-2 px-3 text-xs font-semibold text-[#1c1c17] bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5 text-[#ffba41]" />
                <span>Hotline</span>
              </a>
            )}
          </>
        ) : (
          <>
            <Link
              to="/orders"
              onClick={() => toggleOpen()}
              className="flex-1 py-2 px-3 text-xs font-bold text-white bg-[#326318] hover:bg-[#254b12] rounded-xl shadow-2xs flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <span>Xem đơn hàng của tôi</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#ffba41]" />
            </Link>
            {info.supportContact && (
              <a
                href={`tel:${info.supportContact}`}
                className="py-2 px-3 text-xs font-semibold text-[#1c1c17] bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5 text-[#ffba41]" />
                <span>Gọi hotline</span>
              </a>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default UpdateShippingInfoCard

import type { DeliveryFailReason } from '@/services/shipper.service'

/** Lý do giao thất bại hiển thị cho tài xế (khớp enum DeliveryFailReason ở BE) */
export const FAIL_REASONS: { value: DeliveryFailReason; label: string; hint: string }[] = [
  { value: 'KHONG_LIEN_LAC_DUOC', label: 'Không liên lạc được', hint: 'Gọi nhiều lần khách không nghe máy' },
  { value: 'SAI_DIA_CHI', label: 'Sai địa chỉ', hint: 'Không tìm thấy địa chỉ nhận hàng' },
  { value: 'KHACH_TU_CHOI', label: 'Khách từ chối nhận', hint: 'Khách không nhận hoặc không thanh toán' },
  { value: 'KHAC', label: 'Lý do khác', hint: 'Ghi rõ lý do ở ô ghi chú' },
]

export const FAIL_REASON_LABEL: Record<DeliveryFailReason, string> = {
  KHONG_LIEN_LAC_DUOC: 'Không liên lạc được',
  SAI_DIA_CHI: 'Sai địa chỉ',
  KHACH_TU_CHOI: 'Khách từ chối nhận',
  SHOP_DONG_CUA: 'Vườn đóng cửa',
  SHOP_CHUA_SAN_SANG: 'Hàng chưa sẵn sàng',
  KHAC: 'Lý do khác',
}

export function failReasonLabel(reason?: string | null): string {
  if (!reason) return 'Không rõ lý do'
  return FAIL_REASON_LABEL[reason as DeliveryFailReason] ?? reason
}

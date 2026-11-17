import React, { useState } from 'react'
import {
  UserX,
  ShieldAlert,
  Zap,
  AlertCircle,
  Lock,
  Unlock,
  History,
  Filter,
  Download,
  XCircle,
  Loader2,
  X,
  Eye,
  Mail,
  Calendar,
  User,
  Megaphone,
  RotateCcw,
} from 'lucide-react'
import type { UserResponse } from '@/services'
import { userService } from '@/services'
import { useFetchUser, useSetUserActive, useUsersByRole } from '@/features/user'
import Pagination, { PageInfo } from '@/components/ui/Pagination'
import { globalShowAlert, globalShowConfirm } from '@/components/common/Popup'
import { getErrorMessage } from '@/utils'

const PAGE_SIZE = 10

const BUYER_ROLES = ['BUYER']

const BadBuyers: React.FC = () => {
  const [page, setPage] = useState(0)
  const [selectedBuyer, setSelectedBuyer] = useState<UserResponse | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  const buyersQuery = useUsersByRole(BUYER_ROLES, null, page, PAGE_SIZE)
  const fetchUser = useFetchUser()
  const setActive = useSetUserActive()

  const buyers = buyersQuery.data?.content ?? []
  const pageInfo: PageInfo | null = buyersQuery.data ?? null
  const loading = buyersQuery.isPending
  const error = buyersQuery.isError ? 'Không thể tải danh sách người mua.' : null
  const processing = setActive.isPending ? setActive.variables.userId : null

  const handleBlock = async (userId: number) => {
    if (!(await globalShowConfirm('Xác nhận', 'Bạn có chắc muốn khóa tài khoản này?'))) return
    try {
      await setActive.mutateAsync({ userId, active: false })
    } catch (err) {
      globalShowAlert(getErrorMessage(err, 'Không thể khóa tài khoản'), 'Lỗi', 'error')
    }
  }

  const handleViewProfile = async (userId: number) => {
    setModalLoading(true)
    setSelectedBuyer(null)
    try {
      setSelectedBuyer(await fetchUser(userId))
    } catch {
      globalShowAlert('Không thể tải thông tin người dùng. Vui lòng thử lại.', 'Lỗi', 'error')
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    setSelectedBuyer(null)
    setModalLoading(false)
  }

  const handleUnblock = async (userId: number) => {
    try {
      await setActive.mutateAsync({ userId, active: true })
    } catch (err) {
      globalShowAlert(getErrorMessage(err, 'Không thể mở khóa tài khoản'), 'Lỗi', 'error')
    }
  }

  const [resettingId, setResettingId] = useState<number | null>(null)

  const handleResetPenalties = async (userId: number) => {
    const confirmed = await globalShowConfirm(
      'Khôi phục quyền COD & Xóa vi phạm',
      'Bạn có chắc chắn muốn xóa lịch sử vi phạm bom hàng và mở lại quyền thanh toán COD cho khách hàng này?'
    )
    if (!confirmed) return

    setResettingId(userId)
    try {
      await userService.resetCustomerPenalties(userId)
      globalShowAlert(
        'Đã khôi phục quyền thanh toán COD và xóa vi phạm bom hàng thành công!',
        'Thành công',
        'success'
      )
      if (selectedBuyer && selectedBuyer.id === userId) {
        const updated = await fetchUser(userId)
        setSelectedBuyer(updated)
      }
      void buyersQuery.refetch()
    } catch (err) {
      globalShowAlert(getErrorMessage(err, 'Không thể đặt lại vi phạm'), 'Lỗi', 'error')
    } finally {
      setResettingId(null)
    }
  }

  const blockedBuyers = buyers.filter((b) => b.lockedAt != null || b.status === 'INACTIVE')
  const codBlockedBuyers = buyers.filter((b) => b.codBlocked || (b.failedDeliveryCount ?? 0) >= 3)
  const activeBuyers = buyers.filter((b) => b.lockedAt == null && b.status === 'ACTIVE')

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <Loader2 className="size-10 text-primary animate-spin" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
          Đang tải danh sách người mua...
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-8 animate-in fade-in duration-500">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: 'TỔNG TÀI KHOẢN BỊ KHÓA',
            value: blockedBuyers.length.toLocaleString(),
            sub: 'Tạm khóa 7 ngày hoặc vô hiệu hóa',
            icon: UserX,
            color: 'text-red-500',
            bg: 'bg-red-50',
          },
          {
            label: 'BỊ TƯỚC QUYỀN COD',
            value: codBlockedBuyers.length.toLocaleString(),
            sub: 'Bom hàng từ 3 lần trở lên',
            icon: ShieldAlert,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
          },
          {
            label: 'TỔNG NGƯỜI MUA',
            value: buyers.length.toLocaleString(),
            sub: 'Tất cả trạng thái tài khoản',
            icon: Unlock,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm flex items-center gap-4 group"
          >
            <div
              className={`size-14 ${stat.bg} ${stat.color} rounded-[24px] flex items-center justify-center transition-transform group-hover:scale-110 shrink-0`}
            >
              <stat.icon className="size-7" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 line-clamp-2">
                {stat.label}
              </p>
              <h3 className="text-3xl font-black text-gray-900 font-display">{stat.value}</h3>
              <p className={`text-[9px] font-bold mt-1 ${stat.color} opacity-80`}>{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-sm">
          <AlertCircle className="size-5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Buyers Table */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between">
            <h4 className="font-black text-gray-800 uppercase tracking-tight">
              DANH SÁCH NGƯỜI MUA ({buyers.length})
            </h4>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black text-gray-500 flex items-center gap-2 uppercase tracking-widest">
                <Filter className="size-3" /> Lọc
              </button>
              <button className="px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black text-gray-500 flex items-center gap-2 uppercase tracking-widest">
                <Download className="size-3" /> Xuất
              </button>
            </div>
          </div>
          <table className="w-full text-left" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-10 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Người dùng
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                  Trạng thái
                </th>
                <th className="px-10 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                  Thao tác
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                  Chi tiết
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {buyers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-10 text-center text-gray-400 font-bold">
                    Không có người mua nào.
                  </td>
                </tr>
              ) : (
                buyers.map((user, i) => {
                  const isBlocked = user.lockedAt != null || user.status === 'INACTIVE'
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-gray-50/30 transition-colors ${isBlocked ? 'bg-red-50/20' : ''}`}
                    >
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="size-11 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                            {isBlocked ? (
                              <Lock className="size-5 text-red-500" />
                            ) : (
                              <User className="size-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p
                                className={`text-sm font-black ${isBlocked ? 'text-red-700' : 'text-gray-900'}`}
                              >
                                {user.fullName || user.username || 'N/A'}
                              </p>
                              {typeof user.failedDeliveryCount === 'number' && user.failedDeliveryCount > 0 && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                  Bom {user.failedDeliveryCount} lần
                                </span>
                              )}
                              {user.codBlocked && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                                  Khóa COD
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                              ID: {user.id} {user.email ? `• ${user.email}` : ''}
                            </p>
                            {user.lockedAt && (
                              <p className="text-[10px] text-red-400 font-bold mt-0.5">
                                Khóa lúc: {new Date(user.lockedAt).toLocaleString('vi-VN')}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span
                          className={`px-3 py-1 rounded-lg text-[10px] font-black whitespace-nowrap ${
                            isBlocked
                              ? 'bg-red-50 text-red-500 border border-red-200'
                              : user.codBlocked
                                ? 'bg-orange-50 text-orange-600 border border-orange-200'
                                : 'bg-green-50 text-green-600'
                          }`}
                        >
                          {isBlocked
                            ? 'Đã tạm khóa'
                            : user.codBlocked
                              ? 'Khóa COD'
                              : 'Hoạt động'}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-4">
                          {isBlocked ? (
                            <button
                              onClick={() => handleUnblock(user.id)}
                              disabled={processing === user.id}
                              className="px-6 py-2 border border-blue-100 text-blue-600 text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-blue-50 transition-colors disabled:opacity-50"
                            >
                              Mở khóa
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlock(user.id)}
                              disabled={processing === user.id}
                              className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline disabled:opacity-50"
                            >
                              CHẶN
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <button
                          onClick={() => handleViewProfile(user.id)}
                          className="size-9 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors mx-auto"
                          title="Xem chi tiết"
                        >
                          <Eye className="size-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          <div className="p-8 bg-white border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">Hiển thị {buyers.length} người mua</p>
          </div>
          {pageInfo && <Pagination pageInfo={pageInfo} onPageChange={setPage} className="px-8" />}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-8">
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10 flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <Zap className="size-6 text-orange-500" />
              <h4 className="font-black text-gray-800 uppercase tracking-tight">
                Quy tắc tự động khóa
              </h4>
            </div>
            <div className="space-y-6">
              {[
                {
                  id: 1,
                  title: 'Cảnh báo nhắc nhở (Lỗi chủ quan 1 – 2 lần)',
                  text: 'Khi khách có 1 hoặc 2 đơn giao thất bại do lỗi chủ quan (không liên lạc được, từ chối nhận), hệ thống tự động gửi thông báo nhắc nhở.',
                },
                {
                  id: 2,
                  title: 'Tước quyền COD (Giao thất bại 3 lần)',
                  text: 'Khách bị giao hàng thất bại 3 lần do lỗi chủ quan sẽ bị cảnh báo tài khoản và tước quyền thanh toán COD (chỉ cho phép thanh toán online qua PayOS).',
                },
                {
                  id: 3,
                  title: 'Tự động tạm khóa 7 ngày (Bom hàng 5 lần)',
                  text: 'Khách bom hàng đủ 5 lần sẽ bị hệ thống tự động tạm khóa tài khoản (suspended) trong 7 ngày. Hết hạn 7 ngày hệ thống tự động mở khóa.',
                },
              ].map((rule) => (
                <div key={rule.id} className="flex gap-4">
                  <span className="size-6 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    {rule.id}
                  </span>
                  <div>
                    <h5 className="text-xs font-black text-gray-900 mb-1">{rule.title}</h5>
                    <p className="text-xs text-gray-600 leading-relaxed">{rule.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
              Chính sách Customer Penalty
            </button>
          </div>

          <div className="bg-gray-900 rounded-[40px] p-10 flex flex-col gap-8 text-white">
            <div className="flex items-center gap-3">
              <Megaphone className="size-5 text-orange-400" />
              <h4 className="font-black uppercase tracking-tight">Thao tác quản trị viên</h4>
            </div>
            <div className="space-y-4">
              {[
                {
                  label: 'Gửi cảnh báo hàng loạt',
                  sub: 'Áp dụng cho đối tượng vi phạm bom hàng',
                  icon: ShieldAlert,
                  color: 'text-orange-400',
                },
                {
                  label: 'Quét tài khoản ảo',
                  sub: 'Hệ thống AI nhận diện theo IP/SĐT',
                  icon: XCircle,
                  color: 'text-red-400',
                },
                {
                  label: 'Lịch sử mở khóa',
                  sub: 'Xem lại các trường hợp được ân xá',
                  icon: History,
                  color: 'text-blue-400',
                },
              ].map((action, i) => (
                <button
                  key={i}
                  className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-5 hover:bg-white/10 transition-all text-left"
                >
                  <div
                    className={`size-10 ${action.color} bg-white/10 rounded-2xl flex items-center justify-center`}
                  >
                    <action.icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black tracking-tight">{action.label}</p>
                    <p className="text-[10px] opacity-40 font-bold mt-1 uppercase tracking-widest">
                      {action.sub}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Buyer Detail Modal */}
      {(selectedBuyer || modalLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {modalLoading ? (
              <div className="p-16 text-center">
                <div className="inline-block size-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold text-gray-400">Đang tải thông tin...</p>
              </div>
            ) : (
              selectedBuyer && (
                <>
                  <button
                    onClick={closeModal}
                    className="absolute top-6 right-6 size-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors z-10"
                  >
                    <X className="size-5" />
                  </button>

                  {/* Header */}
                  <div className="p-10 border-b border-gray-100">
                    <div className="flex items-center gap-6">
                      <div className="size-20 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                        {selectedBuyer.lockedAt != null || selectedBuyer.status === 'INACTIVE' ? (
                          <Lock className="size-9 text-red-500" />
                        ) : (
                          <User className="size-10 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <span
                          className={`inline-block mb-2 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${
                            selectedBuyer.status === 'ACTIVE'
                              ? 'bg-green-50 text-green-600'
                              : selectedBuyer.status === 'INACTIVE'
                                ? 'bg-red-50 text-red-500'
                                : 'bg-orange-50 text-orange-600'
                          }`}
                        >
                          {selectedBuyer.status === 'ACTIVE'
                            ? 'Hoạt động'
                            : selectedBuyer.status === 'INACTIVE'
                              ? 'Đã khóa'
                              : 'Chờ duyệt'}
                        </span>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                          {selectedBuyer.fullName || selectedBuyer.username || 'N/A'}
                        </h3>
                        <p className="text-gray-400 font-bold text-xs mt-1 uppercase tracking-widest">
                          Người mua · ID: #{selectedBuyer.id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-10 space-y-6 max-h-[55vh] overflow-y-auto">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Mail className="size-3.5" /> Thông tin liên hệ
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            EMAIL
                          </p>
                          <p
                            className="font-bold text-gray-900 mt-1 text-sm truncate"
                            title={selectedBuyer.email}
                          >
                            {selectedBuyer.email || 'N/A'}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            SỐ ĐIỆN THOẠI
                          </p>
                          <p className="font-bold text-gray-900 mt-1 text-sm">
                            {selectedBuyer.phoneNumber || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mt-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          ĐỊA CHỈ
                        </p>
                        <p className="font-bold text-gray-900 mt-1 text-sm">
                          {selectedBuyer.address || 'Chưa cung cấp'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Calendar className="size-3.5" /> Thông tin tài khoản
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            NGÀY TẠO
                          </p>
                          <p className="font-bold text-gray-900 mt-1 text-sm">
                            {selectedBuyer.createdAt || selectedBuyer.createAt
                              ? new Date(
                                  selectedBuyer.createdAt || selectedBuyer.createAt!,
                                ).toLocaleDateString('vi-VN')
                              : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            VAI TRÒ
                          </p>
                          <p className="font-bold text-gray-900 mt-1 text-sm">
                            {selectedBuyer.role?.description || selectedBuyer.role?.name || 'BUYER'}
                          </p>
                        </div>
                      </div>
                      {selectedBuyer.lockedAt && (
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mt-3">
                          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                            THỜI GIAN BỊ KHÓA
                          </p>
                          <p className="font-bold text-red-700 mt-1 text-sm">
                            {new Date(selectedBuyer.lockedAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      )}

                      {/* Trạng thái giao nhận & vi phạm bom hàng */}
                      <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                            LỊCH SỬ BOM HÀNG (GIAO THẤT BẠI)
                          </span>
                          <span className="font-mono font-black text-sm text-amber-900">
                            {selectedBuyer.failedDeliveryCount ?? 0} lần
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-600 font-medium">Quyền thanh toán COD:</span>
                          <span
                            className={`font-bold px-2 py-0.5 rounded-md ${
                              selectedBuyer.codBlocked
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {selectedBuyer.codBlocked ? 'Đang bị khóa COD' : 'Bình thường'}
                          </span>
                        </div>
                        {(selectedBuyer.codBlocked || (selectedBuyer.failedDeliveryCount ?? 0) > 0) && (
                          <div className="pt-2 border-t border-amber-200 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleResetPenalties(selectedBuyer.id)}
                              disabled={resettingId === selectedBuyer.id}
                              className="px-3.5 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-600 hover:text-white rounded-xl text-xs font-black transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              {resettingId === selectedBuyer.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <RotateCcw size={12} />
                              )}
                              Mở lại COD & Xóa vi phạm
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button
                      onClick={closeModal}
                      className="px-6 py-3 bg-white border border-gray-200 text-gray-700 text-xs font-black rounded-2xl uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                      Đóng lại
                    </button>
                    {selectedBuyer.lockedAt != null || selectedBuyer.status === 'INACTIVE' ? (
                      <button
                        onClick={() => {
                          handleUnblock(selectedBuyer.id)
                          closeModal()
                        }}
                        className="px-8 py-3 bg-blue-600 text-white text-xs font-black rounded-2xl uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                      >
                        Mở khóa
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleBlock(selectedBuyer.id)
                          closeModal()
                        }}
                        className="px-8 py-3 bg-red-500 text-white text-xs font-black rounded-2xl uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                      >
                        Khóa tài khoản
                      </button>
                    )}
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BadBuyers

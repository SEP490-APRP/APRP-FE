import React, { useState, useMemo } from 'react'
import {
  UserX,
  ShieldAlert,
  Zap,
  AlertCircle,
  Lock,
  Unlock,
  Download,
  Loader2,
  X,
  Eye,
  Mail,
  Calendar,
  User,
  RotateCcw,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Ban,
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
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'WARNING' | 'COD_BLOCKED' | 'LOCKED'>('ALL')
  const [isRulesExpanded, setIsRulesExpanded] = useState(false)

  const buyersQuery = useUsersByRole(BUYER_ROLES, null, page, PAGE_SIZE)
  const fetchUser = useFetchUser()
  const setActive = useSetUserActive()

  const buyers = buyersQuery.data?.content ?? []
  const pageInfo: PageInfo | null = buyersQuery.data ?? null
  const loading = buyersQuery.isPending
  const error = buyersQuery.isError ? 'Không thể tải danh sách người mua.' : null
  const processing = setActive.isPending ? setActive.variables.userId : null

  // Lọc tìm kiếm và phân loại rủi ro
  const filteredBuyers = useMemo(() => {
    return buyers.filter((user) => {
      const term = searchTerm.toLowerCase().trim()
      if (term) {
        const matchName = (user.fullName || user.username || '').toLowerCase().includes(term)
        const matchEmail = (user.email || '').toLowerCase().includes(term)
        const matchPhone = (user.phoneNumber || '').toLowerCase().includes(term)
        const matchId = String(user.id).includes(term)
        if (!matchName && !matchEmail && !matchPhone && !matchId) return false
      }
      if (riskFilter === 'WARNING') {
        const count = user.failedDeliveryCount ?? 0
        return count >= 1 && count <= 2 && user.status !== 'INACTIVE' && !user.lockedAt
      }
      if (riskFilter === 'COD_BLOCKED') {
        return user.codBlocked || (user.failedDeliveryCount ?? 0) >= 3
      }
      if (riskFilter === 'LOCKED') {
        return user.lockedAt != null || user.status === 'INACTIVE'
      }
      return true
    })
  }, [buyers, searchTerm, riskFilter])

  const handleBlock = async (userId: number) => {
    if (!(await globalShowConfirm('Xác nhận khóa', 'Bạn có chắc chắn muốn khóa tài khoản người mua này?'))) return
    try {
      await setActive.mutateAsync({ userId, active: false })
      globalShowAlert('Đã khóa tài khoản thành công', 'Thành công', 'success')
      void buyersQuery.refetch()
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
      globalShowAlert('Đã mở khóa tài khoản thành công', 'Thành công', 'success')
      void buyersQuery.refetch()
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
            className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group"
          >
            <div
              className={`size-14 ${stat.bg} ${stat.color} rounded-[22px] flex items-center justify-center transition-transform group-hover:scale-110 shrink-0`}
            >
              <stat.icon className="size-7" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 line-clamp-2">
                {stat.label}
              </p>
              <h3 className="text-3xl font-black text-gray-900 font-display">{stat.value}</h3>
              <p className={`text-[10px] font-bold mt-1 ${stat.color} opacity-80`}>{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-sm">
          <AlertCircle className="size-5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Buyers Table - Chiều cao tự co giãn h-fit để tránh khoảng trắng thừa */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden h-fit">
          {/* Header & Bộ lọc nhanh */}
          <div className="px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-black text-gray-800 uppercase tracking-tight text-base">
                DANH SÁCH NGƯỜI MUA ({filteredBuyers.length})
              </h4>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Kiểm soát bom hàng, tước quyền COD và khóa tài khoản vi phạm
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Tìm kiếm nhanh */}
              <div className="relative min-w-[220px]">
                <Search className="size-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm tên, email, SĐT..."
                  className="w-full pl-9 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Lọc theo mức độ rủi ro */}
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as any)}
                className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-gray-100 transition-colors"
              >
                <option value="ALL">Tất cả mức độ</option>
                <option value="WARNING">Cảnh báo (1-2 lần)</option>
                <option value="COD_BLOCKED">Tước COD (≥3 lần)</option>
                <option value="LOCKED">Đã tạm khóa</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/60 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">
                    Mức độ vi phạm
                  </th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">
                    Quyền COD
                  </th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">
                    Trạng thái
                  </th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">
                    Thao tác
                  </th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBuyers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-gray-400 font-bold text-sm">
                      {searchTerm || riskFilter !== 'ALL'
                        ? 'Không tìm thấy người mua phù hợp với bộ lọc.'
                        : 'Không có người mua nào.'}
                    </td>
                  </tr>
                ) : (
                  filteredBuyers.map((user) => {
                    const isBlocked = user.lockedAt != null || user.status === 'INACTIVE'
                    const failCount = user.failedDeliveryCount ?? 0
                    const isCodStripped = Boolean(user.codBlocked || failCount >= 3)

                    // Phân loại badge mức độ rủi ro / vi phạm
                    let riskBadge = {
                      text: `${failCount}/5 lần`,
                      className: 'bg-gray-100 text-gray-600 border border-gray-200',
                      sub: 'Bình thường',
                    }
                    if (failCount >= 5 || isBlocked) {
                      riskBadge = {
                        text: `${failCount}/5 - Khóa 7 ngày`,
                        className: 'bg-red-50 text-red-700 border border-red-200',
                        sub: 'Mức 3: Tạm khóa',
                      }
                    } else if (failCount >= 3 || isCodStripped) {
                      riskBadge = {
                        text: `${failCount}/5 - Tước COD`,
                        className: 'bg-orange-50 text-orange-800 border border-orange-200',
                        sub: 'Mức 2: Tước COD',
                      }
                    } else if (failCount >= 1) {
                      riskBadge = {
                        text: `${failCount}/5 - Cảnh báo`,
                        className: 'bg-amber-50 text-amber-800 border border-amber-200',
                        sub: 'Mức 1: Nhắc nhở',
                      }
                    }

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-gray-50/50 transition-colors ${isBlocked ? 'bg-red-50/20' : ''}`}
                      >
                        {/* Người dùng: Avatar + Tên + Email (chữ thường) */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="size-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0">
                              {isBlocked ? (
                                <Lock className="size-4 text-red-500" />
                              ) : (
                                <User className="size-4 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p
                                className={`text-xs font-black truncate max-w-[180px] ${
                                  isBlocked ? 'text-red-700' : 'text-gray-900'
                                }`}
                                title={user.fullName || user.username || 'N/A'}
                              >
                                {user.fullName || user.username || 'N/A'}
                              </p>
                              {/* Email chữ thường chuẩn, tránh uppercase */}
                              <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-gray-400 mt-0.5">
                                <span className="font-mono text-gray-400 font-bold">ID: #{user.id}</span>
                                {user.email && (
                                  <>
                                    <span>•</span>
                                    <span
                                      className="lowercase font-medium text-gray-500 truncate max-w-[160px]"
                                      title={user.email}
                                    >
                                      {user.email}
                                    </span>
                                  </>
                                )}
                              </div>
                              {user.lockedAt && (
                                <p className="text-[10px] text-red-500 font-bold mt-0.5">
                                  Khóa: {new Date(user.lockedAt).toLocaleDateString('vi-VN')}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Mức độ vi phạm (Badge trực quan theo 3 mốc) */}
                        <td className="px-4 py-4 text-center">
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-black whitespace-nowrap ${riskBadge.className}`}
                            >
                              {riskBadge.text}
                            </span>
                            <span className="text-[9px] font-medium text-gray-400">
                              {riskBadge.sub}
                            </span>
                          </div>
                        </td>

                        {/* Quyền COD (Bật / Tắt đối chiếu trực tiếp quy tắc) */}
                        <td className="px-4 py-4 text-center">
                          {isCodStripped ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                              <Ban className="size-3 text-rose-500" />
                              Bị tước
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                              <CheckCircle2 className="size-3 text-emerald-600" />
                              Được phép
                            </span>
                          )}
                        </td>

                        {/* Trạng thái tài khoản */}
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black whitespace-nowrap ${
                              isBlocked
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}
                          >
                            {isBlocked ? 'Đã tạm khóa' : 'Hoạt động'}
                          </span>
                        </td>

                        {/* Thao tác Chặn / Mở khóa dạng Outline Button chuyên nghiệp */}
                        <td className="px-4 py-4 text-center">
                          {isBlocked ? (
                            <button
                              onClick={() => handleUnblock(user.id)}
                              disabled={processing === user.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 text-[11px] font-black rounded-xl transition-all disabled:opacity-50 shadow-2xs"
                            >
                              <Unlock className="size-3.5" />
                              Mở khóa
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlock(user.id)}
                              disabled={processing === user.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-[11px] font-black rounded-xl transition-all disabled:opacity-50 shadow-2xs"
                            >
                              <Lock className="size-3.5" />
                              Chặn
                            </button>
                          )}
                        </td>

                        {/* Chi tiết */}
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleViewProfile(user.id)}
                            className="size-8 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors mx-auto"
                            title="Xem chi tiết người mua"
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
          </div>

          <div className="p-6 bg-white border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">
              Hiển thị {filteredBuyers.length} trên tổng số {buyers.length} người mua
            </p>
          </div>
          {pageInfo && <Pagination pageInfo={pageInfo} onPageChange={setPage} className="px-6 pb-6" />}
        </div>

        {/* Sidebar - Quy tắc tự động khóa (Gọn gàng) & Công cụ kiểm soát nhanh */}
        <div className="flex flex-col gap-6">
          {/* Khối Quy tắc tự động khóa - Thiết kế tóm tắt gọn gàng, có nút xem chi tiết */}
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                  <Zap className="size-4" />
                </div>
                <div>
                  <h4 className="font-black text-gray-800 uppercase tracking-tight text-sm">
                    Quy tắc tự động khóa
                  </h4>
                  <p className="text-[11px] text-gray-400 font-medium">Cơ chế xử phạt theo lượt bom hàng</p>
                </div>
              </div>
              <button
                onClick={() => setIsRulesExpanded(!isRulesExpanded)}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                title={isRulesExpanded ? 'Thu gọn' : 'Xem chi tiết'}
              >
                {isRulesExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
            </div>

            {/* 3 mốc tóm tắt trực quan (luôn hiển thị nhỏ gọn) */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-2xl text-center">
                <span className="text-[10px] font-black text-amber-800 block">1–2 LẦN</span>
                <span className="text-[11px] font-bold text-amber-900 mt-0.5 block">Nhắc nhở</span>
              </div>
              <div className="p-3 bg-orange-50/60 border border-orange-100 rounded-2xl text-center">
                <span className="text-[10px] font-black text-orange-800 block">3 LẦN</span>
                <span className="text-[11px] font-bold text-orange-900 mt-0.5 block">Tước COD</span>
              </div>
              <div className="p-3 bg-red-50/60 border border-red-100 rounded-2xl text-center">
                <span className="text-[10px] font-black text-red-700 block">5 LẦN</span>
                <span className="text-[11px] font-bold text-red-800 mt-0.5 block">Khóa 7 ngày</span>
              </div>
            </div>

            {/* Nội dung chi tiết - Mở rộng khi admin bấm xem */}
            {isRulesExpanded && (
              <div className="space-y-4 pt-3 border-t border-gray-100 animate-in fade-in duration-200">
                {[
                  {
                    id: 1,
                    title: 'Cảnh báo nhắc nhở (Lỗi chủ quan 1 – 2 lần)',
                    text: 'Khi khách có 1 hoặc 2 đơn giao thất bại do lỗi chủ quan (không liên lạc được, từ chối nhận), hệ thống tự động gửi thông báo nhắc nhở.',
                    color: 'text-amber-600 bg-amber-50',
                  },
                  {
                    id: 2,
                    title: 'Tước quyền COD (Giao thất bại 3 lần)',
                    text: 'Khách bị giao hàng thất bại 3 lần do lỗi chủ quan sẽ bị cảnh báo tài khoản và tước quyền thanh toán COD (chỉ cho phép thanh toán online qua PayOS).',
                    color: 'text-orange-600 bg-orange-50',
                  },
                  {
                    id: 3,
                    title: 'Tự động tạm khóa 7 ngày (Bom hàng 5 lần)',
                    text: 'Khách bom hàng đủ 5 lần sẽ bị hệ thống tự động tạm khóa tài khoản trong 7 ngày. Hết hạn 7 ngày hệ thống sẽ tự động mở khóa.',
                    color: 'text-red-600 bg-red-50',
                  },
                ].map((rule) => (
                  <div key={rule.id} className="flex gap-3">
                    <span
                      className={`size-5 ${rule.color} rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5`}
                    >
                      {rule.id}
                    </span>
                    <div>
                      <h5 className="text-xs font-black text-gray-900 mb-0.5">{rule.title}</h5>
                      <p className="text-[11px] text-gray-600 leading-relaxed">{rule.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setIsRulesExpanded(!isRulesExpanded)}
              className="w-full py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
            >
              Chính sách xử phạt người mua
              {isRulesExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
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

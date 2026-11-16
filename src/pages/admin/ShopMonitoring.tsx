import React, { useState } from 'react'
import {
  AlertTriangle,
  Search,
  Filter,
  Bell,
  Star,
  Loader2,
  AlertCircle,
  X,
  Eye,
  Mail,
  Store,
  FolderOpen,
  ExternalLink,
  Flag,
  CheckCircle2,
} from 'lucide-react'
import type { UserResponse, ShopRiskFlagResponse } from '@/services'
import { userService } from '@/services'
import { useFetchUser, useSetUserActive, useUsersByRole } from '@/features/user'
import Pagination, { PageInfo } from '@/components/ui/Pagination'
import { globalShowAlert, globalShowConfirm } from '@/components/common/Popup'
import { getErrorMessage } from '@/utils'

const PAGE_SIZE = 10

const SHOP_ROLES = ['SHOP']

const ShopMonitoring: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [selectedShop, setSelectedShop] = useState<UserResponse | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [riskFlags, setRiskFlags] = useState<ShopRiskFlagResponse[]>([])
  const [loadingFlags, setLoadingFlags] = useState(false)
  const [resolvingFlagId, setResolvingFlagId] = useState<number | null>(null)

  const shopsQuery = useUsersByRole(SHOP_ROLES, null, page, PAGE_SIZE)
  const fetchUser = useFetchUser()
  const setActive = useSetUserActive()

  const shops = shopsQuery.data?.content ?? []
  const pageInfo: PageInfo | null = shopsQuery.data ?? null
  const loading = shopsQuery.isPending
  const error = shopsQuery.isError ? 'Không thể tải danh sách cửa hàng.' : null

  const handleViewProfile = async (userId: number) => {
    setModalLoading(true)
    setSelectedShop(null)
    setRiskFlags([])
    try {
      const user = await fetchUser(userId)
      setSelectedShop(user)
      try {
        setLoadingFlags(true)
        const flagsRes = await userService.getShopRiskFlags(userId)
        setRiskFlags(flagsRes.result || [])
      } catch (flagErr) {
        console.error('Failed to load shop risk flags', flagErr)
      } finally {
        setLoadingFlags(false)
      }
    } catch {
      globalShowAlert('Không thể tải thông tin cửa hàng. Vui lòng thử lại.', 'Lỗi', 'error')
    } finally {
      setModalLoading(false)
    }
  }

  const handleResolveFlag = async (flagId: number) => {
    if (!selectedShop) return
    const confirmed = await globalShowConfirm(
      'Gỡ cờ vi phạm chất lượng',
      'Bạn có chắc muốn gỡ cờ vi phạm này cho Shop? Nếu số cờ hiệu lực giảm xuống dưới 3, hệ thống sẽ tự động khôi phục 1 sao đánh giá cho gian hàng.'
    )
    if (!confirmed) return

    setResolvingFlagId(flagId)
    try {
      await userService.resolveRiskFlag(flagId, 'Admin xác nhận miễn trừ / giải quyết thỏa đáng')
      globalShowAlert('Đã gỡ cờ rủi ro thành công! Điểm đánh giá của shop đã được cập nhật.', 'Thành công', 'success')
      const flagsRes = await userService.getShopRiskFlags(selectedShop.id)
      setRiskFlags(flagsRes.result || [])
      const updatedShop = await fetchUser(selectedShop.id)
      setSelectedShop(updatedShop)
      void shopsQuery.refetch()
    } catch (err) {
      globalShowAlert(getErrorMessage(err, 'Không thể gỡ cờ rủi ro'), 'Lỗi', 'error')
    } finally {
      setResolvingFlagId(null)
    }
  }

  const closeModal = () => {
    setSelectedShop(null)
    setRiskFlags([])
    setModalLoading(false)
  }

  const handleDeactivate = async (userId: number) => {
    if (!(await globalShowConfirm('Xác nhận', 'Bạn có chắc muốn khóa tạm thời cửa hàng này?')))
      return
    try {
      await setActive.mutateAsync({ userId, active: false })
    } catch (err) {
      globalShowAlert(getErrorMessage(err, 'Không thể khóa cửa hàng'), 'Lỗi', 'error')
    }
  }

  const handleActivate = async (userId: number) => {
    try {
      await setActive.mutateAsync({ userId, active: true })
    } catch (err) {
      globalShowAlert(getErrorMessage(err, 'Không thể mở khóa cửa hàng'), 'Lỗi', 'error')
    }
  }

  const filteredShops = shops.filter((s) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (s.shopName || '').toLowerCase().includes(term) ||
      (s.fullName || '').toLowerCase().includes(term) ||
      (s.email || '').toLowerCase().includes(term)
    )
  })

  const inactiveShops = shops.filter((s) => s.status === 'INACTIVE')

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <Loader2 className="size-10 text-primary animate-spin" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
          Đang tải danh sách cửa hàng...
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-8 animate-in fade-in duration-500">
      {/* Warning cards for inactive shops */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {inactiveShops.length > 0 ? (
          inactiveShops.slice(0, 2).map((shop, i) => (
            <div
              key={shop.id}
              className={`${i === 0 ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'} border rounded-[40px] p-10 flex flex-col justify-between group overflow-hidden relative`}
            >
              <div className="flex items-start gap-4 relative z-10">
                <div
                  className={`size-12 ${i === 0 ? 'bg-red-500' : 'bg-orange-500'} text-white rounded-2xl flex items-center justify-center shadow-lg`}
                >
                  {i === 0 ? <AlertTriangle className="size-6" /> : <Bell className="size-6" />}
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-xl font-black ${i === 0 ? 'text-red-900' : 'text-orange-900'} leading-tight`}
                  >
                    {i === 0 ? 'CẢNH BÁO: SHOP BỊ KHÓA' : 'ĐANG THEO DÕI CHẶT CHẼ'}
                  </h3>
                </div>
              </div>
              <div className="mt-8 bg-white/50 backdrop-blur rounded-[32px] border border-gray-100 p-8 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-black text-gray-900">
                    {shop.shopName || shop.fullName || 'Shop N/A'}
                  </h4>
                  <span
                    className={`text-[10px] font-black text-gray-400 font-bold uppercase tracking-widest`}
                  >
                    {shop.status === 'ACTIVE'
                      ? 'Hoạt động'
                      : shop.status === 'INACTIVE'
                        ? 'Tạm ngưng'
                        : shop.status === 'PENDING'
                          ? 'Chờ duyệt'
                          : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Email: {shop.email}
                  </span>
                  <button
                    onClick={() => handleActivate(shop.id)}
                    className="px-4 py-2 bg-blue-50 text-blue-600 text-[10px] font-black rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    Mở khóa
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 bg-green-50 border border-green-100 rounded-[40px] p-10 text-center">
            <p className="text-green-700 font-bold">
              ✅ Tất cả cửa hàng đang hoạt động bình thường
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-sm">
          <AlertCircle className="size-5" /> {error}
        </div>
      )}

      {/* Shop Table */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-10 py-8 border-b border-gray-50 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Filter className="size-5 text-gray-400" />
            <h4 className="font-black text-gray-800 uppercase tracking-tight">
              Danh sách cửa hàng ({filteredShops.length})
            </h4>
          </div>
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên shop, chủ shop..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-300" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-10 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Cửa hàng
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Chủ shop
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                  Email
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                  Trạng thái
                </th>
                <th className="px-10 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                  Hành động
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                  Chi tiết
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredShops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-10 text-center text-gray-400 font-bold">
                    Không tìm thấy cửa hàng nào.
                  </td>
                </tr>
              ) : (
                filteredShops.map((shop, i) => (
                  <tr key={shop.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-gray-50 rounded-2xl flex items-center justify-center text-primary">
                          <Store className="size-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-gray-900">
                              {shop.shopName || 'Shop N/A'}
                            </p>
                            {typeof shop.activeRiskFlags === 'number' && shop.activeRiskFlags > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                                <Flag size={10} className="fill-rose-600 text-rose-600" />
                                {shop.activeRiskFlags} cờ vi phạm
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            ID: {shop.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={shop.logoUrl || `https://picsum.photos/seed/o${i}/60/60`}
                          className="size-8 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-gray-700">
                          {shop.fullName || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center text-xs font-bold text-gray-600">
                      {shop.email || 'N/A'}
                    </td>
                    <td className="px-6 py-6 text-center">
                      {/* Thêm whitespace-nowrap để chặn xuống dòng, w-max để thẻ co giãn theo chữ */}
                      <span
                        className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider whitespace-nowrap min-w-[100px] ${
                          shop.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : shop.status === 'INACTIVE'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-orange-100 text-orange-600'
                        }`}
                      >
                        {/* Thêm dấu chấm tròn nhỏ cho chuẩn giao diện Monitoring */}
                        <span
                          className={`size-1.5 rounded-full mr-2 ${
                            shop.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        ></span>

                        {shop.status === 'ACTIVE'
                          ? 'Hoạt động'
                          : shop.status === 'INACTIVE'
                            ? 'Tạm ngưng'
                            : shop.status === 'PENDING'
                              ? 'Chờ duyệt'
                              : 'N/A'}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {shop.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleDeactivate(shop.id)}
                            className="px-6 py-2.5 bg-red-50 text-red-500 text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-red-100 transition-colors"
                          >
                            Khóa tạm thời
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(shop.id)}
                            className="px-6 py-2.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-blue-100 transition-colors"
                          >
                            Mở khóa
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <button
                        onClick={() => handleViewProfile(shop.id)}
                        className="size-9 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors mx-auto"
                        title="Xem chi tiết"
                      >
                        <Eye className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-10 bg-white border-t border-gray-50 flex items-center justify-between">
          <p className="text-[10px] text-gray-400 font-bold italic">
            * Hiển thị {filteredShops.length} cửa hàng.
          </p>
        </div>
        {pageInfo && (
          <Pagination
            pageInfo={pageInfo}
            onPageChange={(p) => {
              setPage(p)
            }}
            className="px-10"
          />
        )}
      </div>

      {/* Shop Detail Modal */}
      {(selectedShop || modalLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {modalLoading ? (
              <div className="p-16 text-center">
                <div className="inline-block size-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold text-gray-400">Đang tải thông tin...</p>
              </div>
            ) : (
              selectedShop && (
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
                      {selectedShop.logoUrl ? (
                        <img
                          src={selectedShop.logoUrl}
                          className="size-20 rounded-3xl object-cover shadow-md bg-gray-50 flex-shrink-0"
                          alt="Logo"
                        />
                      ) : (
                        <div className="size-20 rounded-3xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                          <Store className="size-10" />
                        </div>
                      )}
                      <div>
                        <span
                          className={`inline-block mb-2 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${
                            selectedShop.status === 'ACTIVE'
                              ? 'bg-green-50 text-green-600'
                              : selectedShop.status === 'INACTIVE'
                                ? 'bg-red-50 text-red-500'
                                : 'bg-orange-50 text-orange-600'
                          }`}
                        >
                          {selectedShop.status === 'ACTIVE'
                            ? 'Hoạt động'
                            : selectedShop.status === 'INACTIVE'
                              ? 'Tạm ngưng'
                              : 'Chờ duyệt'}
                        </span>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                          {selectedShop.shopName || selectedShop.fullName || 'N/A'}
                        </h3>
                        <p className="text-gray-400 font-bold text-xs mt-1 uppercase tracking-widest">
                          {selectedShop.role?.name === 'FARMER' ? 'Nông dân' : 'Chủ cửa hàng'} · ID:
                          #{selectedShop.id}
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
                            CHỦ SHOP
                          </p>
                          <p className="font-bold text-gray-900 mt-1 text-sm">
                            {selectedShop.fullName || 'N/A'}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            SỐ ĐIỆN THOẠI
                          </p>
                          <p className="font-bold text-gray-900 mt-1 text-sm">
                            {selectedShop.phoneNumber || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mt-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          EMAIL
                        </p>
                        <p
                          className="font-bold text-gray-900 mt-1 text-sm truncate"
                          title={selectedShop.email}
                        >
                          {selectedShop.email || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mt-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          ĐỊA CHỈ
                        </p>
                        <p className="font-bold text-gray-900 mt-1 text-sm">
                          {selectedShop.address || 'Chưa cung cấp'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Store className="size-3.5" /> Thông tin cửa hàng
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            ĐÁNH GIÁ TB
                          </p>
                          <p className="font-bold text-gray-900 mt-1 text-sm flex items-center gap-1">
                            <Star className="size-3.5 text-yellow-500 fill-yellow-500" />
                            {selectedShop.ratingAverage?.toFixed(1) ?? 'Chưa có'}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            TÀI KHOẢN NGÂN HÀNG
                          </p>
                          <p className="font-bold text-gray-900 mt-1 text-sm">
                            {selectedShop.bankAccount || 'Chưa cung cấp'}
                          </p>
                        </div>
                      </div>
                      {selectedShop.description && (
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mt-3">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            MÔ TẢ CỬA HÀNG
                          </p>
                          <p className="font-medium text-gray-700 mt-1 text-sm leading-relaxed">
                            {selectedShop.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Quản lý Cờ rủi ro chất lượng */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Flag className="size-3.5 text-rose-600" /> Cờ rủi ro chất lượng (
                          {riskFlags.filter((f) => f.isActive).length} cờ hiệu lực)
                        </h4>
                      </div>

                      {loadingFlags ? (
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                          <Loader2 size={16} className="animate-spin text-primary" /> Đang tải danh sách cờ...
                        </div>
                      ) : riskFlags.length === 0 ? (
                        <div className="p-3.5 bg-green-50/70 rounded-2xl border border-green-200 text-green-800 text-xs flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                          <span>Shop hiện không có cờ vi phạm chất lượng nào.</span>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {riskFlags.map((flag) => (
                            <div
                              key={flag.id}
                              className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                                flag.isActive
                                  ? 'bg-red-50/70 border-red-200'
                                  : 'bg-gray-50 border-gray-200 opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                      flag.isActive ? 'bg-red-200 text-red-900' : 'bg-gray-200 text-gray-700'
                                    }`}
                                  >
                                    <Flag size={10} className={flag.isActive ? 'fill-red-700 text-red-700' : ''} />
                                    {flag.isActive ? 'Đang hiệu lực' : 'Đã gỡ bỏ'}
                                  </span>
                                  <span className="font-mono text-xs font-bold text-gray-700">
                                    Mã #{flag.id}
                                  </span>
                                  {flag.orderId && (
                                    <span className="font-mono text-xs text-gray-500">
                                      (Đơn #{flag.orderId})
                                    </span>
                                  )}
                                </div>

                                {flag.isActive && (
                                  <button
                                    type="button"
                                    onClick={() => handleResolveFlag(flag.id)}
                                    disabled={resolvingFlagId === flag.id}
                                    className="px-3 py-1 bg-white border border-red-300 text-red-700 hover:bg-red-600 hover:text-white rounded-xl text-[11px] font-black transition-colors shadow-xs flex items-center gap-1 shrink-0 cursor-pointer"
                                  >
                                    {resolvingFlagId === flag.id ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <CheckCircle2 size={12} />
                                    )}
                                    Gỡ cờ
                                  </button>
                                )}
                              </div>

                              <p className="text-xs text-gray-800 font-medium">
                                <span className="text-gray-500 font-normal">Lý do vi phạm: </span>
                                {flag.reason}
                              </p>

                              <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-200/50">
                                <span>Gắn cờ lúc: {new Date(flag.createdAt).toLocaleString('vi-VN')}</span>
                                {flag.resolvedAt && (
                                  <span className="text-green-700 font-bold">
                                    Đã gỡ: {new Date(flag.resolvedAt).toLocaleString('vi-VN')}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedShop.achievement && (
                      <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <FolderOpen className="size-3.5" /> Giấy tờ / Chứng nhận
                        </h4>
                        <a
                          href={selectedShop.achievement}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <div className="h-36 w-full bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden relative group">
                            <img
                              src={selectedShop.achievement}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              alt="Giấy tờ"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white font-bold bg-black/50 px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
                                <ExternalLink className="size-3.5" /> Phóng to
                              </span>
                            </div>
                          </div>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button
                      onClick={closeModal}
                      className="px-6 py-3 bg-white border border-gray-200 text-gray-700 text-xs font-black rounded-2xl uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                      Đóng lại
                    </button>
                    {selectedShop.status === 'ACTIVE' ? (
                      <button
                        onClick={() => {
                          handleDeactivate(selectedShop.id)
                          closeModal()
                        }}
                        className="px-8 py-3 bg-red-500 text-white text-xs font-black rounded-2xl uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                      >
                        Khóa tạm thời
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleActivate(selectedShop.id)
                          closeModal()
                        }}
                        className="px-8 py-3 bg-blue-600 text-white text-xs font-black rounded-2xl uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                      >
                        Mở khóa
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

export default ShopMonitoring

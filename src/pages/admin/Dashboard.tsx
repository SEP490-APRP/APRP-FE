import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Store,
  ShoppingBag,
  Users,
  UserCheck,
  Lock,
  Loader2,
  AlertCircle,
  Download,
  FileText,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  PackageCheck,
  Clock,
  ArrowRight,
  User,
  Calendar,
} from 'lucide-react'
import { exportService } from '@/services/export.service'
import { getOrderStatusBadgeClass, getOrderStatusLabel, useAllOrders } from '@/features/order'
import { useAllProducts, usePendingProducts } from '@/features/product'
import { useAllUsers, useApproveKyc } from '@/features/user'

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const usersQuery = useAllUsers()
  const ordersQuery = useAllOrders()
  const productsQuery = useAllProducts()
  const pendingProductsQuery = usePendingProducts()
  const approve = useApproveKyc()

  // Chuẩn hóa: map role.name -> roleName nếu chưa có
  const users = useMemo(
    () => (usersQuery.data ?? []).map((u) => ({ ...u, roleName: u.roleName || u.role?.name })),
    [usersQuery.data],
  )
  const orders = ordersQuery.data ?? []
  const products = productsQuery.data ?? []
  const pendingProducts = pendingProductsQuery.data ?? []

  const loading = usersQuery.isPending || ordersQuery.isPending || productsQuery.isPending
  const error =
    usersQuery.isError || ordersQuery.isError || productsQuery.isError
      ? 'Không thể tải dữ liệu admin dashboard.'
      : null

  // Export state — default: last 30 days
  const defaultTo = new Date().toISOString().slice(0, 10)
  const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const [exportFrom, setExportFrom] = useState(defaultFrom)
  const [exportTo, setExportTo] = useState(defaultTo)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [pdfExportProgress, setPdfExportProgress] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleExportExcel = async () => {
    setExportingExcel(true)
    setExportError(null)
    try {
      await exportService.exportAdminTransactionsExcel({ from: exportFrom, to: exportTo })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xuất Excel thất bại'
      setExportError(msg)
    } finally {
      setExportingExcel(false)
    }
  }

  const handleExportPdf = async () => {
    setExportingPdf(true)
    setExportError(null)
    setPdfExportProgress(null)
    try {
      const count = await exportService.exportAllAdminDeliveryReceipts(
        { from: exportFrom, to: exportTo },
        (current, total) => setPdfExportProgress(`Đang tải ${current}/${total}`),
      )
      if (count === 0) {
        setExportError('Không có hóa đơn nào trong khoảng ngày đã chọn.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xuất PDF thất bại'
      setExportError(msg)
    } finally {
      setExportingPdf(false)
      setPdfExportProgress(null)
    }
  }

  const pendingKyc = users.filter((u) => u.status === 'PENDING' || u.kycStatus === 'PENDING')
  const shopOwners = users.filter((u) => u.roleName === 'SHOP' || u.role?.name === 'SHOP')
  const buyers = users.filter((u) => u.roleName === 'BUYER' || u.role?.name === 'BUYER')

  // Thống kê doanh thu & đơn hàng 7 ngày gần đây
  const weeklyStats = useMemo(() => {
    const days: { label: string; count: number; revenue: number; dateStr: string }[] = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
      const dayLabel = i === 0 ? 'Hôm nay' : dayNames[d.getDay()]

      const dayOrders = orders.filter((o) => {
        const orderDate = o.createdAt ? String(o.createdAt).slice(0, 10) : ''
        return orderDate === dateStr
      })
      const revenue = dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
      days.push({ label: dayLabel, count: dayOrders.length, revenue, dateStr })
    }
    const maxCount = Math.max(...days.map((d) => d.count), 1)
    const completedOrders = orders.filter(
      (o) => o.status === 'COMPLETED' || o.status === 'DELIVERED',
    ).length
    const completionRate = orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : 0
    const totalWeeklyRevenue = days.reduce((sum, d) => sum + d.revenue, 0)

    return { days, maxCount, completionRate, totalWeeklyRevenue }
  }, [orders])

  // Định dạng ngày giờ hiển thị
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '---'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} - ${hours}:${minutes}`
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <Loader2 className="size-10 text-primary animate-spin" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
          Đang tải admin dashboard...
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8 animate-in fade-in duration-300">
      {/* Top Header & Quick Export Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight font-display">
            Bảng tổng quan vận hành
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Theo dõi dữ liệu sàn, duyệt đối tác và giám sát vận hành thời gian thực
          </p>
        </div>

        {/* Thanh công cụ xuất báo cáo nhanh đặt ngay góc trên bên phải */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-xl border border-gray-200">
            <Calendar className="size-3.5 text-gray-400 shrink-0" />
            <input
              type="date"
              value={exportFrom}
              max={exportTo}
              onChange={(e) => setExportFrom(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer"
              title="Từ ngày"
            />
            <span className="text-xs text-gray-400 font-bold">-</span>
            <input
              type="date"
              value={exportTo}
              min={exportFrom}
              onChange={(e) => setExportTo(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer"
              title="Đến ngày"
            />
          </div>

          <button
            onClick={handleExportExcel}
            disabled={exportingExcel || exportingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xs"
            title="Xuất bảng kê giao dịch Excel"
          >
            {exportingExcel ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={exportingExcel || exportingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xs"
            title="Xuất phiếu giao hàng / hóa đơn PDF"
          >
            {exportingPdf ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileText className="size-3.5" />
            )}
            <span>{pdfExportProgress ?? 'Xuất hóa đơn'}</span>
          </button>
        </div>
      </div>

      {exportError && (
        <div className="bg-red-50 border border-red-100 p-3 rounded-2xl flex items-center gap-2 text-red-600 font-bold text-xs sm:text-sm animate-in fade-in">
          <AlertCircle className="size-4 shrink-0" /> {exportError}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-sm">
          <AlertCircle className="size-5" /> {error}
        </div>
      )}

      {/* 4 Thẻ KPI chính trên cùng - Đồng bộ số đếm & Icon chuẩn ngữ nghĩa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: 'CHỜ DUYỆT HỒ SƠ',
            value: pendingKyc.length.toString(),
            trend: `${users.length} tài khoản sàn`,
            icon: UserCheck,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            badgeBg: 'bg-amber-100/70',
            borderColor: 'border-amber-100',
          },
          {
            label: 'TỔNG CỬA HÀNG',
            value: shopOwners.length.toString(),
            trend: `${shopOwners.filter((s) => s.status === 'ACTIVE').length} đang hoạt động`,
            icon: Store,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            badgeBg: 'bg-emerald-100/70',
            borderColor: 'border-emerald-100',
          },
          {
            label: 'TỔNG ĐƠN HÀNG',
            value: orders.length.toString(),
            trend: `${products.length} sản phẩm trên sàn`,
            icon: ShoppingBag,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            badgeBg: 'bg-blue-100/70',
            borderColor: 'border-blue-100',
          },
          {
            label: 'TỔNG NGƯỜI MUA',
            value: buyers.length.toString(),
            trend: `${buyers.filter((b) => b.status === 'ACTIVE').length} đang hoạt động`,
            icon: Users,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            badgeBg: 'bg-purple-100/70',
            borderColor: 'border-purple-100',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-xs relative group transition-all hover:shadow-sm hover:-translate-y-0.5`}
          >
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
              {stat.label}
            </p>
            <h3 className="text-3xl font-black text-gray-900 font-display tracking-tight">
              {stat.value}
            </h3>
            <p className="text-[11px] font-semibold text-gray-500 mt-2 flex items-center gap-1">
              <span className={`inline-block size-1.5 rounded-full ${stat.color} bg-current`} />
              {stat.trend}
            </p>
            <div
              className={`absolute top-5 right-5 size-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center border ${stat.borderColor} shadow-2xs group-hover:scale-105 transition-transform`}
            >
              <stat.icon className="size-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Cột trái (KYC + Đơn hàng) | Cột phải (Giám sát Shop + Phân tích Dashboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái - 2 phần */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Hàng đợi KYC Nông dân */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="px-6 py-4 sm:px-8 sm:py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <UserCheck className="size-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 uppercase tracking-tight text-sm">
                    Hàng đợi duyệt hồ sơ (Nông dân)
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    {pendingKyc.length > 0
                      ? `Có ${pendingKyc.length} hồ sơ cần xét duyệt`
                      : 'Hồ sơ người dùng đều đã được xử lý'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/kyc')}
                className="text-xs font-bold text-primary hover:underline uppercase flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>

            {pendingKyc.length === 0 ? (
              <div className="py-8 px-6 text-center flex flex-col items-center justify-center gap-2">
                <div className="size-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                  <CheckCircle2 className="size-6" />
                </div>
                <p className="text-sm font-bold text-gray-700">Tất cả hồ sơ đã được xử lý</p>
                <p className="text-xs text-gray-400 max-w-sm">
                  Hiện không có yêu cầu nào đang chờ duyệt. Mọi hồ sơ nông dân gửi lên đều đã hoàn tất.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/70 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Nông dân
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Email
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pendingKyc.slice(0, 4).map((item, i) => (
                      <tr key={item.id || i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.logoUrl || `https://picsum.photos/seed/k${i}/80/80`}
                              alt={item.fullName || 'User'}
                              className="size-9 rounded-full object-cover border border-gray-200"
                            />
                            <span className="text-xs font-bold text-gray-900">
                              {item.fullName || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-600 font-medium">
                          {item.email || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-lg border border-amber-200/60">
                            Chờ duyệt
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              approve.mutate(
                                { userId: item.id, roleName: 'SHOP' },
                                { onError: (e) => console.error(e) },
                              )
                            }
                            className="px-4 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            Duyệt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Đơn hàng gần đây - Bổ sung Mã ID (#ORD-xxx), Khách hàng, Thời gian đặt */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="px-6 py-4 sm:px-8 sm:py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingBag className="size-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 uppercase tracking-tight text-sm">
                    Đơn hàng gần đây
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Cập nhật tiến độ các giao dịch mới nhất trên hệ thống
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/70 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Mã đơn
                    </th>
                    <th className="px-4 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Khách hàng
                    </th>
                    <th className="px-4 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Thời gian đặt
                    </th>
                    <th className="px-4 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                      Tổng tiền
                    </th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.slice(0, 5).map((order, i) => {
                    const rawId = (order as any).orderId || order.id || (order as any).orderCode
                    const orderCodeDisplay = rawId ? `#ORD-${String(rawId).padStart(3, '0')}` : `#${i + 1}`
                    const buyerNameDisplay =
                      (order as any).buyerName ||
                      (order as any).recipientName ||
                      (order as any).customerName ||
                      'Khách mua hàng'

                    return (
                      <tr key={(order as any).orderId || order.id || i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                            {orderCodeDisplay}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                              <User className="size-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-gray-800 truncate max-w-[140px]">
                              {buyerNameDisplay}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-500 font-medium whitespace-nowrap">
                          {formatDateTime((order as any).createdAt)}
                        </td>
                        <td className="px-4 py-4 text-right text-xs font-black text-gray-900 whitespace-nowrap">
                          {(order.totalAmount || 0).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getOrderStatusBadgeClass(order.status)}`}
                          >
                            {getOrderStatusLabel(order.status)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {orders.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-400 font-bold text-xs"
                      >
                        Chưa có đơn hàng nào được ghi nhận.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Cột phải - Tối ưu Empty State & Thay thế khối trùng lặp bằng Biểu đồ tuần / Nông sản cần duyệt */}
        <div className="flex flex-col gap-6">
          {/* Giám sát shop tín nhiệm thấp - Làm gọn Empty State */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 mb-4">
              <div className="size-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 uppercase tracking-tight text-sm">
                  Giám sát Cửa hàng (Tín nhiệm thấp)
                </h4>
                <p className="text-[11px] text-gray-400">Kiểm soát rủi ro vi phạm và hủy đơn</p>
              </div>
            </div>

            {shopOwners.filter((s) => s.status === 'INACTIVE').length === 0 ? (
              <div className="py-6 px-4 text-center flex flex-col items-center justify-center gap-2">
                <div className="size-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                  <ShieldCheck className="size-6" />
                </div>
                <p className="text-sm font-bold text-gray-700">Hệ thống vận hành an toàn</p>
                <p className="text-xs text-gray-400">
                  Tất cả các cửa hàng đều đạt chuẩn và duy trì uy tín tốt, không có trường hợp nào bị tạm khóa.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {shopOwners
                  .filter((s) => s.status === 'INACTIVE')
                  .slice(0, 3)
                  .map((shop, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200/70 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          {shop.shopName || shop.fullName || 'Shop N/A'}
                        </p>
                        <p className="text-[10px] text-red-500 font-bold mt-0.5 uppercase">
                          Tạm ngưng hoạt động
                        </p>
                      </div>
                      <div className="size-8 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                        <Lock className="size-4" />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Thay thế khối TỔNG QUAN HỆ THỐNG bị trùng lặp bằng: Biểu đồ doanh thu tuần & Thống kê giao dịch */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <TrendingUp className="size-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 uppercase tracking-tight text-sm">
                    Hiệu suất đơn hàng 7 ngày
                  </h4>
                  <p className="text-[11px] text-gray-400">Doanh thu và tần suất đặt hàng tuần qua</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                Tỷ lệ hoàn tất: {weeklyStats.completionRate}%
              </span>
            </div>

            {/* Doanh thu tuần tóm tắt */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-50/80 to-teal-50/40 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Tổng giá trị giao dịch 7 ngày
                </p>
                <p className="text-lg font-black text-emerald-700 mt-0.5">
                  {weeklyStats.totalWeeklyRevenue.toLocaleString('vi-VN')}đ
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-semibold">Tổng đơn</p>
                <p className="text-base font-black text-gray-800">{orders.length}</p>
              </div>
            </div>

            {/* Mini Bar Chart trực quan */}
            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                Phân bổ lượng đơn theo ngày
              </p>
              <div className="flex items-end justify-between gap-2 h-28 pt-4 pb-2 px-1 border-b border-gray-100">
                {weeklyStats.days.map((d, idx) => {
                  const heightPercent = Math.max((d.count / weeklyStats.maxCount) * 100, 10)
                  const isToday = idx === weeklyStats.days.length - 1

                  return (
                    <div
                      key={d.dateStr}
                      className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative"
                    >
                      {/* Tooltip khi hover */}
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10 font-bold">
                        {d.count} đơn ({d.revenue.toLocaleString('vi-VN')}đ)
                      </div>

                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[24px] rounded-t-lg transition-all group-hover:opacity-90 ${
                          isToday
                            ? 'bg-primary shadow-xs'
                            : d.count > 0
                              ? 'bg-primary/50'
                              : 'bg-gray-200/70'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-bold ${isToday ? 'text-primary font-black' : 'text-gray-400'}`}
                      >
                        {d.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Nông sản cần duyệt nhanh */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PackageCheck className="size-4 text-emerald-600" />
                  <span className="text-xs font-bold text-gray-700">Duyệt nông sản mới:</span>
                </div>
                {pendingProducts.length > 0 ? (
                  <Link
                    to="/admin/products"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors"
                  >
                    <span>{pendingProducts.length} chờ duyệt</span>
                    <ArrowRight className="size-3" />
                  </Link>
                ) : (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> Đã duyệt hết
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

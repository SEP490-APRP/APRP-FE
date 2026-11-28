import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Clock, Loader2, Navigation, Pencil, Phone, Plus, Power, Warehouse, X } from 'lucide-react'
import { AddressPicker, composeAddress, EMPTY_ADDRESS, parseAddress, type AddressValue } from '@/components/common/AddressPicker'
import { adminHubService, type DeliveryHub } from '@/services'
import { getErrorMessage } from '@/utils'
import Pagination from '@/components/ui/Pagination'
import HubGoodsDialog from './HubGoodsDialog'
import { useHubArrivalBadge } from '@/features/campaign/hooks/useHubArrivalBadge'

const KEY = ['admin-hubs'] as const
/** Số hub mỗi trang */
const PAGE_SIZE = 10

/**
 * Điểm trung chuyển (hub): xe CapNong chở thùng đã đóng gói từ điểm tập kết tới hub gần khu dân cư,
 * shipper tới hub lấy hàng và giao chặng cuối. Khi đưa đơn ra hub, hệ thống chọn hub gần người mua nhất.
 */
export default function AdminHubs() {
  const qc = useQueryClient()
  const { hubs } = useHubArrivalBadge()
  const [editing, setEditing] = useState<DeliveryHub | 'new' | null>(null)
  /** Hub đang mở xem hàng */
  const [viewing, setViewing] = useState<DeliveryHub | null>(null)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)

  const toggle = useMutation({
    mutationFn: (h: DeliveryHub) =>
      h.active
        ? adminHubService.deactivate(h.hubId)
        : adminHubService.update(h.hubId, {
            name: h.name,
            address: h.address,
            latitude: h.latitude,
            longitude: h.longitude,
            phone: h.phone ?? undefined,
            openHours: h.openHours ?? undefined,
            note: h.note ?? undefined,
            active: true,
          }),
    onSuccess: (h) => {
      setNotice({ ok: true, text: h.active ? `Đã mở lại hub ${h.name}.` : `Đã ngưng dùng hub ${h.name}. Đơn mới sẽ không được gán vào hub này.` })
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e) => setNotice({ ok: false, text: getErrorMessage(e, 'Không cập nhật được hub.') }),
  })

  const all = hubs.data ?? []
  const active = all.filter((h) => h.active)
  const [filter, setFilter] = useState<'all' | 'active' | 'off'>('all')
  const [page, setPage] = useState(0)
  // Hub có hàng mới chờ xác nhận lên đầu, để số đỏ không bị khuất ở trang sau
  const list = (filter === 'all' ? all : all.filter((h) => h.active === (filter === 'active')))
    .slice()
    .sort((a, b) => Number(!!b.unconfirmedOrders) - Number(!!a.unconfirmedOrders))
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const current = Math.min(page, totalPages - 1)
  const rows = list.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
  const pageInfo = { page: current, size: PAGE_SIZE, totalElements: list.length, totalPages, first: current === 0, last: current === totalPages - 1 }
  const filters = [
    { id: 'all', label: `Tất cả (${all.length})` },
    { id: 'active', label: `Đang hoạt động (${active.length})` },
    { id: 'off', label: `Đã ngưng (${all.length - active.length})` },
  ] as const
  const action = 'inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-bold disabled:opacity-50'

  // Cùng bố cục với tab Chiến dịch: tiêu đề, nút chính, lọc theo trạng thái, bảng
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black uppercase text-gray-900 sm:text-3xl">Điểm trung chuyển</h2>
          <p className="mt-1 text-sm font-medium text-gray-500">Nơi xe CapNong chở thùng tới để shipper lấy và giao tới người mua.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-2 rounded-xl bg-[#326318] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#254d12]"
        >
          <Plus size={16} /> Thêm hub
        </button>
      </div>

      {notice && (
        <div className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium ${notice.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
          {notice.text}
          <button type="button" aria-label="Đóng" onClick={() => setNotice(null)} className="rounded-full p-1 hover:bg-black/5"><X size={14} /></button>
        </div>
      )}

      {!hubs.isPending && !hubs.isError && active.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Chưa có hub nào đang hoạt động, đơn đưa ra hub sẽ chưa có chỗ để shipper tới lấy.
        </div>
      )}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lọc theo trạng thái">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => {
              setFilter(f.id)
              setPage(0)
            }}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${filter === f.id ? 'border-[#326318] bg-[#326318] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-[#9ed67d]'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {hubs.isPending ? (
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
      ) : hubs.isError ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{getErrorMessage(hubs.error, 'Không tải được danh sách hub.')}</div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          {all.length === 0 ? 'Chưa có hub nào. Thêm hub ở điểm gần khu dân cư.' : 'Không có hub nào trong mục này.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Hub</th>
                <th className="px-4 py-3">Liên hệ</th>
                <th className="px-4 py-3 text-right">Đơn chờ shipper</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((h) => (
                /* Bấm vào đâu trên hàng cũng mở hàng của hub, trừ cột nút thao tác */
                <tr key={h.hubId} onClick={() => setViewing(h)} className="cursor-pointer hover:bg-[#f7faf4]">
                  <td className="max-w-[420px] px-4 py-3">
                    <button type="button" title="Xem hàng ở hub này" className="flex w-full cursor-pointer items-center gap-3 text-left">
                      <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${h.active ? 'bg-[#eef6e7] text-[#326318]' : 'bg-gray-100 text-gray-400'}`}>
                        <Warehouse size={20} />
                        {!!h.unconfirmedOrders && (
                          <span aria-label={`${h.unconfirmedOrders} đơn chờ xác nhận`} className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-extrabold text-white ring-2 ring-white">
                            {h.unconfirmedOrders}
                          </span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1 font-bold text-gray-900">
                          <span className="truncate">{h.name}</span>
                          <ChevronRight size={15} className="shrink-0 text-[#326318]" />
                        </p>
                        <p className="truncate text-xs text-gray-500" title={h.address}>{h.address}</p>
                        {h.note && <p className="truncate text-xs italic text-gray-400" title={h.note}>{h.note}</p>}
                      </div>
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                    <p className="flex items-center gap-1.5 tabular-nums"><Phone size={12} /> {h.phone || '—'}</p>
                    <p className="mt-1 flex items-center gap-1.5"><Clock size={12} /> {h.openHours || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-gray-900">{h.waitingOrders}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold ${h.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                      {h.active ? 'Đang hoạt động' : 'Đã ngưng'}
                    </span>
                  </td>
                  <td className="cursor-default px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => setEditing(h)} className={`${action} border-gray-200 text-[#326318] hover:border-[#326318]`}>
                        <Pencil size={13} /> Sửa
                      </button>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${h.latitude},${h.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`${action} border-gray-200 text-gray-700 hover:border-[#326318]`}
                      >
                        <Navigation size={13} /> Bản đồ
                      </a>
                      <button
                        type="button"
                        disabled={toggle.isPending}
                        onClick={() => toggle.mutate(h)}
                        className={`${action} ${h.active ? 'border-red-200 text-red-700 hover:bg-red-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                      >
                        <Power size={13} /> {h.active ? 'Ngưng' : 'Mở lại'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!hubs.isPending && !hubs.isError && <Pagination pageInfo={pageInfo} onPageChange={setPage} />}

      {viewing && <HubGoodsDialog hub={viewing} onClose={() => setViewing(null)} />}

      {editing && (
        <HubDialog
          hub={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(h, created) => {
            setEditing(null)
            setNotice({ ok: true, text: created ? `Đã thêm hub ${h.name}.` : `Đã lưu hub ${h.name}.` })
            qc.invalidateQueries({ queryKey: KEY })
          }}
        />
      )}
    </div>
  )
}

function HubDialog({ hub, onClose, onSaved }: { hub: DeliveryHub | null; onClose: () => void; onSaved: (h: DeliveryHub, created: boolean) => void }) {
  const qc = useQueryClient()
  const [name, setName] = useState(hub?.name ?? '')
  const [address, setAddress] = useState<AddressValue>(
    hub ? { ...EMPTY_ADDRESS, detail: hub.address, lat: hub.latitude, lng: hub.longitude } : EMPTY_ADDRESS,
  )
  const [phone, setPhone] = useState(hub?.phone ?? '')
  const [openHours, setOpenHours] = useState(hub?.openHours ?? '6:00 – 20:00')
  const [note, setNote] = useState(hub?.note ?? '')
  const [tried, setTried] = useState(false)

  // Sửa hub: tách địa chỉ đã lưu về tỉnh / phường để ô chọn hiện đúng
  useEffect(() => {
    if (!hub) return
    parseAddress(qc, hub.address, { lat: hub.latitude, lng: hub.longitude }).then(setAddress).catch(() => undefined)
  }, [hub, qc])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const fullAddress = composeAddress(address)
  const errors = {
    name: !name.trim() ? 'Nhập tên hub' : null,
    address: !fullAddress.trim() ? 'Chọn địa chỉ hub' : null,
    pin: address.lat == null || address.lng == null ? 'Ghim vị trí hub trên bản đồ' : null,
  }
  const valid = Object.values(errors).every((e) => !e)

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        address: fullAddress,
        latitude: address.lat as number,
        longitude: address.lng as number,
        phone: phone.trim() || undefined,
        openHours: openHours.trim() || undefined,
        note: note.trim() || undefined,
      }
      return hub ? adminHubService.update(hub.hubId, body) : adminHubService.create(body)
    },
    onSuccess: (h) => onSaved(h, !hub),
  })

  const input = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-[#4a7c2f] focus:outline-none'

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/45 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-black text-gray-900">{hub ? `Sửa hub ${hub.name}` : 'Thêm điểm trung chuyển'}</h3>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100"><X size={18} /></button>
        </header>
        <form
          className="flex flex-col gap-4 overflow-y-auto px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault()
            setTried(true)
            if (valid) save.mutate()
          }}
        >
          <label className="text-xs font-bold text-gray-700">
            Tên hub
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={150} placeholder="Vd: Hub Thủ Đức" className={`mt-1.5 ${input}`} />
            {tried && errors.name && <span className="mt-1 block text-xs font-semibold text-red-600">{errors.name}</span>}
          </label>
          <div>
            <p className="mb-1.5 text-xs font-bold text-gray-700">Địa chỉ và vị trí trên bản đồ</p>
            <AddressPicker value={address} onChange={setAddress} required />
            {tried && (errors.address || errors.pin) && <p className="mt-1 text-xs font-semibold text-red-600">{errors.address ?? errors.pin}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-gray-700">
              Số điện thoại người trực
              <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className={`mt-1.5 ${input}`} />
            </label>
            <label className="text-xs font-bold text-gray-700">
              Giờ nhận / giao hàng
              <input value={openHours} onChange={(e) => setOpenHours(e.target.value)} placeholder="6:00 – 20:00" className={`mt-1.5 ${input}`} />
            </label>
          </div>
          <label className="text-xs font-bold text-gray-700">
            Ghi chú cho shipper (tuỳ chọn)
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} placeholder="Vd: vào cổng sau, gọi trước 10 phút" className={`mt-1.5 ${input}`} />
          </label>
          {save.isError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{getErrorMessage(save.error, 'Không lưu được hub.')}</p>}
          <button type="submit" disabled={save.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#326318] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
            {save.isPending && <Loader2 size={16} className="animate-spin" />} {hub ? 'Lưu thay đổi' : 'Thêm hub'}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}

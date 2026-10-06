import React, { useState } from 'react'
import { Plus, Search, Edit3, Gift } from 'lucide-react'
import type { FarmerProduct } from './types'

interface ProductsProps {
  products: FarmerProduct[]
  onOpenAddProduct: () => void
  onOpenBlindBoxTool: () => void
  onOpenComboBuilder: () => void
  onInfo?: (msg: string) => void
}

export default function Products({
  products,
  onOpenAddProduct,
  onOpenBlindBoxTool,
  onOpenComboBuilder,
  onInfo,
}: ProductsProps) {
  const [activeTab, setActiveTab] = useState<'NONG_SAN' | 'BLIND_BOX' | 'COMBO'>('NONG_SAN')
  const [search, setSearch] = useState('')

  const filtered = products.filter((p) => {
    if (activeTab === 'NONG_SAN' && p.category !== 'Nông sản') return false
    if (activeTab === 'BLIND_BOX' && p.category !== 'Hộp mù') return false
    if (activeTab === 'COMBO' && p.category !== 'Combo') return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f1f4ed]">
        <div>
          <h3 className="text-2xl font-black text-[#1c2216]">Kho Nông Sản &amp; Túi Mù Của Bạn</h3>
          <p className="text-xs text-[#7e8779]">
            Quản lý nông sản thu hoạch, tạo túi mù giải cứu và tùy chỉnh giá bán
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="tour-products-blindbox-btn"
            type="button"
            onClick={onOpenBlindBoxTool}
            className="px-4 py-2.5 rounded-full bg-[#fdf5eb] border border-[#f5ddbd] hover:bg-[#faeedd] text-[#8a4e1d] font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <Gift size={14} />
            <span>Tạo Túi Mù Blind Box</span>
          </button>

          <button
            id="tour-products-add-btn"
            type="button"
            onClick={onOpenAddProduct}
            className="px-5 py-2.5 rounded-full bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-xs uppercase shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>Đăng Bán Nông Sản Mới</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-3xl border border-[#e8ece3] shadow-sm overflow-hidden">
        <div
          id="tour-products-filter-bar"
          className="p-4 border-b border-[#f1f4ed] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div id="tour-products-tabs" className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('NONG_SAN')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                activeTab === 'NONG_SAN' ? 'bg-[#326318] text-white' : 'bg-[#f4f7f1] text-[#5b6454]'
              }`}
            >
              Nông Sản Tươi ({products.filter((p) => p.category === 'Nông sản').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('BLIND_BOX')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                activeTab === 'BLIND_BOX'
                  ? 'bg-[#8a4e1d] text-white'
                  : 'bg-[#f4f7f1] text-[#5b6454]'
              }`}
            >
              Túi Mù Blind Box ({products.filter((p) => p.category === 'Hộp mù').length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929a8c]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên nông sản..."
              className="w-full pl-9 pr-3 py-2 bg-[#f4f7f1] rounded-full text-xs text-[#1e2319] outline-none"
            />
          </div>
        </div>

        {/* Product Items List */}
        <div className="divide-y divide-[#f1f4ed]">
          {filtered.length > 0 ? (
            filtered.map((p, idx) => (
              <div
                key={p.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#fafcf9] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-[#e4ebd9]"
                  />
                  <div>
                    <h4 className="text-sm font-black text-[#1c2216]">{p.name}</h4>
                    <span className="text-xs text-[#7e8779]">
                      Khu vực: {p.region} · Tồn kho: {p.stock} {p.unit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-black text-[#326318]">
                      {p.price.toLocaleString('vi-VN')}đ / {p.unit}
                    </div>
                    <span className="text-[10px] text-[#326318] font-bold">🟢 {p.status}</span>
                  </div>

                  <div
                    id={idx === 0 ? 'tour-products-action-btns' : undefined}
                    className="flex items-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => onInfo?.(`Chỉnh sửa sản phẩm: ${p.name}`)}
                      className="p-2 rounded-xl hover:bg-[#f0f4ec] text-[#616a5b] hover:text-[#326318] cursor-pointer"
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-[#7e8779]">
              Chưa có sản phẩm nào trong danh mục này. Bấm nút đăng bán để thêm mới.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

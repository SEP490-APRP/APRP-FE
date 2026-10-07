import React, { useState, type FormEvent } from 'react'
import { ChefHat, X } from 'lucide-react'
import type { FarmerProduct } from './types'

interface ComboBuilderProps {
  onAddCombo: (combo: FarmerProduct) => void
  onClose: () => void
  onInfo?: (msg: string) => void
}

export default function ComboBuilder({ onAddCombo, onClose, onInfo }: ComboBuilderProps) {
  const [comboName, setComboName] = useState('')
  const [comboPrice, setComboPrice] = useState('149000')
  const [comboWeight, setComboWeight] = useState('4.5kg')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!comboName.trim()) return

    const newCombo: FarmerProduct = {
      id: Date.now().toString(),
      name: comboName.trim(),
      category: 'Combo',
      price: Number(comboPrice) || 149000,
      originalPrice: 220000,
      discount: '-32%',
      status: 'Đang bán',
      stock: 20,
      unit: 'combo',
      region: 'Đà Lạt',
      image:
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80',
    }

    onAddCombo(newCombo)
    onClose()
    onInfo?.(`Đã tạo combo mới: ${newCombo.name}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#e2dcce] relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#326318]/10 text-[#326318] flex items-center justify-center">
            <ChefHat size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#1c2216]">Tạo Combo Nông Sản</h3>
            <p className="text-xs text-[#7e8779]">
              Ghép nhiều loại rau củ thành set món ăn tiện lợi
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#353d2f] mb-1">
              Tên combo món ăn *
            </label>
            <input
              type="text"
              required
              value={comboName}
              onChange={(e) => setComboName(e.target.value)}
              placeholder="VD: Combo Lẩu Nấm & Rau Vườn Cuối Tuần"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f7f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-[#353d2f] mb-1">
                Giá bán combo (đ) *
              </label>
              <input
                type="number"
                required
                value={comboPrice}
                onChange={(e) => setComboPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f7f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#353d2f] mb-1">
                Trọng lượng tổng
              </label>
              <input
                type="text"
                value={comboWeight}
                onChange={(e) => setComboWeight(e.target.value)}
                placeholder="4.5kg"
                className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f7f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#326318] hover:bg-[#254b12] text-white font-black text-xs uppercase tracking-wider transition-all shadow-md mt-4 cursor-pointer"
          >
            Đăng Bán Combo
          </button>
        </form>
      </div>
    </div>
  )
}

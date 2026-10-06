import React, { useState, type FormEvent } from 'react'
import { Gift, X } from 'lucide-react'
import type { FarmerProduct } from './types'

interface BlindBoxToolProps {
  onAddBox: (box: FarmerProduct) => void
  onClose: () => void
  onInfo?: (msg: string) => void
}

export default function BlindBoxTool({ onAddBox, onClose, onInfo }: BlindBoxToolProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('79000')
  const [originalPrice, setOriginalPrice] = useState('150000')
  const [weight, setWeight] = useState('5kg')
  const [stock, setStock] = useState('30')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const newBox: FarmerProduct = {
      id: Date.now().toString(),
      name: name.trim(),
      category: 'Hộp mù',
      price: Number(price) || 79000,
      originalPrice: Number(originalPrice) || 150000,
      discount: '-47%',
      status: 'Đang bán',
      stock: Number(stock) || 30,
      unit: 'hộp',
      region: 'Đà Lạt',
      image:
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
    }

    onAddBox(newBox)
    onClose()
    onInfo?.(`Đã tạo thành công Túi Mù: ${newBox.name}`)
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
          <div className="w-12 h-12 rounded-2xl bg-[#8a4e1d]/10 text-[#8a4e1d] flex items-center justify-center font-bold">
            <Gift size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#1c2216]">Tạo Túi Mù Blind Box</h3>
            <p className="text-xs text-[#7e8779]">Giải cứu nhanh nông sản thu hoạch cuối ngày</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#353d2f] mb-1">
              Tên túi mù / combo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Túi Mù Nông Sản Giải Cứu 5kg"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f7f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs text-[#1e2319] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-[#353d2f] mb-1">
                Giá giải cứu (đ) *
              </label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f7f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs text-[#1e2319] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#353d2f] mb-1">Giá gốc (đ)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f7f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs text-[#1e2319] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-[#353d2f] mb-1">
                Trọng lượng dự kiến
              </label>
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="5kg"
                className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f7f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs text-[#1e2319] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#353d2f] mb-1">
                Số lượng hộp phát hành
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f7f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs text-[#1e2319] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#8a4e1d] hover:bg-[#6c3911] text-white font-black text-xs uppercase tracking-wider transition-all shadow-md mt-4 cursor-pointer"
          >
            Đăng Bán Túi Mù
          </button>
        </form>
      </div>
    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  MapPin,
  CreditCard,
  Banknote,
  ArrowRight,
  ShieldCheck,
  Store,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Truck,
  ShoppingBag,
  Tag,
  Check,
  Plus,
  Trash2,
  Edit3,
  X,
  Clock,
  Package,
  Ticket,
  Gift,
  ChevronRight,
  PackageX,
  ShoppingCart,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth, useUiStore } from '@/stores'
import {
  orderService,
  voucherService,
  type VoucherResponse,
  type AddressSuggestion,
  getSavedAddresses,
  createSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
  setDefaultSavedAddress,
} from '@/services'
import type { SavedAddress, SavedAddressRequest } from '@/types/address.types'
import { globalShowAlert } from '@/components/common/Popup'
import { getErrorMessage } from '@/utils'
import {
  useCheckoutPreview,
  useCreateOrder,
  useCreatePayment,
} from '../hooks/useBuyerOrder'
import { useMyCart } from '@/features/cart/hooks/useCartQueries'
import { PaymentQrModal } from './PaymentQrModal'
import type { OrderItemRequest, OrderResponse } from '@/types/order.types'
import type { PaymentResponse } from '@/types/payment.types'

interface CheckoutFormValues {
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  note?: string
  paymentMethod: 'COD' | 'PAYOS'
}

export interface StockShortageItem {
  itemType: 'PRODUCT' | 'MYSTERY_BOX' | 'BUILD_COMBO' | 'GENERAL'
  id?: number
  itemName: string
  imageUrl?: string
  requestedQuantity?: number
  availableQuantity?: number
}

function parseStockShortages(err: any): StockShortageItem[] {
  // 1. Ưu tiên đọc từ trường result cấu trúc do Backend trả về
  const resultData = err?.data?.result ?? err?.response?.data?.result
  if (Array.isArray(resultData) && resultData.length > 0) {
    return resultData.map((item: any) => ({
      itemType: (item.itemType as any) || 'GENERAL',
      id: item.id,
      itemName: item.itemName || item.name || 'Mặt hàng',
      imageUrl: item.imageUrl,
      requestedQuantity: typeof item.requestedQuantity === 'number' ? item.requestedQuantity : undefined,
      availableQuantity: typeof item.availableQuantity === 'number' ? item.availableQuantity : 0,
    }))
  }

  // 2. Parse từ chuỗi message của Backend
  const message: string =
    err?.data?.message ||
    err?.response?.data?.message ||
    err?.message ||
    ''

  const items: StockShortageItem[] = []
  const lines = message.split('\n')

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // Mẫu bullet: • [Loại] "Tên": Kho còn X, bạn đặt Y  hoặc  • [Loại] "Tên"
    const bulletMatch = line.match(/^•\s*\[(.*?)\]\s*"([^"]+)"(?::\s*Kho còn\s*(\d+))?,?\s*(?:bạn đặt\s*(\d+))?/i)
    if (bulletMatch) {
      const typeStr = bulletMatch[1].toLowerCase()
      let itemType: StockShortageItem['itemType'] = 'GENERAL'
      if (typeStr.includes('hộp bí ẩn') || typeStr.includes('mystery')) itemType = 'MYSTERY_BOX'
      else if (typeStr.includes('combo')) itemType = 'BUILD_COMBO'
      else if (typeStr.includes('sản phẩm')) itemType = 'PRODUCT'

      items.push({
        itemType,
        itemName: bulletMatch[2],
        availableQuantity: bulletMatch[3] !== undefined ? parseInt(bulletMatch[3], 10) : undefined,
        requestedQuantity: bulletMatch[4] !== undefined ? parseInt(bulletMatch[4], 10) : undefined,
      })
      continue
    }

    // Mẫu 1 dòng đơn: Sản phẩm "Tên" trong kho chỉ còn X (bạn đặt Y)...
    const singleMatch = line.match(/^(Sản phẩm|Hộp bí ẩn|Gói Combo)\s*"([^"]+)"\s*trong kho chỉ còn\s*(\d+)\s*\(bạn đặt\s*(\d+)\)/i)
    if (singleMatch) {
      const typeStr = singleMatch[1].toLowerCase()
      let itemType: StockShortageItem['itemType'] = 'GENERAL'
      if (typeStr.includes('hộp bí ẩn') || typeStr.includes('mystery')) itemType = 'MYSTERY_BOX'
      else if (typeStr.includes('combo')) itemType = 'BUILD_COMBO'
      else if (typeStr.includes('sản phẩm')) itemType = 'PRODUCT'

      items.push({
        itemType,
        itemName: singleMatch[2],
        availableQuantity: parseInt(singleMatch[3], 10),
        requestedQuantity: parseInt(singleMatch[4], 10),
      })
    }
  }

  return items
}

function isStockShortageError(err: any): boolean {
  const code = err?.data?.code ?? err?.response?.data?.code
  if (code === 5015 || code === 8002) return true
  const msg = (err?.data?.message || err?.response?.data?.message || err?.message || '').toLowerCase()
  return (
    msg.includes('kho') ||
    msg.includes('stock') ||
    msg.includes('không đủ số lượng') ||
    msg.includes('hết hàng') ||
    msg.includes('hộp bí ẩn') ||
    msg.includes('combo')
  )
}

export const CheckoutView: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedCartItemIds = (location.state as { selectedCartItemIds?: number[] })?.selectedCartItemIds

  const { data: cart, isLoading: isCartLoading } = useMyCart()

  const [createdOrderSummary, setCreatedOrderSummary] = useState<{
    orders: OrderResponse[]
    batchId?: number
    totalAmount: number
    paymentRes?: PaymentResponse
    paymentMethod: string
  } | null>(null)
  const previewMutation = useCheckoutPreview()
  const createOrderMutation = useCreateOrder()
  const createPaymentMutation = useCreatePayment()

  // Modal QR PayOS state
  const [qrModalData, setQrModalData] = useState<PaymentResponse | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [createdOrderCode, setCreatedOrderCode] = useState<string>('')

  const { user } = useAuth()
  const MAX_SAVED_ADDRESSES = 10
  const QUICK_LABELS = ['Nhà', 'Công ty', 'Nhà bố mẹ', 'Trường học']

  // Danh sách sổ địa chỉ nhận hàng từ Backend Database
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null)
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false)
  const [isManualEditing, setIsManualEditing] = useState(false)
  const [isSavingAddressApi, setIsSavingAddressApi] = useState(false)
  const [addressSaveError, setAddressSaveError] = useState<string | null>(null)

  // Form Thêm / Sửa địa chỉ trong Modal
  const [formLabel, setFormLabel] = useState('Nhà')
  const [formRecipientName, setFormRecipientName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formIsDefault, setFormIsDefault] = useState(false)

  // Tùy chọn lưu sổ địa chỉ tại form thanh toán
  const [saveToAddressBook, setSaveToAddressBook] = useState(true)
  const [checkoutAddressLabel, setCheckoutAddressLabel] = useState('Nhà')

  // Autocomplete state (form chính)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Autocomplete state (Modal Sổ địa chỉ)
  const [modalSuggestions, setModalSuggestions] = useState<AddressSuggestion[]>([])
  const [isSearchingModalSuggestions, setIsSearchingModalSuggestions] = useState(false)
  const [showModalSuggestions, setShowModalSuggestions] = useState(false)
  const isSelectingModalSuggestionRef = useRef(false)

  // Voucher state
  const [selectedVoucherCodes, setSelectedVoucherCodes] = useState<string[]>([])
  const [inputVoucherCode, setInputVoucherCode] = useState('')
  const [myVouchers, setMyVouchers] = useState<(VoucherResponse & { isCollected?: boolean })[]>([])
  const [savingVoucherCode, setSavingVoucherCode] = useState<string | null>(null)
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)
  const [voucherError, setVoucherError] = useState<string | null>(null)

  // Cảnh báo tồn kho không đủ (Tổng hợp toàn bộ Product, Mystery Box, Build Combo)
  const [stockErrorModal, setStockErrorModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    items: StockShortageItem[]
  }>({
    isOpen: false,
    title: '',
    message: '',
    items: [],
  })
  const [orderSubmitError, setOrderSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    defaultValues: {
      recipientName: user?.fullName || user?.name || '',
      recipientPhone: user?.phoneNumber || user?.phone || '',
      shippingAddress: user?.address || '',
      note: '',
      paymentMethod: 'PAYOS',
    },
  })

  const selectedPaymentMethod = watch('paymentMethod')
  const shippingAddress = watch('shippingAddress')

  // Tải danh sách địa chỉ đã lưu từ Backend
  useEffect(() => {
    let isMounted = true
    const loadAddresses = async () => {
      setIsLoadingAddresses(true)
      try {
        const list = await getSavedAddresses()
        if (!isMounted) return
        setSavedAddresses(list)

        if (list.length > 0) {
          const defaultAddr = list.find((a) => a.isDefault) || list[0]
          setSelectedAddressId(defaultAddr.id)
          setValue('recipientName', defaultAddr.recipientName, { shouldValidate: true })
          setValue('recipientPhone', defaultAddr.phone, { shouldValidate: true })
          setValue('shippingAddress', defaultAddr.address, { shouldValidate: true })
        } else if (user) {
          // Lần đầu đặt hàng: tự động điền từ thông tin Profile của Buyer
          setValue('recipientName', user.fullName || user.name || '', { shouldValidate: true })
          setValue('recipientPhone', user.phoneNumber || user.phone || '', { shouldValidate: true })
          setValue('shippingAddress', user.address || '', { shouldValidate: true })
        }
      } catch (err) {
        console.error('Lỗi tải sổ địa chỉ:', err)
      } finally {
        if (isMounted) setIsLoadingAddresses(false)
      }
    }
    loadAddresses()
    return () => {
      isMounted = false
    }
  }, [user])

  // Lắng nghe thay đổi địa chỉ để gợi ý Places Autocomplete
  useEffect(() => {
    if (!shippingAddress || shippingAddress.trim().length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingSuggestions(true)
      const list = await orderService.getAddressSuggestions(shippingAddress)
      setSuggestions(list)
      setShowSuggestions(list.length > 0)
      setIsSearchingSuggestions(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [shippingAddress])

  const handleSelectSuggestion = (s: AddressSuggestion) => {
    setValue('shippingAddress', s.description, { shouldValidate: true })
    setShowSuggestions(false)
    if (checkoutItems.length > 0) {
      previewMutation.mutate({
        shippingAddress: s.description,
        items: checkoutItems.map((i) => i.itemReq),
        cartItemIds: checkoutItems.map((i) => i.cartItemId),
      })
    }
  }

  // Lắng nghe thay đổi formAddress trong Modal để gợi ý Places Autocomplete
  useEffect(() => {
    if (isSelectingModalSuggestionRef.current) {
      isSelectingModalSuggestionRef.current = false
      return
    }

    if (!formAddress || formAddress.trim().length < 2) {
      setModalSuggestions([])
      setShowModalSuggestions(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingModalSuggestions(true)
      try {
        const list = await orderService.getAddressSuggestions(formAddress)
        setModalSuggestions(list)
        setShowModalSuggestions(list.length > 0)
      } catch (err) {
        console.error('Lỗi tìm gợi ý địa chỉ modal:', err)
      } finally {
        setIsSearchingModalSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [formAddress])

  const handleSelectModalSuggestion = (s: AddressSuggestion) => {
    isSelectingModalSuggestionRef.current = true
    setFormAddress(s.description)
    setShowModalSuggestions(false)
  }

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id)
    setValue('recipientName', addr.recipientName, { shouldValidate: true })
    setValue('recipientPhone', addr.phone, { shouldValidate: true })
    setValue('shippingAddress', addr.address, { shouldValidate: true })
    setIsAddressModalOpen(false)
    setIsManualEditing(false)
    setEditingAddress(null)
    setIsAddingNewAddress(false)

    if (checkoutItems.length > 0 && addr.address) {
      previewMutation.mutate({
        shippingAddress: addr.address,
        voucherCodes: selectedVoucherCodes,
        items: checkoutItems.map((i) => i.itemReq),
        cartItemIds: checkoutItems.map((i) => i.cartItemId),
      })
    }
  }

  // Mở form Sửa địa chỉ (UPDATE bản ghi cũ)
  const handleOpenEditAddress = (addr: SavedAddress, e: React.MouseEvent) => {
    e.stopPropagation()
    setAddressSaveError(null)
    setEditingAddress(addr)
    setIsAddingNewAddress(false)
    setFormLabel(addr.label || 'Nhà')
    setFormRecipientName(addr.recipientName)
    setFormPhone(addr.phone)
    setFormAddress(addr.address)
    setFormIsDefault(addr.isDefault)
    setModalSuggestions([])
    setShowModalSuggestions(false)
  }

  // Lưu chỉnh sửa địa chỉ (PUT /api/addresses/{id})
  const handleSaveEditAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAddress || !formRecipientName || !formPhone || !formAddress) return

    setIsSavingAddressApi(true)
    setAddressSaveError(null)
    try {
      const payload: SavedAddressRequest = {
        label: formLabel.trim() || 'Nhà',
        recipientName: formRecipientName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
        isDefault: formIsDefault,
      }
      const updated = await updateSavedAddress(editingAddress.id, payload)
      setSavedAddresses((prev) =>
        prev.map((a) => {
          if (a.id === updated.id) return updated
          if (updated.isDefault) return { ...a, isDefault: false }
          return a
        })
      )

      // Nếu địa chỉ đang sửa là địa chỉ đang được chọn tại checkout thì update luôn form
      if (selectedAddressId === updated.id) {
        setValue('recipientName', updated.recipientName, { shouldValidate: true })
        setValue('recipientPhone', updated.phone, { shouldValidate: true })
        setValue('shippingAddress', updated.address, { shouldValidate: true })
        if (checkoutItems.length > 0) {
          previewMutation.mutate({
            shippingAddress: updated.address,
            voucherCodes: selectedVoucherCodes,
            items: checkoutItems.map((i) => i.itemReq),
            cartItemIds: checkoutItems.map((i) => i.cartItemId),
          })
        }
      }
      setEditingAddress(null)
    } catch (err: any) {
      console.error('Lỗi cập nhật địa chỉ:', err)
      setAddressSaveError(err?.response?.data?.message || 'Không thể cập nhật địa chỉ.')
    } finally {
      setIsSavingAddressApi(false)
    }
  }

  // Mở form Thêm địa chỉ mới (CREATE bản ghi mới)
  const handleOpenAddNewAddress = () => {
    setAddressSaveError(null)
    setIsAddingNewAddress(true)
    setEditingAddress(null)
    setFormLabel('Nhà')
    setFormRecipientName(user?.fullName || '')
    setFormPhone(user?.phoneNumber || '')
    setFormAddress('')
    setFormIsDefault(savedAddresses.length === 0)
    setModalSuggestions([])
    setShowModalSuggestions(false)
  }

  // Lưu địa chỉ mới (POST /api/addresses)
  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formRecipientName || !formPhone || !formAddress) return

    setIsSavingAddressApi(true)
    setAddressSaveError(null)
    try {
      const payload: SavedAddressRequest = {
        label: formLabel.trim() || 'Nhà',
        recipientName: formRecipientName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
        isDefault: formIsDefault || savedAddresses.length === 0,
      }
      const created = await createSavedAddress(payload)
      setSavedAddresses((prev) => {
        const list = created.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev
        return [created, ...list]
      })
      handleSelectSavedAddress(created)
      setIsAddingNewAddress(false)
    } catch (err: any) {
      console.error('Lỗi tạo địa chỉ mới:', err)
      setAddressSaveError(err?.response?.data?.message || 'Không thể thêm địa chỉ mới.')
    } finally {
      setIsSavingAddressApi(false)
    }
  }

  // Xóa địa chỉ (DELETE /api/addresses/{id})
  const handleDeleteSavedAddress = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteSavedAddress(id)
      const remaining = savedAddresses.filter((a) => a.id !== id)
      setSavedAddresses(remaining)
      if (selectedAddressId === id && remaining.length > 0) {
        handleSelectSavedAddress(remaining[0])
      }
    } catch (err) {
      console.error('Lỗi xóa địa chỉ:', err)
    }
  }

  // Đặt làm địa chỉ mặc định (PATCH /api/addresses/{id}/default)
  const handleSetDefaultAddress = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await setDefaultSavedAddress(id)
      setSavedAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      )
    } catch (err) {
      console.error('Lỗi đặt mặc định:', err)
    }
  }

  // Lọc danh sách items cần checkout từ giỏ hàng theo từng shop
  const checkoutShops = React.useMemo(() => {
    if (!cart?.shopCarts) return []
    return cart.shopCarts
      .map((shop) => {
        const filteredItems = shop.items.filter((item) => {
          const isSelected = !selectedCartItemIds || selectedCartItemIds.includes(item.cartItemId)
          return isSelected && item.available !== false
        })
        return {
          ...shop,
          items: filteredItems,
        }
      })
      .filter((shop) => shop.items.length > 0)
  }, [cart, selectedCartItemIds])

  const checkoutItems = React.useMemo(() => {
    return checkoutShops.flatMap((shop) =>
      shop.items.map((item) => ({
        itemReq: {
          productId: item.productId || (item.itemType === 'PRODUCT' ? item.itemId : undefined),
          mysteryBoxId: item.mysteryBoxId || (item.itemType === 'MYSTERY_BOX' ? item.itemId : undefined),
          buildComboId: item.buildComboId || (item.itemType === 'BUILD_COMBO' ? item.itemId : undefined),
          quantity: item.quantity,
        },
        cartItemId: item.cartItemId,
        shopId: shop.shopId,
        shopName: shop.shopName,
        itemName: item.itemName || item.name || '',
        imageUrl: item.imageUrl,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        itemType: item.itemType,
      }))
    )
  }, [checkoutShops])

  const cartSummary = React.useMemo(() => {
    const totalGoods = checkoutItems.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0), 0)
    const estimatedShipping = checkoutShops.length > 0 ? checkoutShops.length * 15000 : 15000
    return {
      totalGoods,
      estimatedShipping,
      orderCount: checkoutShops.length,
    }
  }, [checkoutItems, checkoutShops])

  const getVoucherEligibility = React.useCallback((voucher: VoucherResponse) => {
    if (!voucher) return false
    if (voucher.active === false) return false
    if (!voucher.voucherCode) return false

    // Kiểm tra hạn sử dụng an toàn (hỗ trợ cả Array [yyyy, MM, dd] lẫn string)
    let isExpired = false
    if (voucher.expiryDate) {
      if (Array.isArray(voucher.expiryDate)) {
        const arr = voucher.expiryDate as unknown as number[]
        const expDate = new Date(arr[0], (arr[1] || 1) - 1, arr[2] || 1, arr[3] || 0, arr[4] || 0)
        isExpired = !isNaN(expDate.getTime()) && expDate < new Date()
      } else {
        const expDate = new Date(voucher.expiryDate)
        isExpired = !isNaN(expDate.getTime()) && expDate < new Date()
      }
    }
    if (isExpired) return false

    const minOrder = Number(voucher.minOrderValue ?? 0)
    const isPlatform =
      voucher.voucherScope === 'PLATFORM' ||
      voucher.voucherScope === 'SYSTEM' ||
      voucher.voucherScope === 'WELCOME' ||
      voucher.creatorRole === 'ADMIN'

    // Nếu là Voucher của Shop:
    if (!isPlatform) {
      const matchingShop = checkoutShops.find((shop) => Number(shop.shopId) === Number(voucher.shopId))
      if (!matchingShop) return false

      const shopGoods = matchingShop.items.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0), 0)
      return shopGoods >= minOrder
    }

    // Nếu là Voucher Toàn sàn (cả Freeship lẫn Giảm giá đơn hàng):
    // Điều kiện đơn tối thiểu luôn so sánh với TỔNG TIỀN HÀNG của cả đơn hàng
    return cartSummary.totalGoods >= minOrder
  }, [cartSummary, checkoutShops])

  const totalItemsCount = React.useMemo(() => {
    return checkoutItems.reduce((sum, it) => sum + it.quantity, 0)
  }, [checkoutItems])

  // Tải danh sách voucher trong ví người mua VÀ voucher công khai của toàn sàn/shop
  useEffect(() => {
    let isMounted = true
    Promise.all([
      voucherService.getMyVouchers().catch(() => []),
      voucherService.getPublicVouchers().catch(() => []),
    ]).then(([mine, publics]) => {
      if (!isMounted) return
      const map = new Map<string, VoucherResponse & { isCollected?: boolean }>()
      // Thêm voucher công khai toàn sàn/shop trước (mặc định isCollected = false)
      ;(publics || []).forEach((v) => {
        if (v?.voucherCode) {
          map.set(v.voucherCode.toUpperCase(), { ...v, isCollected: false })
        }
      })
      // Đè bằng voucher trong ví của user (đã lưu vào ví: isCollected = true)
      ;(mine || []).forEach((v) => {
        if (v?.voucherCode) {
          map.set(v.voucherCode.toUpperCase(), { ...v, isCollected: true })
        }
      })
      setMyVouchers(Array.from(map.values()))
    }).catch((err) => {
      console.error('Lỗi tải danh sách voucher:', err)
      if (isMounted) setMyVouchers([])
    })
    return () => {
      isMounted = false
    }
  }, [])

  const triggerPreview = (addr?: string, codes: string[] = selectedVoucherCodes) => {
    if (checkoutItems.length > 0) {
      previewMutation.mutate({
        shippingAddress: addr || shippingAddress || 'Thành phố Hồ Chí Minh',
        voucherCodes: codes,
        items: checkoutItems.map((i) => i.itemReq),
        cartItemIds: checkoutItems.map((i) => i.cartItemId),
      })
    }
  }

  // Thu thập / Lưu voucher vào ví trực tiếp ngay tại Modal
  const handleCollectVoucherInModal = async (vc: VoucherResponse & { isCollected?: boolean }) => {
    if (!user) {
      globalShowAlert('Vui lòng đăng nhập để lưu mã ưu đãi vào kho.', 'Yêu cầu đăng nhập', 'warning')
      navigate('/login')
      return
    }
    const code = vc.voucherCode.trim().toUpperCase()
    setSavingVoucherCode(code)
    setVoucherError(null)
    try {
      await voucherService.collectByCode(code)
      setMyVouchers((prev) =>
        prev.map((item) =>
          item.voucherCode.trim().toUpperCase() === code
            ? { ...item, isCollected: true, claimedCount: (item.claimedCount || 0) + 1 }
            : item
        )
      )
      globalShowAlert(`Đã lưu thành công mã "${code}" vào ví của bạn! Bạn có thể chọn để áp dụng ngay.`, 'Lưu mã thành công', 'success')
    } catch (err: any) {
      const errMsg = getErrorMessage(err, 'Mã voucher này đã hết lượt lưu hoặc không còn khả dụng.')
      setVoucherError(errMsg)
      globalShowAlert(errMsg, 'Không thể lưu mã', 'error')
    } finally {
      setSavingVoucherCode(null)
    }
  }

  const handleApplyVoucherInput = async () => {
    const code = inputVoucherCode.trim().toUpperCase()
    if (!code) return

    let matchedVoucher = myVouchers.find((vc) => vc.voucherCode?.trim().toUpperCase() === code)

    // Nếu chưa có trong ví, tự động lưu mã vào ví (hỗ trợ cả mã ẩn và mã công khai)
    if (!matchedVoucher || !matchedVoucher.isCollected) {
      try {
        await voucherService.collectByCode(code)
        const updated = await voucherService.getMyVouchers()
        const updatedList: (VoucherResponse & { isCollected?: boolean })[] = (updated || []).map((v) => ({
          ...v,
          isCollected: true,
        }))
        setMyVouchers((prev) => {
          const map = new Map<string, VoucherResponse & { isCollected?: boolean }>()
          prev.forEach((v) => map.set(v.voucherCode.toUpperCase(), v))
          updatedList.forEach((v) => map.set(v.voucherCode.toUpperCase(), v))
          return Array.from(map.values())
        })
        matchedVoucher = updatedList.find((vc) => vc.voucherCode?.trim().toUpperCase() === code)
      } catch (err: any) {
        setVoucherError(err?.response?.data?.message || 'Mã voucher không tồn tại, đã hết lượt hoặc hết hạn.')
        return
      }
    }

    if (!matchedVoucher) {
      setVoucherError('Không tìm thấy thông tin voucher.')
      return
    }

    if (selectedVoucherCodes.includes(code)) {
      setVoucherError('Mã này đã được chọn áp dụng.')
      return
    }

    if (!getVoucherEligibility(matchedVoucher)) {
      setVoucherError('Đơn hàng hiện tại chưa đủ điều kiện áp dụng mã này (kiểm tra đơn tối thiểu).')
      return
    }

    setVoucherError(null)
    handleToggleVoucherCode(code, matchedVoucher)
    setInputVoucherCode('')
  }

  const handleToggleVoucherCode = (code: string, overrideVoucher?: VoucherResponse & { isCollected?: boolean }) => {
    setVoucherError(null)
    const upper = code.trim().toUpperCase()
    const matchedVoucher = overrideVoucher || myVouchers.find((vc) => vc.voucherCode?.trim().toUpperCase() === upper)

    if (!matchedVoucher) {
      setVoucherError('Voucher không tồn tại trong kho.')
      return
    }

    // Yêu cầu phải lưu vào ví trước khi chọn áp dụng
    if (!matchedVoucher.isCollected) {
      setVoucherError('Vui lòng bấm "Lưu mã" vào ví trước khi chọn áp dụng.')
      return
    }

    if (!selectedVoucherCodes.includes(upper) && !getVoucherEligibility(matchedVoucher)) {
      setVoucherError('Voucher không đủ điều kiện với đơn hàng hiện tại.')
      return
    }

    let nextCodes: string[]
    if (selectedVoucherCodes.includes(upper)) {
      nextCodes = selectedVoucherCodes.filter((c) => c !== upper)
    } else {
      // Cơ chế Shopee Stacking:
      // Tối đa 1 voucher Freeship + 1 voucher Sàn + 1 voucher của từng Shop
      const targetIsShipping =
        matchedVoucher.voucherTarget === 'SHIPPING' ||
        matchedVoucher.voucherType === 'FREE_SHIPPING' ||
        Boolean(matchedVoucher.voucherCode?.toUpperCase().includes('FREESHIP'))
      const scopeIsPlatform =
        matchedVoucher.voucherScope === 'PLATFORM' ||
        matchedVoucher.voucherScope === 'SYSTEM' ||
        matchedVoucher.creatorRole === 'ADMIN'

      nextCodes = selectedVoucherCodes.filter((c) => {
        const other = myVouchers.find((v) => v.voucherCode?.trim().toUpperCase() === c)
        if (!other) return true

        const otherIsShipping =
          other.voucherTarget === 'SHIPPING' ||
          other.voucherType === 'FREE_SHIPPING' ||
          Boolean(other.voucherCode?.toUpperCase().includes('FREESHIP'))
        if (targetIsShipping && otherIsShipping) return false // Thay thế Freeship cũ

        if (!targetIsShipping && !otherIsShipping) {
          const otherIsPlatform =
            other.voucherScope === 'PLATFORM' ||
            other.voucherScope === 'SYSTEM' ||
            other.creatorRole === 'ADMIN'
          if (scopeIsPlatform && otherIsPlatform) return false // Thay thế Platform voucher cũ
          if (!scopeIsPlatform && !otherIsPlatform && Number(other.shopId) === Number(matchedVoucher.shopId)) {
            return false // Thay thế Shop voucher cùng shop
          }
        }
        return true
      })
      nextCodes.push(upper)
    }

    setSelectedVoucherCodes(nextCodes)
    triggerPreview(shippingAddress, nextCodes)
  }

  const handleRemoveVoucher = (code: string) => {
    handleToggleVoucherCode(code)
  }

  const resolveStockShortages = React.useCallback(
    (err: any): StockShortageItem[] => {
      const rawItems = parseStockShortages(err)
      return rawItems.map((shortage) => {
        if (shortage.imageUrl) return shortage
        const matched = checkoutItems.find(
          (ci) =>
            ci.itemName.toLowerCase().trim() === shortage.itemName.toLowerCase().trim() ||
            (shortage.id &&
              (ci.itemReq.productId === shortage.id ||
                ci.itemReq.mysteryBoxId === shortage.id ||
                ci.itemReq.buildComboId === shortage.id))
        )
        return {
          ...shortage,
          imageUrl: matched?.imageUrl || shortage.imageUrl,
        }
      })
    },
    [checkoutItems]
  )

  // Tự động gọi preview khi có items, địa chỉ hoặc voucher thay đổi
  useEffect(() => {
    triggerPreview(shippingAddress, selectedVoucherCodes)
  }, [checkoutItems.length, shippingAddress, selectedVoucherCodes])

  // Tự động phát hiện lỗi tồn kho ngay khi preview thất bại
  useEffect(() => {
    if (previewMutation.isError && isStockShortageError(previewMutation.error)) {
      const parsed = resolveStockShortages(previewMutation.error)
      const errorMsg =
        (previewMutation.error as any)?.data?.message ||
        (previewMutation.error as any)?.response?.data?.message ||
        (previewMutation.error as any)?.message ||
        'Một số mặt hàng trong kho không đủ số lượng.'
      setOrderSubmitError(errorMsg)
      setStockErrorModal({
        isOpen: true,
        title:
          parsed.length > 1
            ? `Có ${parsed.length} mặt hàng không đủ tồn kho`
            : 'Số lượng tồn kho không đủ',
        message: errorMsg,
        items: parsed,
      })
    }
  }, [previewMutation.isError, previewMutation.error, resolveStockShortages])

  const onSubmit = async (values: CheckoutFormValues) => {
    if (checkoutItems.length === 0) return

    try {
      const orders = await createOrderMutation.mutateAsync({
        recipientName: values.recipientName,
        recipientPhone: values.recipientPhone,
        shippingAddress: values.shippingAddress,
        saveAddressToBook: saveToAddressBook,
        addressLabel: checkoutAddressLabel,
        note: values.note,
        paymentMethod: values.paymentMethod,
        voucherCodes: selectedVoucherCodes,
        items: checkoutItems.map((i) => i.itemReq),
        cartItemIds: checkoutItems.map((i) => i.cartItemId),
      })

      if (!orders || orders.length === 0) return

      // Tự động tải lại sổ địa chỉ mới nhất từ Backend
      getSavedAddresses().then((list) => {
        if (list && list.length > 0) setSavedAddresses(list)
      }).catch(() => { })

      const firstOrder = orders[0]
      const batchId = firstOrder.batchId || undefined
      const totalAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

      setCreatedOrderSummary({
        orders,
        batchId,
        totalAmount,
        paymentMethod: values.paymentMethod,
      })

      // 1. Nếu là COD: Đơn ở trạng thái PENDING -> Chuyển thẳng trang kết quả
      if (values.paymentMethod === 'COD') {
        navigate(`/payment/result?orderId=${firstOrder.orderId}&status=PENDING&method=COD`)
        return
      }

      // 2. Nếu là PAYOS (Chuyển khoản QR): Khởi tạo payment link
      try {
        const paymentRes = await createPaymentMutation.mutateAsync({
          batchId: batchId,
          orderId: batchId ? undefined : firstOrder.orderId,
          returnUrl: `${window.location.origin}/payment/result`,
          cancelUrl: `${window.location.origin}/payment/result`,
        })

        setCreatedOrderSummary((prev) => (prev ? { ...prev, paymentRes } : null))

        if (paymentRes.checkoutUrl) {
          setQrModalData(paymentRes)
          setCreatedOrderCode(paymentRes.payosOrderCode)
          setIsQrModalOpen(true)
        } else {
          navigate(`/payment/result?orderCode=${paymentRes.payosOrderCode}`)
        }
      } catch (payErr) {
        console.error('Lỗi khi tạo link thanh toán PayOS:', payErr)
        // Vẫn giữ createdOrderSummary để người dùng thấy đơn hàng và bấm "Thử lại thanh toán"
      }
    } catch (err: any) {
      console.error('Lỗi khi đặt hàng:', err)
      const errorMsg =
        err?.data?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng kiểm tra lại!'

      const isStock = isStockShortageError(err)
      const parsedItems = resolveStockShortages(err)

      setOrderSubmitError(errorMsg)

      if (isStock) {
        setStockErrorModal({
          isOpen: true,
          title:
            parsedItems.length > 1
              ? `Có ${parsedItems.length} mặt hàng không đủ tồn kho`
              : 'Số lượng tồn kho không đủ',
          message: errorMsg,
          items: parsedItems,
        })
      }

      useUiStore.getState().showToast(errorMsg)
    }
  }

  const handleQrModalConfirmed = () => {
    setIsQrModalOpen(false)
    if (createdOrderCode) {
      navigate(`/payment/result?orderCode=${createdOrderCode}&status=PAID`)
    } else {
      navigate('/orders')
    }
  }

  const previewData = previewMutation.data
  const goodsAmount = previewData?.totalGoodsAmount ?? previewData?.subtotal ?? 0
  const shippingFee = previewData?.totalShippingFee ?? previewData?.shippingFee ?? 0
  const discount = previewData?.totalVoucherDiscount ?? previewData?.discount ?? 0
  const finalTotal = previewData?.finalTotalAmount ?? previewData?.totalAmount ?? (goodsAmount + shippingFee - discount)
  const voucherBreakdown = React.useMemo(() => {
    const entries = new Map<string, number>()

    const addBreakdown = (record?: Record<string, number>) => {
      if (!record) return
      Object.entries(record).forEach(([code, value]) => {
        const normalizedCode = code.trim().toUpperCase()
        const next = (entries.get(normalizedCode) ?? 0) + Number(value || 0)
        entries.set(normalizedCode, next)
      })
    }

    addBreakdown(previewData?.voucherDiscountsDetail)
    previewData?.shopOrders?.forEach((order) => {
      addBreakdown(order.voucherDiscountsDetail)
    })

    return Array.from(entries.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [previewData])

  if (isCartLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  // Đơn hàng đã được tạo thành công nhưng chưa thanh toán xong (PayOS)
  if (createdOrderSummary) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-line p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600">
            <Clock size={36} className="animate-pulse" />
          </div>

          <h2 className="text-2xl font-black text-ink mb-2">Đơn hàng đã được tạo thành công!</h2>
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300">
              <Clock size={13} className="text-amber-600" />
              Chờ thanh toán (PayOS)
            </span>
          </div>

          <p className="text-sm text-ink-muted mb-6">
            Đơn hàng của bạn đã được ghi nhận vào hệ thống. Bạn có thể quét mã QR để thanh toán ngay bây giờ hoặc thanh toán lại bất cứ lúc nào trong mục <strong>Đơn hàng của tôi</strong>.
          </p>

          <div className="bg-neutral-50 rounded-2xl p-5 mb-6 text-left border border-line space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-ink-muted">Mã đợt thanh toán (Batch):</span>
              <span className="font-mono font-bold text-ink">#{createdOrderSummary.batchId || createdOrderSummary.orders[0]?.orderId}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-ink-muted">Số lượng shop:</span>
              <span className="font-bold text-ink">{createdOrderSummary.orders.length} shop</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-line">
              <span className="text-ink-muted">Tổng tiền thanh toán:</span>
              <span className="text-lg font-black text-emerald-700">
                {createdOrderSummary.totalAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="pt-2 border-t border-line space-y-2">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Chi tiết đơn theo từng shop:</span>
              {createdOrderSummary.orders.map((o) => (
                <div key={o.orderId} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-xl border border-line">
                  <span className="font-semibold text-ink">Đơn #{o.orderId} - {o.shopName || 'Shop'}</span>
                  <span className="font-bold text-emerald-600">{Number(o.totalAmount || 0).toLocaleString('vi-VN')} đ</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="primary"
              onClick={() => {
                if (createdOrderSummary.paymentRes?.checkoutUrl) {
                  setQrModalData(createdOrderSummary.paymentRes)
                  setCreatedOrderCode(createdOrderSummary.paymentRes.payosOrderCode)
                  setIsQrModalOpen(true)
                } else {
                  createPaymentMutation.mutateAsync({
                    batchId: createdOrderSummary.batchId,
                    orderId: createdOrderSummary.batchId ? undefined : createdOrderSummary.orders[0]?.orderId,
                    returnUrl: `${window.location.origin}/payment/result`,
                    cancelUrl: `${window.location.origin}/payment/result`,
                  }).then((res) => {
                    setCreatedOrderSummary((prev) => prev ? { ...prev, paymentRes: res } : null)
                    setQrModalData(res)
                    setCreatedOrderCode(res.payosOrderCode)
                    setIsQrModalOpen(true)
                  }).catch((err) => {
                    console.error('Không thể tạo lại link:', err)
                  })
                }
              }}
              className="w-full justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md shadow-amber-500/20"
            >
              <CreditCard size={16} />
              Thanh toán ngay bằng mã QR VietQR
            </Button>

            <Button
              variant="secondary"
              onClick={() => navigate('/orders')}
              className="w-full justify-center gap-2 py-3 rounded-xl"
            >
              <Package size={16} />
              Quản lý đơn hàng của tôi
            </Button>
          </div>
        </div>

        {/* Modal QR thanh toán */}
        {qrModalData && (
          <PaymentQrModal
            isOpen={isQrModalOpen}
            onClose={() => setIsQrModalOpen(false)}
            onConfirmed={handleQrModalConfirmed}
            qrCodeUrl={qrModalData.qrCodeUrl}
            checkoutUrl={qrModalData.checkoutUrl}
            amount={qrModalData.amount}
            orderCode={qrModalData.payosOrderCode}
          />
        )}
      </div>
    )
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle size={48} className="text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-ink">Không có sản phẩm nào để thanh toán</h2>
        <p className="text-sm text-ink-muted">
          Vui lòng chọn lại các mặt hàng trong giỏ hàng trước khi tiến hành thanh toán.
        </p>
        <Button variant="primary" onClick={() => navigate('/cart')}>
          Quay lại giỏ hàng
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header quay lại */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/cart')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-line hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-ink">Xác nhận đặt hàng & Thanh toán</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cột trái: Thông tin giao hàng & phương thức thanh toán */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin người nhận & Địa chỉ giao hàng (Chuẩn Shopee) */}
            <div className="bg-white rounded-2xl border border-line p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2 text-sm font-bold text-ink">
                  <MapPin size={18} className="text-emerald-600" />
                  Địa chỉ nhận hàng
                </div>
                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Thay đổi / Chọn địa chỉ khác</span>
                    <ChevronLeft size={14} className="rotate-180" />
                  </button>
                )}
              </div>

              {/* Thẻ tóm tắt địa chỉ đang chọn */}
              {savedAddresses.length > 0 && !isManualEditing ? (
                <div className="bg-[#f8faf6] p-4 rounded-xl border border-emerald-100/80 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-sm text-ink">
                        {watch('recipientName') || 'Chưa có tên người nhận'}
                      </span>
                      <span className="text-xs font-semibold text-ink-muted">
                        ({watch('recipientPhone') || 'Chưa có SĐT'})
                      </span>
                      {(() => {
                        const cur = savedAddresses.find((a) => a.id === selectedAddressId)
                        return (
                          <>
                            {cur?.label && (
                              <span className="text-[10px] bg-stone-100 text-stone-700 font-bold px-2 py-0.5 rounded-full border border-stone-200">
                                {cur.label}
                              </span>
                            )}
                            {cur?.isDefault && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                Mặc định
                              </span>
                            )}
                          </>
                        )
                      })()}
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      {watch('shippingAddress') || 'Chưa có địa chỉ giao hàng'}
                    </p>
                    {watch('note') && (
                      <p className="text-[11px] text-stone-500 italic">
                        Ghi chú: {watch('note')}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      const cur = savedAddresses.find((a) => a.id === selectedAddressId)
                      if (cur) {
                        handleOpenEditAddress(cur, e)
                        setIsAddressModalOpen(true)
                      } else {
                        setIsManualEditing(true)
                      }
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium shrink-0 flex items-center gap-1 pt-0.5 cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>Sửa</span>
                  </button>
                </div>
              ) : null}

              {/* Form chi tiết (hiển thị khi chưa có địa chỉ hoặc khi người dùng muốn sửa) */}
              {(savedAddresses.length === 0 || isManualEditing) && (
                <div className="space-y-4 pt-1">
                  {savedAddresses.length > 0 && (
                    <div className="flex items-center justify-between text-xs text-ink-muted">
                      <span>Nhập thông tin người nhận:</span>
                      <button
                        type="button"
                        onClick={() => setIsManualEditing(false)}
                        className="text-emerald-700 hover:underline font-medium cursor-pointer"
                      >
                        Thu gọn về địa chỉ đã chọn
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                        Họ và tên người nhận <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="Nguyễn Văn A"
                        {...register('recipientName', { required: 'Vui lòng nhập tên người nhận' })}
                        error={errors.recipientName?.message}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="0912 345 678"
                        {...register('recipientPhone', {
                          required: 'Vui lòng nhập số điện thoại',
                          pattern: {
                            value: /^[0-9]{9,11}$/,
                            message: 'Số điện thoại không hợp lệ',
                          },
                        })}
                        error={errors.recipientPhone?.message}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-semibold text-ink-muted mb-1.5 flex items-center justify-between">
                      <span>
                        Địa chỉ giao hàng chi tiết <span className="text-red-500">*</span>
                      </span>
                      {isSearchingSuggestions && (
                        <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-normal">
                          <Loader2 size={12} className="animate-spin" />
                          Đang tìm gợi ý...
                        </span>
                      )}
                    </label>
                    <Input
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      {...register('shippingAddress', { required: 'Vui lòng nhập địa chỉ giao hàng' })}
                      error={errors.shippingAddress?.message}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true)
                      }}
                    />

                    {/* Autocomplete Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-emerald-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                        <div className="p-2 bg-emerald-50/50 text-[11px] font-semibold text-emerald-800 flex items-center justify-between">
                          <span>Gợi ý địa chỉ từ Google Maps</span>
                          <button
                            type="button"
                            onClick={() => setShowSuggestions(false)}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        {suggestions.map((s, idx) => (
                          <div
                            key={s.placeId || idx}
                            onClick={() => handleSelectSuggestion(s)}
                            className="p-2.5 flex items-start gap-2 hover:bg-emerald-50/60 cursor-pointer text-xs text-ink transition-colors"
                          >
                            <MapPin size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed">{s.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tùy chọn lưu vào Sổ địa chỉ */}
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-900">
                      <input
                        type="checkbox"
                        checked={saveToAddressBook}
                        onChange={(e) => setSaveToAddressBook(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                      />
                      <span>Lưu thông tin này vào Sổ địa chỉ nhận hàng</span>
                    </label>

                    {saveToAddressBook && (
                      <div className="flex items-center gap-2 pt-1 pl-6">
                        <span className="text-[11px] text-ink-muted">Nhãn:</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {QUICK_LABELS.map((lbl) => (
                            <button
                              key={lbl}
                              type="button"
                              onClick={() => setCheckoutAddressLabel(lbl)}
                              className={`text-[11px] px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer ${checkoutAddressLabel === lbl
                                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                                  : 'bg-white text-stone-600 border-gray-200 hover:border-emerald-300'
                                }`}
                            >
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                  Ghi chú cho người bán / shipper
                </label>
                <Input placeholder="Giao vào giờ hành chính, gọi trước khi đến..." {...register('note')} />
              </div>
            </div>

            {/* Chọn phương thức thanh toán */}
            <div className="bg-white rounded-2xl border border-line p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-line text-sm font-bold text-ink">
                <CreditCard size={18} className="text-emerald-600" />
                Phương thức thanh toán
              </div>

              <div className="space-y-3">
                {/* Lựa chọn 1: PAYOS QR */}
                <label
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${selectedPaymentMethod === 'PAYOS'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-line hover:border-gray-300'
                    }`}
                >
                  <input
                    type="radio"
                    value="PAYOS"
                    {...register('paymentMethod')}
                    className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold text-sm text-ink">
                      <span>Chuyển khoản VietQR / Quét mã PayOS</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Khuyên dùng
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      Quét mã QR từ ứng dụng ngân hàng hoặc ví điện tử bất kỳ. Hệ thống tự động xác nhận ngay tức thì.
                    </p>
                  </div>
                </label>

                {/* Lựa chọn 2: COD */}
                <label
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${selectedPaymentMethod === 'COD'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-line hover:border-gray-300'
                    }`}
                >
                  <input
                    type="radio"
                    value="COD"
                    {...register('paymentMethod')}
                    className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold text-sm text-ink">
                      <Banknote size={16} className="text-amber-600" />
                      <span>Thanh toán khi nhận hàng (COD)</span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      Thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng khi nhận được nông sản.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Danh sách các mặt hàng theo từng Shop chuẩn sàn TMĐT */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <ShoppingBag size={20} className="text-emerald-600" />
                  Danh sách mặt hàng đặt mua ({totalItemsCount} sản phẩm)
                </h3>
                <span className="text-xs text-ink-muted">
                  Phân chia theo {checkoutShops.length} nhà vườn / đối tác
                </span>
              </div>

              {checkoutShops.map((shop) => {
                const shopPreview = previewMutation.data?.shopOrders?.find(
                  (so) => so.shopId === shop.shopId,
                )
                const shopGoodsTotal = shop.items.reduce(
                  (sum, it) => sum + it.unitPrice * it.quantity,
                  0,
                )
                const shopShippingFee = shopPreview?.shippingFee ?? 15000
                const shopFinalTotal =
                  shopPreview?.totalAmount ?? shopGoodsTotal + shopShippingFee

                return (
                  <div
                    key={shop.shopId}
                    className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden"
                  >
                    {/* Header Nhà vườn / Shop */}
                    <div className="bg-[#f8faf6] px-5 py-3 border-b border-line flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {shop.shopAvatar ? (
                            <img
                              src={shop.shopAvatar}
                              alt={shop.shopName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store size={16} />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-ink">{shop.shopName}</span>
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Nhà vườn đối tác
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-ink-muted">
                        {shop.items.length} mặt hàng
                      </span>
                    </div>

                    {/* Danh sách mặt hàng của Shop */}
                    <div className="divide-y divide-gray-100">
                      {shop.items.map((item) => (
                        <div
                          key={item.cartItemId}
                          className="p-4 flex items-center gap-4 hover:bg-stone-50/50 transition-colors"
                        >
                          {/* Ảnh sản phẩm */}
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 border border-line shrink-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.itemName || item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <ShoppingBag size={22} />
                              </div>
                            )}
                          </div>

                          {/* Chi tiết sản phẩm */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-ink line-clamp-1">
                              {item.itemName || item.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] text-ink-muted bg-stone-100 px-2 py-0.5 rounded-md font-medium">
                                {item.itemType === 'MYSTERY_BOX'
                                  ? 'Túi mù nông sản'
                                  : item.itemType === 'BUILD_COMBO'
                                    ? 'Combo nông sản'
                                    : 'Nông sản tuyển chọn'}
                              </span>
                            </div>
                          </div>

                          {/* Đơn giá & Số lượng */}
                          <div className="text-right shrink-0">
                            <div className="text-xs text-ink-muted">
                              {item.unitPrice.toLocaleString('vi-VN')} đ
                            </div>
                            <div className="text-xs font-semibold text-ink mt-0.5">
                              x{item.quantity}
                            </div>
                          </div>

                          {/* Thành tiền */}
                          <div className="text-right shrink-0 min-w-[95px]">
                            <span className="text-sm font-bold text-emerald-700">
                              {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Vận chuyển & Tạm tính của Shop */}
                    <div className="bg-[#fafbf9] px-5 py-3 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                      <div className="flex items-center gap-2 text-ink-muted">
                        <Truck size={15} className="text-emerald-600 shrink-0" />
                        <span>
                          Vận chuyển:{' '}
                          <strong className="text-ink font-medium">
                            Giao tiêu chuẩn (Xe lạnh bảo quản tươi)
                          </strong>
                        </span>
                        <span className="text-emerald-700 font-semibold ml-1">
                          +{shopShippingFee.toLocaleString('vi-VN')} đ
                        </span>
                        {shopPreview?.voucherDiscount && shopPreview.voucherDiscount > 0 ? (
                          <span className="text-emerald-700 font-bold ml-1">
                            · Giảm voucher: -{shopPreview.voucherDiscount.toLocaleString('vi-VN')} đ
                          </span>
                        ) : null}
                      </div>

                      {shopPreview?.voucherDiscountsDetail && Object.keys(shopPreview.voucherDiscountsDetail).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {Object.entries(shopPreview.voucherDiscountsDetail).map(([code, value]) => (
                            <span
                              key={`${shop.shopId}-${code}`}
                              className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                            >
                              {code}: -{Number(value || 0).toLocaleString('vi-VN')}đ
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 text-ink">
                        <span>Tạm tính shop:</span>
                        <strong className="text-sm font-bold text-emerald-700">
                          {shopFinalTotal.toLocaleString('vi-VN')} đ
                        </strong>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cột phải: Voucher & Tóm tắt chi phí & Submit */}
          <div className="lg:col-span-1 space-y-4 sticky top-20">
            {/* Box Voucher Shopee-style */}
            <div className="bg-white rounded-2xl border border-line p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket size={20} className="text-emerald-600" />
                  <h3 className="font-bold text-sm text-ink">CapNong Voucher</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(true)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-xl border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>{selectedVoucherCodes.length > 0 ? `${selectedVoucherCodes.length} mã đã chọn` : 'Chọn hoặc nhập mã'}</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              {/* Banner bấm vào mở modal Shopee voucher */}
              <div
                onClick={() => setIsVoucherModalOpen(true)}
                className="group flex items-center justify-between p-3 bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-transparent rounded-2xl border border-dashed border-emerald-300 hover:border-emerald-500 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    %
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink">
                      {selectedVoucherCodes.length > 0
                        ? `Đang áp dụng: ${selectedVoucherCodes.join(', ')}`
                        : 'Mã Giảm Giá & Freeship'}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium">
                      {myVouchers.length > 0
                        ? `Bạn có ${myVouchers.length} mã trong ví`
                        : 'Ví trống · Bấm để xem'}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
                  {selectedVoucherCodes.length > 0 ? 'Đổi mã' : 'Chọn'} <ChevronRight size={13} />
                </span>
              </div>

              {/* Input nhập mã nhanh */}
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập mã ưu đãi"
                  value={inputVoucherCode}
                  onChange={(e) => {
                    setInputVoucherCode(e.target.value.toUpperCase())
                    setVoucherError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleApplyVoucherInput()
                    }
                  }}
                  className="text-xs uppercase font-mono"
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleApplyVoucherInput}
                  disabled={!inputVoucherCode.trim()}
                  className="text-xs py-2 px-3.5 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer font-bold"
                >
                  Áp dụng
                </Button>
              </div>

              {voucherError && (
                <p className="text-xs text-red-500 font-medium">{voucherError}</p>
              )}

              {/* Các mã đang được áp dụng */}
              {selectedVoucherCodes.length > 0 && (
                <div className="pt-2 border-t border-line space-y-1.5">
                  <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                    Mã đang dùng:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedVoucherCodes.map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold"
                      >
                        <Tag size={12} className="text-emerald-600" />
                        {code}
                        <button
                          type="button"
                          onClick={() => handleRemoveVoucher(code)}
                          className="hover:text-red-500 ml-0.5 cursor-pointer"
                          title="Bỏ áp dụng"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-line p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-ink pb-3 border-b border-line">
                Chi tiết thanh toán
              </h3>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-ink-muted">
                  <span>Tiền hàng:</span>
                  <span className="font-semibold text-ink">
                    {goodsAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="flex justify-between text-ink-muted">
                  <span>Phí vận chuyển:</span>
                  <span className="font-semibold text-ink">
                    {previewMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin inline" />
                    ) : (
                      `${shippingFee.toLocaleString('vi-VN')} đ`
                    )}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Giảm giá voucher:</span>
                    <span className="font-semibold">-{discount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                {voucherBreakdown.length > 0 && (
                  <div className="pt-2 border-t border-line space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      Chi tiết mã giảm giá
                    </div>
                    {voucherBreakdown.map(([code, value]) => (
                      <div key={code} className="flex justify-between items-center gap-2 text-[11px] text-emerald-700">
                        <span className="font-semibold">{code}</span>
                        <span>-{Number(value || 0).toLocaleString('vi-VN')} đ</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-line flex justify-between items-baseline">
                <span className="font-bold text-ink">Tổng thanh toán:</span>
                <span className="text-xl font-black text-emerald-700">
                  {finalTotal.toLocaleString('vi-VN')} đ
                </span>
              </div>

              {orderSubmitError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex flex-col gap-2 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={17} className="shrink-0 mt-0.5 text-rose-600" />
                    <div className="flex-1">
                      <span className="font-bold block mb-0.5 text-rose-900">Không thể đặt hàng:</span>
                      <span className="leading-relaxed line-clamp-3">{orderSubmitError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOrderSubmitError(null)}
                      className="text-rose-400 hover:text-rose-700 p-0.5 rounded-md transition-colors cursor-pointer"
                      title="Đóng thông báo"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  {isStockShortageError({ message: orderSubmitError }) && stockErrorModal.items.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setStockErrorModal((prev) => ({ ...prev, isOpen: true }))}
                      className="self-start text-[11px] font-bold text-rose-700 hover:text-rose-800 underline flex items-center gap-1 cursor-pointer"
                    >
                      <PackageX size={13} />
                      Xem danh sách {stockErrorModal.items.length} mặt hàng cần điều chỉnh
                    </button>
                  )}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={createOrderMutation.isPending || createPaymentMutation.isPending}
                className="w-full justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
              >
                {createOrderMutation.isPending || createPaymentMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang xử lý đặt hàng...
                  </>
                ) : (
                  <>
                    {selectedPaymentMethod === 'PAYOS' ? 'Thanh toán qua PayOS' : 'Đặt hàng (COD)'}
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2 text-[11px] text-gray-500 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>Nông sản chất lượng, cam kết hoàn tiền 100% nếu phát hiện dập nát, hư hỏng.</span>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Modal hiển thị mã VietQR nếu chọn PayOS */}
      {qrModalData && (
        <PaymentQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          onConfirmed={handleQrModalConfirmed}
          qrCodeUrl={qrModalData.qrCodeUrl}
          checkoutUrl={qrModalData.checkoutUrl}
          amount={qrModalData.amount}
          orderCode={qrModalData.payosOrderCode}
        />
      )}

      {/* Modal Sổ địa chỉ nhận hàng (Chuẩn Shopee) */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div>
                <h3 className="font-bold text-base text-ink">
                  {editingAddress
                    ? 'Chỉnh sửa địa chỉ nhận hàng'
                    : isAddingNewAddress
                      ? 'Thêm địa chỉ nhận hàng mới'
                      : 'Địa chỉ nhận hàng của tôi'}
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  {editingAddress || isAddingNewAddress
                    ? 'Nhập thông tin người nhận và địa chỉ chi tiết'
                    : `Lưu trữ tối đa ${MAX_SAVED_ADDRESSES} địa chỉ (hiện có: ${savedAddresses.length}/${MAX_SAVED_ADDRESSES})`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddressModalOpen(false)
                  setEditingAddress(null)
                  setIsAddingNewAddress(false)
                }}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {addressSaveError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{addressSaveError}</span>
              </div>
            )}

            {/* Chế độ SỬA hoặc THÊM MỚI địa chỉ */}
            {editingAddress || isAddingNewAddress ? (
              <form
                onSubmit={editingAddress ? handleSaveEditAddress : handleSaveNewAddress}
                className="space-y-3.5 pt-1"
              >
                {/* Chọn nhãn */}
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                    Loại địa chỉ:
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {QUICK_LABELS.map((lbl) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setFormLabel(lbl)}
                        className={`text-xs px-3 py-1 rounded-xl border transition-all cursor-pointer ${formLabel === lbl
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                            : 'bg-white text-stone-600 border-gray-200 hover:border-emerald-300'
                          }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1">
                      Tên người nhận <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Họ và tên"
                      value={formRecipientName}
                      onChange={(e) => setFormRecipientName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Số điện thoại"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-ink-muted">
                      Địa chỉ chi tiết <span className="text-red-500">*</span>
                    </label>
                    {isSearchingModalSuggestions && (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-normal">
                        <Loader2 size={12} className="animate-spin" />
                        Đang tìm gợi ý...
                      </span>
                    )}
                  </div>
                  <Input
                    placeholder="Số nhà, đường, phường, quận, tỉnh/TP"
                    value={formAddress}
                    onChange={(e) => {
                      setFormAddress(e.target.value)
                      setShowModalSuggestions(true)
                    }}
                    onFocus={() => {
                      if (modalSuggestions.length > 0) setShowModalSuggestions(true)
                    }}
                    autoComplete="off"
                    required
                  />

                  {/* Dropdown gợi ý địa chỉ trong Modal */}
                  {showModalSuggestions && modalSuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-emerald-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-gray-100 ring-1 ring-black/5 animate-in fade-in duration-150">
                      <div className="p-2 bg-emerald-50/80 text-[11px] font-bold text-emerald-800 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xs">
                        <span className="flex items-center gap-1.5">
                          <span>📍</span>
                          <span>Gợi ý địa chỉ từ Google Maps</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowModalSuggestions(false)}
                          className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      {modalSuggestions.map((s, idx) => (
                        <div
                          key={s.placeId || idx}
                          onClick={() => handleSelectModalSuggestion(s)}
                          className="p-2.5 flex items-start gap-2.5 hover:bg-emerald-50/70 cursor-pointer text-xs text-ink transition-colors"
                        >
                          <MapPin size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed font-medium">{s.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={formIsDefault}
                    onChange={(e) => setFormIsDefault(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-stone-700">
                    Đặt làm địa chỉ nhận hàng mặc định
                  </span>
                </label>

                <div className="flex justify-end gap-2 pt-3 border-t border-line">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingAddress(null)
                      setIsAddingNewAddress(false)
                    }}
                    className="text-xs py-2 px-4 cursor-pointer"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSavingAddressApi}
                    className="text-xs py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  >
                    {isSavingAddressApi ? (
                      <>
                        <Loader2 size={13} className="animate-spin inline mr-1" />
                        Đang lưu...
                      </>
                    ) : editingAddress ? (
                      'Cập nhật địa chỉ'
                    ) : (
                      'Thêm địa chỉ'
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              /* Danh sách địa chỉ đã lưu */
              <>
                <div className="space-y-3">
                  {isLoadingAddresses ? (
                    <div className="py-8 text-center text-xs text-ink-muted space-y-2">
                      <Loader2 size={24} className="animate-spin text-emerald-600 mx-auto" />
                      <p>Đang tải danh sách địa chỉ...</p>
                    </div>
                  ) : savedAddresses.length === 0 ? (
                    <div className="py-8 text-center text-xs text-ink-muted border border-dashed border-gray-200 rounded-xl p-6">
                      <MapPin size={28} className="text-gray-300 mx-auto mb-2" />
                      <p className="font-semibold text-stone-700">Chưa có địa chỉ nào được lưu</p>
                      <p className="mt-1">Thêm địa chỉ để tiện đặt hàng nhanh chóng cho những lần sau.</p>
                    </div>
                  ) : (
                    savedAddresses.map((addr) => {
                      const isSelected = addr.id === selectedAddressId
                      return (
                        <div
                          key={addr.id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${isSelected
                              ? 'border-emerald-600 bg-emerald-50/30 shadow-xs'
                              : 'border-line hover:border-gray-300'
                            }`}
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <input
                              type="radio"
                              checked={isSelected}
                              onChange={() => handleSelectSavedAddress(addr)}
                              className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-ink">{addr.recipientName}</span>
                                <span className="text-xs text-ink-muted">({addr.phone})</span>
                                {addr.label && (
                                  <span className="text-[10px] bg-stone-100 text-stone-700 font-bold px-2 py-0.5 rounded-full border border-stone-200">
                                    {addr.label}
                                  </span>
                                )}
                                {addr.isDefault && (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                    Mặc định
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                                {addr.address}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            {!addr.isDefault && (
                              <button
                                type="button"
                                onClick={(e) => handleSetDefaultAddress(addr.id, e)}
                                title="Thiết lập làm mặc định"
                                className="text-[11px] text-stone-500 hover:text-emerald-700 font-medium px-2 py-0.5 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                              >
                                Mặc định
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditAddress(addr, e)}
                              title="Sửa địa chỉ này"
                              className="text-stone-400 hover:text-emerald-600 p-1.5 transition-colors cursor-pointer rounded hover:bg-stone-100"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSavedAddress(addr.id, e)}
                              title="Xóa địa chỉ"
                              className="text-stone-400 hover:text-red-500 p-1.5 transition-colors cursor-pointer rounded hover:bg-stone-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Nút thêm địa chỉ mới */}
                {savedAddresses.length < MAX_SAVED_ADDRESSES ? (
                  <button
                    type="button"
                    onClick={handleOpenAddNewAddress}
                    className="w-full py-2.5 border-2 border-dashed border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 hover:bg-emerald-50/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>
                      + Thêm địa chỉ mới ({savedAddresses.length}/{MAX_SAVED_ADDRESSES})
                    </span>
                  </button>
                ) : (
                  <div className="p-2.5 bg-amber-50 text-amber-800 text-[11px] rounded-xl border border-amber-200 text-center">
                    Bạn đã lưu tối đa {MAX_SAVED_ADDRESSES} địa chỉ. Vui lòng xóa bớt địa chỉ cũ để thêm mới.
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2 border-t border-line">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setIsAddressModalOpen(false)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-5 cursor-pointer"
                  >
                    Hoàn thành
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Chọn Voucher Shopee-style */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Ticket size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-ink">CapNong Voucher</h3>
                  <p className="text-[11px] text-ink-muted">Chọn mã giảm giá & miễn phí vận chuyển</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Input nhập mã voucher ngay trên đầu Modal */}
            <div className="p-4 bg-stone-50 border-b border-line">
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập mã CapNong Voucher..."
                  value={inputVoucherCode}
                  onChange={(e) => {
                    setInputVoucherCode(e.target.value.toUpperCase())
                    setVoucherError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleApplyVoucherInput()
                    }
                  }}
                  className="text-xs uppercase bg-white font-mono"
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleApplyVoucherInput}
                  disabled={!inputVoucherCode.trim()}
                  className="text-xs py-2 px-4 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer font-bold"
                >
                  Áp dụng
                </Button>
              </div>
              {voucherError && (
                <p className="text-[11px] text-red-500 font-medium mt-1.5">{voucherError}</p>
              )}
            </div>

            {/* Danh sách Voucher theo 2 phân nhóm: Freeship & Giảm giá */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {myVouchers.length === 0 ? (
                <div className="text-center py-12 text-ink-muted text-xs space-y-2.5">
                  <Ticket size={40} className="mx-auto text-gray-300" />
                  <p className="font-bold text-stone-700 text-sm">Ví voucher của bạn đang trống</p>
                  <p className="max-w-xs mx-auto text-gray-500">
                    Bạn chưa sở hữu mã giảm giá nào. Hãy ghé thăm trang Cửa hàng để bấm "Lưu Voucher" trước khi quay lại áp dụng thanh toán.
                  </p>
                  {checkoutShops.length > 0 && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsVoucherModalOpen(false)
                          navigate(`/cua-hang/${checkoutShops[0].shopId}`)
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
                      >
                        <Store size={14} />
                        <span>Ghé gian hàng {checkoutShops[0].shopName || 'Shop'} nhận voucher</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Helper phân nhóm & format date chuẩn Shopee */}
                  {(() => {
                    const formatExpiryDate = (val: any) => {
                      if (!val) return '—'
                      if (Array.isArray(val)) {
                        const arr = val as unknown as number[]
                        const d = new Date(arr[0], (arr[1] || 1) - 1, arr[2] || 1, arr[3] || 0, arr[4] || 0)
                        return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN')
                      }
                      const d = new Date(val)
                      return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN')
                    }

                    const isFreeshipVoucher = (v: VoucherResponse) =>
                      v.voucherTarget === 'SHIPPING' ||
                      v.voucherType === 'FREE_SHIPPING' ||
                      Boolean(v.voucherCode?.toUpperCase().includes('FREESHIP'))

                    const freeshipList = myVouchers.filter(isFreeshipVoucher)
                    const discountList = myVouchers.filter((v) => !isFreeshipVoucher(v))

                    return (
                      <>
                        {/* Nhóm 1: Mã Miễn Phí Vận Chuyển (Freeship) */}
                        {freeshipList.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                                <Truck size={14} className="text-blue-600" />
                                Mã Miễn Phí Vận Chuyển
                              </h4>
                              <span className="text-[10px] text-ink-muted">Tối đa 1 mã</span>
                            </div>

                            <div className="space-y-2.5">
                              {freeshipList.map((vc) => {
                                const isSelected = selectedVoucherCodes.includes(vc.voucherCode.toUpperCase())
                                const isExpired = (() => {
                                  if (!vc.expiryDate) return false
                                  if (Array.isArray(vc.expiryDate)) {
                                    const arr = vc.expiryDate as unknown as number[]
                                    const d = new Date(arr[0], (arr[1] || 1) - 1, arr[2] || 1, arr[3] || 0, arr[4] || 0)
                                    return !isNaN(d.getTime()) && d < new Date()
                                  }
                                  const d = new Date(vc.expiryDate)
                                  return !isNaN(d.getTime()) && d < new Date()
                                })()
                                const isEligible = getVoucherEligibility(vc)
                                const isPlatform =
                                  vc.voucherScope === 'PLATFORM' ||
                                  vc.voucherScope === 'SYSTEM' ||
                                  vc.voucherScope === 'WELCOME' ||
                                  vc.creatorRole === 'ADMIN'
                                const isCollected = Boolean(vc.isCollected)
                                const isOutOfStock = !isCollected && vc.claimLimit != null && (vc.claimedCount || 0) >= vc.claimLimit
                                const isSaving = savingVoucherCode === vc.voucherCode.toUpperCase()

                                return (
                                  <div
                                    key={vc.voucherId || vc.voucherCode}
                                    className={`p-3.5 rounded-2xl border-2 transition-all flex items-start justify-between gap-3 ${
                                      isSelected
                                        ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                                        : isExpired || (!isCollected && isOutOfStock) || (isCollected && !isEligible)
                                          ? 'border-gray-200 bg-gray-50 opacity-60'
                                          : 'border-line hover:border-blue-300 bg-white'
                                    }`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="font-black text-sm text-blue-800 font-mono tracking-wide">
                                          {vc.voucherCode}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                          Freeship
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                                          {isPlatform ? 'Toàn sàn' : 'Shop'}
                                        </span>
                                        {isCollected ? (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                                            <Check size={10} /> Đã lưu ví
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                            Chưa lưu ví
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs font-bold text-ink">
                                        {vc.voucherType === 'PERCENTAGE'
                                          ? `Giảm ${vc.discountValue}% phí vận chuyển`
                                          : `Miễn phí vận chuyển ${Number(vc.discountValue).toLocaleString('vi-VN')}đ`}
                                      </p>
                                      <p className="text-[11px] text-ink-muted mt-0.5">
                                        Đơn tối thiểu {Number(vc.minOrderValue || 0).toLocaleString('vi-VN')}đ
                                      </p>
                                      {isCollected && !isExpired && !isEligible && (
                                        <p className="text-[10px] text-amber-600 mt-1 font-medium">
                                          {!isPlatform && !checkoutShops.some((s) => Number(s.shopId) === Number(vc.shopId))
                                            ? 'Chỉ áp dụng cho đơn hàng tại Cửa hàng phát hành'
                                            : `Chưa đạt giá trị đơn tối thiểu (${Number(vc.minOrderValue || 0).toLocaleString('vi-VN')}đ)`}
                                        </p>
                                      )}
                                      {!isCollected && isOutOfStock && (
                                        <p className="text-[10px] text-rose-600 mt-1 font-medium">
                                          Mã voucher này đã được thu thập hết lượt
                                        </p>
                                      )}
                                      {vc.expiryDate && (
                                        <p className="text-[10px] text-gray-400 mt-1">
                                          HSD: {formatExpiryDate(vc.expiryDate)}
                                        </p>
                                      )}
                                    </div>

                                    {!isCollected ? (
                                      isOutOfStock ? (
                                        <button
                                          type="button"
                                          disabled
                                          className="text-xs px-3.5 py-1.5 rounded-xl font-bold bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shrink-0"
                                        >
                                          Hết lượt
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled={isSaving}
                                          onClick={() => handleCollectVoucherInModal(vc)}
                                          className="text-xs px-3.5 py-1.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0 transition-all"
                                        >
                                          {isSaving && <Loader2 size={12} className="animate-spin" />}
                                          <span>Lưu mã</span>
                                        </button>
                                      )
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={isExpired || !isEligible}
                                        onClick={() => handleToggleVoucherCode(vc.voucherCode)}
                                        className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                                          isSelected
                                            ? 'bg-blue-600 text-white shadow-xs cursor-pointer'
                                            : isExpired || !isEligible
                                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                              : 'bg-white border border-blue-600 text-blue-700 hover:bg-blue-50 cursor-pointer'
                                        }`}
                                      >
                                        {isSelected ? 'Đang dùng' : isExpired ? 'Hết hạn' : isEligible ? 'Áp dụng' : 'Không đủ điều kiện'}
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Nhóm 2: Mã Giảm Giá Sàn & Cửa Hàng (Discount Vouchers) */}
                        {discountList.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                                <Tag size={14} className="text-emerald-600" />
                                Mã Giảm Giá Sàn & Cửa Hàng
                              </h4>
                              <span className="text-[10px] text-ink-muted">Tối đa 1 mã sàn + 1 mã shop</span>
                            </div>

                            <div className="space-y-2.5">
                              {discountList.map((vc) => {
                                const isSelected = selectedVoucherCodes.includes(vc.voucherCode.toUpperCase())
                                const isExpired = (() => {
                                  if (!vc.expiryDate) return false
                                  if (Array.isArray(vc.expiryDate)) {
                                    const arr = vc.expiryDate as unknown as number[]
                                    const d = new Date(arr[0], (arr[1] || 1) - 1, arr[2] || 1, arr[3] || 0, arr[4] || 0)
                                    return !isNaN(d.getTime()) && d < new Date()
                                  }
                                  const d = new Date(vc.expiryDate)
                                  return !isNaN(d.getTime()) && d < new Date()
                                })()
                                const isEligible = getVoucherEligibility(vc)
                                const isPercent = vc.voucherType === 'PERCENTAGE'
                                const isPlatform =
                                  vc.voucherScope === 'PLATFORM' ||
                                  vc.voucherScope === 'SYSTEM' ||
                                  vc.voucherScope === 'WELCOME' ||
                                  vc.creatorRole === 'ADMIN'
                                const isCollected = Boolean(vc.isCollected)
                                const isOutOfStock = !isCollected && vc.claimLimit != null && (vc.claimedCount || 0) >= vc.claimLimit
                                const isSaving = savingVoucherCode === vc.voucherCode.toUpperCase()

                                return (
                                  <div
                                    key={vc.voucherId || vc.voucherCode}
                                    className={`p-3.5 rounded-2xl border-2 transition-all flex items-start justify-between gap-3 ${
                                      isSelected
                                        ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                                        : isExpired || (!isCollected && isOutOfStock) || (isCollected && !isEligible)
                                          ? 'border-gray-200 bg-gray-50 opacity-60'
                                          : 'border-line hover:border-emerald-200 bg-white'
                                    }`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="font-black text-sm text-emerald-800 font-mono tracking-wide">
                                          {vc.voucherCode}
                                        </span>
                                        <span
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            isPlatform
                                              ? 'bg-purple-100 text-purple-700'
                                              : 'bg-amber-100 text-amber-800'
                                          }`}
                                        >
                                          {isPlatform ? 'Toàn sàn' : 'Voucher Shop'}
                                        </span>
                                        {isCollected ? (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                                            <Check size={10} /> Đã lưu ví
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                            Chưa lưu ví
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs font-bold text-ink">
                                        {isPercent
                                          ? `Giảm ${vc.discountValue}%`
                                          : `Giảm ${Number(vc.discountValue).toLocaleString('vi-VN')}đ`}
                                        {vc.maxDiscount ? ` (Tối đa ${Number(vc.maxDiscount).toLocaleString('vi-VN')}đ)` : ''}
                                      </p>
                                      <p className="text-[11px] text-ink-muted mt-0.5">
                                        Đơn tối thiểu {Number(vc.minOrderValue || 0).toLocaleString('vi-VN')}đ
                                      </p>
                                      {isCollected && !isExpired && !isEligible && (
                                        <p className="text-[10px] text-amber-600 mt-1 font-medium">
                                          {!isPlatform && !checkoutShops.some((s) => Number(s.shopId) === Number(vc.shopId))
                                            ? 'Chỉ áp dụng cho đơn hàng tại Cửa hàng phát hành'
                                            : `Chưa đạt giá trị đơn tối thiểu (${Number(vc.minOrderValue || 0).toLocaleString('vi-VN')}đ)`}
                                        </p>
                                      )}
                                      {!isCollected && isOutOfStock && (
                                        <p className="text-[10px] text-rose-600 mt-1 font-medium">
                                          Mã voucher này đã được thu thập hết lượt
                                        </p>
                                      )}
                                      {vc.expiryDate && (
                                        <p className="text-[10px] text-gray-400 mt-1">
                                          HSD: {formatExpiryDate(vc.expiryDate)}
                                        </p>
                                      )}
                                    </div>

                                    {!isCollected ? (
                                      isOutOfStock ? (
                                        <button
                                          type="button"
                                          disabled
                                          className="text-xs px-3.5 py-1.5 rounded-xl font-bold bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shrink-0"
                                        >
                                          Hết lượt
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled={isSaving}
                                          onClick={() => handleCollectVoucherInModal(vc)}
                                          className="text-xs px-3.5 py-1.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0 transition-all"
                                        >
                                          {isSaving && <Loader2 size={12} className="animate-spin" />}
                                          <span>Lưu mã</span>
                                        </button>
                                      )
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={isExpired || !isEligible}
                                        onClick={() => handleToggleVoucherCode(vc.voucherCode)}
                                        className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                                          isSelected
                                            ? 'bg-emerald-600 text-white shadow-xs cursor-pointer'
                                            : isExpired || !isEligible
                                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                              : 'bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 cursor-pointer'
                                        }`}
                                      >
                                        {isSelected ? 'Đang dùng' : isExpired ? 'Hết hạn' : isEligible ? 'Áp dụng' : 'Không đủ điều kiện'}
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-line bg-gray-50 flex items-center justify-between">
              <span className="text-xs font-bold text-ink">
                {selectedVoucherCodes.length > 0
                  ? `Đã chọn ${selectedVoucherCodes.length} mã ưu đãi`
                  : 'Chưa chọn mã nào'}
              </span>
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsVoucherModalOpen(false)}
                className="text-xs py-2 px-6 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer font-bold rounded-xl"
              >
                Đồng ý
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cảnh Báo Số Lượng Trong Kho Không Đủ (Tổng hợp Product, Mystery Box, Build Combo) */}
      {stockErrorModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-rose-100 overflow-hidden relative animate-in zoom-in-95 duration-200 text-left">
            {/* Header banner với gradient sang trọng */}
            <div className="bg-gradient-to-br from-rose-50 via-red-50 to-amber-50 p-6 pb-4 border-b border-rose-100/60 text-center relative">
              <button
                type="button"
                onClick={() => setStockErrorModal((prev) => ({ ...prev, isOpen: false }))}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white/80 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X size={20} />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-white text-rose-600 flex items-center justify-center mx-auto mb-3 border border-rose-200 shadow-xs">
                <PackageX size={30} className="animate-pulse" />
              </div>

              <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                {stockErrorModal.title}
              </h3>

              {stockErrorModal.items.length > 0 ? (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  <AlertTriangle size={13} className="text-rose-600" />
                  <span>Cần điều chỉnh {stockErrorModal.items.length} mặt hàng trong giỏ</span>
                </div>
              ) : (
                <p className="text-xs text-amber-700 font-semibold mt-1">
                  📦 Vui lòng kiểm tra lại số lượng các mặt hàng trong đơn
                </p>
              )}
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-3.5">
              <p className="text-xs text-gray-600 leading-relaxed text-center sm:text-left">
                Các mặt hàng sau đây hiện không còn đủ số lượng tồn kho do vừa có khách hàng khác đặt mua hoặc người bán đã cập nhật lại kho hàng:
              </p>

              {/* Danh sách các mặt hàng bị thiếu */}
              {stockErrorModal.items.length > 0 ? (
                <div className="max-h-72 overflow-y-auto pr-1 space-y-2.5">
                  {stockErrorModal.items.map((item, idx) => {
                    const isOutOfStock = item.availableQuantity === 0
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50/90 rounded-2xl border border-gray-200/80 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                      >
                        {/* Thumbnail / Icon */}
                        <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.itemName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none'
                              }}
                            />
                          ) : item.itemType === 'MYSTERY_BOX' ? (
                            <Gift size={24} className="text-purple-600" />
                          ) : item.itemType === 'BUILD_COMBO' ? (
                            <Package size={24} className="text-amber-600" />
                          ) : (
                            <ShoppingBag size={24} className="text-emerald-600" />
                          )}
                        </div>

                        {/* Chi tiết mặt hàng */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.itemType === 'MYSTERY_BOX'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : item.itemType === 'BUILD_COMBO'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                            >
                              {item.itemType === 'MYSTERY_BOX' && '🎁 Hộp bí ẩn'}
                              {item.itemType === 'BUILD_COMBO' && '🍱 Gói Combo'}
                              {item.itemType === 'PRODUCT' && '🌱 Nông sản'}
                              {item.itemType === 'GENERAL' && '📦 Mặt hàng'}
                            </span>
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate" title={item.itemName}>
                            {item.itemName}
                          </h4>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
                            {item.requestedQuantity !== undefined && (
                              <span className="text-[11px] font-medium text-gray-600 bg-gray-200/70 px-2 py-0.5 rounded-md">
                                Bạn đặt: <strong className="text-gray-900">{item.requestedQuantity}</strong>
                              </span>
                            )}
                            {item.availableQuantity !== undefined && (
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${isOutOfStock
                                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border-amber-300'
                                  }`}
                              >
                                {isOutOfStock ? 'Hết hàng (0)' : `Kho chỉ còn: ${item.availableQuantity}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-left">
                  <div className="flex gap-2.5 items-start">
                    <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm font-semibold text-rose-800 leading-relaxed whitespace-pre-line">
                      {stockErrorModal.message}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-gray-500 leading-relaxed text-center">
                Vui lòng quay lại giỏ hàng để cập nhật số lượng hoặc xóa bỏ những mặt hàng đã hết để tiếp tục thanh toán nhé!
              </p>
            </div>

            {/* Footer buttons */}
            <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStockErrorModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 justify-center py-2.5 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold cursor-pointer text-xs"
              >
                Đóng & xem lại
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setStockErrorModal((prev) => ({ ...prev, isOpen: false }))
                  navigate('/cart')
                }}
                className="flex-1 justify-center py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-xs cursor-pointer text-xs"
              >
                <ShoppingCart size={15} />
                Về giỏ hàng cập nhật
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


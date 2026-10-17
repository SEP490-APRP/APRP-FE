import { useState, useEffect, useMemo, useRef } from 'react'
import {
  useMyCart,
  useUpdateCartItem,
  useRemoveCartItems,
} from './useCartQueries'
import type { CartItemResponse } from '@/types/cart.types'
import { useUiStore } from '@/stores'

export function useCartOperations() {
  const { data: cart, isLoading, isError, refetch } = useMyCart()
  const updateMutation = useUpdateCartItem()
  const removeMutation = useRemoveCartItems()

  // Danh sách các cartItemId được chọn
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set())
  // Cờ theo dõi khởi tạo lần đầu để không ghi đè lựa chọn bỏ tick của user
  const isInitializedRef = useRef(false)
  // State xác nhận xóa sản phẩm
  const [deletingItem, setDeletingItem] = useState<CartItemResponse | null>(null)
  // State lưu số lượng đang chỉnh sửa trực tiếp qua ô input
  const [editingQuantities, setEditingQuantities] = useState<Record<number, string>>({})

  // Kiểm tra xem một item cụ thể có đang trong quá trình cập nhật/xóa hay không
  const isItemUpdating = (cartItemId: number) =>
    (updateMutation.isPending && (updateMutation.variables as any)?.cartItemId === cartItemId) ||
    (removeMutation.isPending && (removeMutation.variables as any)?.cartItemIds?.includes(cartItemId))

  // Giữ nguyên các lựa chọn checkbox của người dùng khi cập nhật số lượng
  useEffect(() => {
    if (!cart?.shopCarts) return

    const currentAvailableIds = new Set<number>()
    cart.shopCarts.forEach((shop) => {
      shop.items.forEach((item) => {
        const isAvail = item.available !== false && (item as any).isAvailable !== false
        if (isAvail) {
          currentAvailableIds.add(item.cartItemId)
        }
      })
    })

    if (!isInitializedRef.current) {
      if (currentAvailableIds.size > 0) {
        setSelectedItemIds(currentAvailableIds)
        isInitializedRef.current = true
      }
    } else {
      // Bảo toàn lựa chọn thủ công của người dùng, chỉ loại bỏ các ID không còn tồn tại hoặc hết hàng
      setSelectedItemIds((prev) => {
        const next = new Set<number>()
        prev.forEach((id) => {
          if (currentAvailableIds.has(id)) {
            next.add(id)
          }
        })
        return next
      })
    }
  }, [cart])

  const toggleSelect = (cartItemId: number) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev)
      if (next.has(cartItemId)) next.delete(cartItemId)
      else next.add(cartItemId)
      return next
    })
  }

  const toggleSelectShop = (shopItems: CartItemResponse[]) => {
    const availableItems = shopItems.filter(
      (i) => i.available !== false && (i as any).isAvailable !== false,
    )
    const isAllSelected =
      availableItems.length > 0 &&
      availableItems.every((i) => selectedItemIds.has(i.cartItemId))

    setSelectedItemIds((prev) => {
      const next = new Set(prev)
      availableItems.forEach((i) => {
        if (isAllSelected) next.delete(i.cartItemId)
        else next.add(i.cartItemId)
      })
      return next
    })
  }

  const toggleSelectAll = () => {
    if (!cart?.shopCarts) return

    const availableIds: number[] = []
    cart.shopCarts.forEach((shop) => {
      shop.items.forEach((item) => {
        const isAvail = item.available !== false && (item as any).isAvailable !== false
        if (isAvail) {
          availableIds.push(item.cartItemId)
        }
      })
    })

    const isAllSelected =
      availableIds.length > 0 && availableIds.every((id) => selectedItemIds.has(id))

    setSelectedItemIds((prev) => {
      const next = new Set(prev)
      if (isAllSelected) {
        availableIds.forEach((id) => next.delete(id))
      } else {
        availableIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const handleQuantityChange = (item: CartItemResponse, delta: number) => {
    const newQty = item.quantity + delta
    if (newQty <= 0) {
      setDeletingItem(item)
      return
    }
    const maxStock = item.stockQuantity ?? 999
    if (newQty > maxStock) {
      useUiStore.getState().showToast(`Kho chỉ còn ${maxStock} sản phẩm cho món này.`)
      return
    }
    updateMutation.mutate({ cartItemId: item.cartItemId, quantity: newQty })
  }

  const handleDirectQuantityChange = (item: CartItemResponse, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '')
    setEditingQuantities((prev) => ({ ...prev, [item.cartItemId]: cleaned }))
  }

  const handleCommitQuantity = (item: CartItemResponse) => {
    const rawVal = editingQuantities[item.cartItemId]
    if (rawVal === undefined) return
    const num = parseInt(rawVal, 10)
    setEditingQuantities((prev) => {
      const next = { ...prev }
      delete next[item.cartItemId]
      return next
    })

    if (isNaN(num) || num <= 0) {
      setDeletingItem(item)
      return
    }

    const maxStock = item.stockQuantity ?? 999
    const finalQty = Math.min(num, maxStock)
    if (num > maxStock) {
      useUiStore.getState().showToast(`Kho chỉ còn ${maxStock} sản phẩm cho món này.`)
    }
    if (finalQty !== item.quantity) {
      updateMutation.mutate({ cartItemId: item.cartItemId, quantity: finalQty })
    }
  }

  const confirmDeleteItem = () => {
    if (!deletingItem) return
    const id = deletingItem.cartItemId
    removeMutation.mutate(
      { cartItemIds: [id] },
      {
        onSuccess: () => {
          setSelectedItemIds((prev) => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
          setDeletingItem(null)
        },
      },
    )
  }

  const handleRemove = (item: CartItemResponse) => {
    setDeletingItem(item)
  }

  // Tính tổng tiền & số lượng cho DB cart
  const { totalAmount, totalSelectedCount, totalAllCount, isAllMasterSelected } = useMemo(() => {
    if (!cart?.shopCarts) {
      return { totalAmount: 0, totalSelectedCount: 0, totalAllCount: 0, isAllMasterSelected: false }
    }
    let sum = 0
    let selCount = 0
    let allCount = 0
    let availCount = 0
    let availSelectedCount = 0

    cart.shopCarts.forEach((shop) => {
      shop.items.forEach((item) => {
        allCount += item.quantity
        const isAvail = item.available !== false && (item as any).isAvailable !== false
        if (isAvail) {
          availCount++
          if (selectedItemIds.has(item.cartItemId)) {
            availSelectedCount++
          }
        }
        if (selectedItemIds.has(item.cartItemId)) {
          sum += item.unitPrice * item.quantity
          selCount += item.quantity
        }
      })
    })

    const allMaster = availCount > 0 && availSelectedCount === availCount

    return {
      totalAmount: sum,
      totalSelectedCount: selCount,
      totalAllCount: allCount,
      isAllMasterSelected: allMaster,
    }
  }, [cart, selectedItemIds])

  return {
    cart,
    isLoading,
    isError,
    refetch,
    selectedItemIds,
    setSelectedItemIds,
    toggleSelect,
    toggleSelectShop,
    toggleSelectAll,
    isAllMasterSelected,
    totalAmount,
    totalSelectedCount,
    totalAllCount,
    editingQuantities,
    isItemUpdating,
    handleQuantityChange,
    handleDirectQuantityChange,
    handleCommitQuantity,
    handleRemove,
    deletingItem,
    setDeletingItem,
    confirmDeleteItem,
    isRemoving: removeMutation.isPending,
    isUpdating: updateMutation.isPending,
  }
}

import React, { createContext, useContext } from 'react'
import { create } from 'zustand'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, Trash2, X } from 'lucide-react'

export type PopupType = 'info' | 'success' | 'warning' | 'error'

export interface AlertOptions {
  id: string
  title: string
  message: string
  type: PopupType
  resolve: () => void
}

export interface ConfirmCustomOptions {
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
}

export interface ConfirmOptions {
  id: string
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  resolve: (value: boolean) => void
}

interface PopupStoreState {
  alerts: AlertOptions[]
  confirms: ConfirmOptions[]
  showAlert: (title: string, message: string, type: PopupType) => Promise<void>
  showConfirm: (title: string, message: string, options?: ConfirmCustomOptions) => Promise<boolean>
  closeAlert: (id: string) => void
  resolveConfirm: (id: string, result: boolean) => void
}

export const usePopupStore = create<PopupStoreState>((set) => ({
  alerts: [],
  confirms: [],

  showAlert: (title, message, type) => {
    return new Promise<void>((resolve) => {
      const id = Math.random().toString(36).substring(7)
      set((state) => ({
        alerts: [...state.alerts, { id, title, message, type, resolve }],
      }))
    })
  },

  showConfirm: (title, message, options) => {
    return new Promise<boolean>((resolve) => {
      const id = Math.random().toString(36).substring(7)
      set((state) => ({
        confirms: [
          ...state.confirms,
          {
            id,
            title,
            message,
            confirmText: options?.confirmText,
            cancelText: options?.cancelText,
            isDestructive: options?.isDestructive,
            resolve,
          },
        ],
      }))
    })
  },

  closeAlert: (id) => {
    set((state) => {
      const target = state.alerts.find((a) => a.id === id)
      target?.resolve()
      return { alerts: state.alerts.filter((a) => a.id !== id) }
    })
  },

  resolveConfirm: (id, result) => {
    set((state) => {
      const target = state.confirms.find((c) => c.id === id)
      target?.resolve(result)
      return { confirms: state.confirms.filter((c) => c.id !== id) }
    })
  },
}))

export const globalShowAlert = (
  messageOrTitle: string,
  titleOrType?: string,
  typeOrEmpty: PopupType = 'info',
): Promise<void> => {
  let title = titleOrType || 'Thông báo'
  let message = messageOrTitle
  let type: PopupType = typeOrEmpty

  if (
    titleOrType === 'success' ||
    titleOrType === 'error' ||
    titleOrType === 'warning' ||
    titleOrType === 'info'
  ) {
    type = titleOrType as PopupType
    title = 'Thông báo'
  }

  return usePopupStore.getState().showAlert(title, message, type)
}

export const globalShowConfirm = (
  titleOrMessage: string,
  messageOrOptions?: string | ConfirmCustomOptions,
  customOptions?: ConfirmCustomOptions,
): Promise<boolean> => {
  let title = 'Xác nhận'
  let desc = ''
  let options: ConfirmCustomOptions | undefined = customOptions

  if (typeof messageOrOptions === 'string') {
    title = titleOrMessage
    desc = messageOrOptions
  } else if (typeof messageOrOptions === 'object' && messageOrOptions !== null) {
    desc = titleOrMessage
    options = messageOrOptions
  } else {
    desc = titleOrMessage
  }

  return usePopupStore.getState().showConfirm(title, desc, options)
}

const PopupContext = createContext({})

export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const alerts = usePopupStore((s) => s.alerts)
  const confirms = usePopupStore((s) => s.confirms)
  const closeAlert = usePopupStore((s) => s.closeAlert)
  const resolveConfirm = usePopupStore((s) => s.resolveConfirm)

  return (
    <PopupContext.Provider value={{}}>
      {children}

      {/* Global Alerts */}
      {alerts.map((al) => (
        <div
          key={al.id}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAlert(al.id)
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 transform scale-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="shrink-0 mt-0.5">
                {al.type === 'success' && <CheckCircle2 className="text-emerald-500" size={26} />}
                {al.type === 'error' && <AlertCircle className="text-rose-500" size={26} />}
                {al.type === 'warning' && <AlertTriangle className="text-amber-500" size={26} />}
                {al.type === 'info' && <Info className="text-blue-500" size={26} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900">{al.title}</h3>
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed whitespace-pre-line">
                  {al.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => closeAlert(al.id)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => closeAlert(al.id)}
                className="px-5 py-2 rounded-xl bg-[#326318] text-white text-sm font-semibold hover:bg-[#284e13] transition-colors shadow-sm cursor-pointer"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Global Confirmations */}
      {confirms.map((cf) => (
        <div
          key={cf.id}
          onClick={(e) => {
            if (e.target === e.currentTarget) resolveConfirm(cf.id, false)
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 transform scale-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="shrink-0 mt-0.5">
                {cf.isDestructive ? (
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Trash2 size={20} />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertTriangle size={20} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900">{cf.title}</h3>
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed whitespace-pre-line">
                  {cf.message}
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => resolveConfirm(cf.id, false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors cursor-pointer"
              >
                {cf.cancelText || 'Hủy bỏ'}
              </button>
              <button
                type="button"
                onClick={() => resolveConfirm(cf.id, true)}
                className={`px-5 py-2 rounded-xl text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer ${
                  cf.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                    : 'bg-[#326318] hover:bg-[#284e13]'
                }`}
              >
                {cf.confirmText || 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </PopupContext.Provider>
  )
}

export const usePopup = () => useContext(PopupContext)

import React, { createContext, useContext, useState, useEffect } from 'react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'

type PopupType = 'info' | 'success' | 'warning' | 'error'

interface AlertOptions {
  id: string
  title: string
  message: string
  type: PopupType
  resolve: () => void
}

interface ConfirmOptions {
  id: string
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  resolve: (value: boolean) => void
}

let alertHandler: ((title: string, message: string, type: PopupType) => Promise<void>) | null = null
let confirmHandler: ((title: string, message?: string) => Promise<boolean>) | null = null

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

  if (alertHandler) {
    return alertHandler(title, message, type)
  }
  alert(`${title}: ${message}`)
  return Promise.resolve()
}

export const globalShowConfirm = (titleOrMessage: string, message?: string): Promise<boolean> => {
  const title = message ? titleOrMessage : 'Xác nhận'
  const desc = message || titleOrMessage

  if (confirmHandler) {
    return confirmHandler(title, desc)
  }
  return Promise.resolve(window.confirm(`${title}\n${desc}`))
}

const PopupContext = createContext({})

export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertOptions[]>([])
  const [confirms, setConfirms] = useState<ConfirmOptions[]>([])

  useEffect(() => {
    alertHandler = (title, message, type) => {
      return new Promise<void>((resolve) => {
        const id = Math.random().toString(36).substring(7)
        setAlerts((prev) => [...prev, { id, title, message, type, resolve }])
      })
    }

    confirmHandler = (title, message = '') => {
      return new Promise<boolean>((resolve) => {
        const id = Math.random().toString(36).substring(7)
        setConfirms((prev) => [...prev, { id, title, message, resolve }])
      })
    }

    return () => {
      alertHandler = null
      confirmHandler = null
    }
  }, [])

  const closeAlert = (id: string) => {
    setAlerts((prev) => {
      const target = prev.find((a) => a.id === id)
      target?.resolve()
      return prev.filter((a) => a.id !== id)
    })
  }

  const resolveConfirm = (id: string, result: boolean) => {
    setConfirms((prev) => {
      const target = prev.find((c) => c.id === id)
      target?.resolve(result)
      return prev.filter((c) => c.id !== id)
    })
  }

  return (
    <PopupContext.Provider value={{}}>
      {children}

      {/* Global Alerts */}
      {alerts.map((al) => (
        <div
          key={al.id}
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
                onClick={() => closeAlert(al.id)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 transform scale-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="shrink-0 mt-0.5">
                <AlertTriangle className="text-amber-500" size={26} />
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
                onClick={() => resolveConfirm(cf.id, false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors cursor-pointer"
              >
                {cf.cancelText || 'Hủy bỏ'}
              </button>
              <button
                onClick={() => resolveConfirm(cf.id, true)}
                className="px-5 py-2 rounded-xl bg-[#326318] text-white text-sm font-semibold hover:bg-[#284e13] transition-colors shadow-sm cursor-pointer"
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

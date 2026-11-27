import React, { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import { create } from 'zustand'
import { AlertCircle, CheckCircle2, HelpCircle, Info, AlertTriangle, Link2, Trash2, X } from 'lucide-react'

export type PopupType = 'info' | 'success' | 'warning' | 'error'

export interface AlertOptions {
  id: string
  /** Thứ tự mở: popup mở trước hiện trước */
  seq: number
  title: string
  message: string
  type: PopupType
  resolve: () => void
}

export interface ConfirmCustomOptions {
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  danger?: boolean
  /** Việc cần cân nhắc (vd còn thiếu xe) nhưng không phá huỷ dữ liệu */
  warning?: boolean
  /** Các dòng tóm tắt để người dùng kiểm tra trước khi đồng ý */
  details?: string[]
}

export interface ConfirmOptions {
  id: string
  seq: number
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  warning?: boolean
  details?: string[]
  resolve: (value: boolean) => void
}

export interface PromptCustomOptions {
  label?: string
  defaultValue?: string
  placeholder?: string
  confirmText?: string
}

export interface PromptOptions extends PromptCustomOptions {
  id: string
  seq: number
  title: string
  resolve: (value: string | null) => void
}

interface PopupStoreState {
  alerts: AlertOptions[]
  confirms: ConfirmOptions[]
  prompts: PromptOptions[]
  showAlert: (title: string, message: string, type: PopupType) => Promise<void>
  showConfirm: (title: string, message: string, options?: ConfirmCustomOptions) => Promise<boolean>
  showPrompt: (title: string, options?: PromptCustomOptions) => Promise<string | null>
  closeAlert: (id: string) => void
  resolveConfirm: (id: string, result: boolean) => void
  resolvePrompt: (id: string, result: string | null) => void
}

let seq = 0
const next = () => ({ id: `popup-${++seq}`, seq })

export const usePopupStore = create<PopupStoreState>((set) => ({
  alerts: [],
  confirms: [],
  prompts: [],

  showAlert: (title, message, type) =>
    new Promise<void>((resolve) => {
      set((state) => ({ alerts: [...state.alerts, { ...next(), title, message, type, resolve }] }))
    }),

  showConfirm: (title, message, options) =>
    new Promise<boolean>((resolve) => {
      set((state) => ({
        confirms: [
          ...state.confirms,
          {
            ...next(),
            title,
            message,
            confirmText: options?.confirmText,
            cancelText: options?.cancelText,
            isDestructive: options?.isDestructive ?? options?.danger,
            warning: options?.warning,
            details: options?.details,
            resolve,
          },
        ],
      }))
    }),

  showPrompt: (title, options) =>
    new Promise<string | null>((resolve) => {
      set((state) => ({ prompts: [...state.prompts, { ...options, ...next(), title, resolve }] }))
    }),

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

  resolvePrompt: (id, result) => {
    set((state) => {
      const target = state.prompts.find((p) => p.id === id)
      target?.resolve(result)
      return { prompts: state.prompts.filter((p) => p.id !== id) }
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

/** Ô nhập một giá trị (thay hộp thoại nhập mặc định của trình duyệt); trả null nếu huỷ */
export const globalShowPrompt = (title: string, options?: PromptCustomOptions): Promise<string | null> =>
  usePopupStore.getState().showPrompt(title, options)

const TONES = {
  success: { icon: CheckCircle2, chip: 'bg-emerald-50 text-emerald-600', button: 'bg-[#326318] hover:bg-[#284e13]' },
  info: { icon: Info, chip: 'bg-blue-50 text-blue-600', button: 'bg-[#326318] hover:bg-[#284e13]' },
  warning: { icon: AlertTriangle, chip: 'bg-amber-50 text-amber-600', button: 'bg-[#326318] hover:bg-[#284e13]' },
  error: { icon: AlertCircle, chip: 'bg-rose-50 text-rose-600', button: 'bg-[#326318] hover:bg-[#284e13]' },
  question: { icon: HelpCircle, chip: 'bg-[#eef6e7] text-[#326318]', button: 'bg-[#326318] hover:bg-[#284e13]' },
  danger: { icon: Trash2, chip: 'bg-rose-50 text-rose-600', button: 'bg-rose-600 hover:bg-rose-700' },
  input: { icon: Link2, chip: 'bg-[#eef6e7] text-[#326318]', button: 'bg-[#326318] hover:bg-[#284e13]' },
}

/**
 * Khung popup: dùng <dialog> hiện dạng modal để luôn nằm trên mọi hộp thoại khác, giữ tiêu điểm bên trong,
 * phím Esc hoặc bấm ra ngoài chỉ đóng popup (không đóng luôn cửa sổ phía sau).
 */
function PopupShell({ tone, title, onDismiss, children }: { tone: keyof typeof TONES; title: string; onDismiss: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const { icon: Icon, chip } = TONES[tone]

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const previous = document.activeElement as HTMLElement | null
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal()
    } else dialog.setAttribute('open', '')
    return () => {
      if (dialog.open && typeof dialog.close === 'function') dialog.close()
      previous?.focus?.()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onDismiss()
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return
        e.preventDefault()
        e.stopPropagation()
        onDismiss()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onDismiss()
      }}
      className="fixed inset-0 m-auto h-fit max-h-[90vh] w-[min(92vw,28rem)] overflow-y-auto rounded-3xl border-0 bg-white p-0 text-left shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${chip}`}>
            <Icon size={24} />
          </span>
          <h3 id={titleId} className="min-w-0 flex-1 self-center text-lg font-black leading-snug text-gray-900">{title}</h3>
          <button type="button" aria-label="Đóng" onClick={onDismiss} className="cursor-pointer rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

const mainButton = 'cursor-pointer rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors'
const quietButton = 'cursor-pointer rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200'
const messageText = 'mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600'

function PromptForm({ p, onDone }: { p: PromptOptions; onDone: (value: string | null) => void }) {
  const [value, setValue] = useState(p.defaultValue ?? '')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onDone(value.trim() || null)
      }}
    >
      <label className="mt-4 block text-sm font-semibold text-gray-700">
        {p.label}
        <input
          autoFocus
          value={value}
          placeholder={p.placeholder}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#326318] focus:ring-2 focus:ring-[#326318]/20"
        />
      </label>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => onDone(null)} className={quietButton}>Hủy bỏ</button>
        <button type="submit" disabled={!value.trim()} className={`${mainButton} ${TONES.input.button} disabled:opacity-40`}>{p.confirmText || 'Chèn'}</button>
      </div>
    </form>
  )
}

const PopupContext = createContext({})

export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const alerts = usePopupStore((s) => s.alerts)
  const confirms = usePopupStore((s) => s.confirms)
  const prompts = usePopupStore((s) => s.prompts)
  const closeAlert = usePopupStore((s) => s.closeAlert)
  const resolveConfirm = usePopupStore((s) => s.resolveConfirm)
  const resolvePrompt = usePopupStore((s) => s.resolvePrompt)
  // Mỗi lúc chỉ một popup, theo thứ tự mở
  const current = Math.min(...[...alerts, ...confirms, ...prompts].map((x) => x.seq))
  const al = alerts.find((x) => x.seq === current)
  const cf = confirms.find((x) => x.seq === current)
  const pm = prompts.find((x) => x.seq === current)

  return (
    <PopupContext.Provider value={{}}>
      {children}

      {al && (
        <PopupShell key={al.id} tone={al.type} title={al.title} onDismiss={() => closeAlert(al.id)}>
          <p className={messageText}>{al.message}</p>
          <div className="mt-6 flex justify-end">
            <button type="button" autoFocus onClick={() => closeAlert(al.id)} className={`${mainButton} ${TONES[al.type].button} w-full sm:w-auto`}>
              Đồng ý
            </button>
          </div>
        </PopupShell>
      )}

      {cf && (
        <PopupShell key={cf.id} tone={cf.isDestructive ? 'danger' : cf.warning ? 'warning' : 'question'} title={cf.title} onDismiss={() => resolveConfirm(cf.id, false)}>
          {cf.message && <p className={messageText}>{cf.message}</p>}
          {!!cf.details?.length && (
            <ul className="mt-3 flex flex-col gap-1.5 rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800">
              {cf.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {/* Việc không hoàn tác được thì tiêu điểm nằm ở nút huỷ để Enter không đồng ý nhầm */}
            <button type="button" autoFocus={cf.isDestructive} onClick={() => resolveConfirm(cf.id, false)} className={quietButton}>
              {cf.cancelText || 'Hủy bỏ'}
            </button>
            <button
              type="button"
              autoFocus={!cf.isDestructive}
              onClick={() => resolveConfirm(cf.id, true)}
              className={`${mainButton} ${cf.isDestructive ? TONES.danger.button : TONES.question.button}`}
            >
              {cf.confirmText || 'Xác nhận'}
            </button>
          </div>
        </PopupShell>
      )}

      {pm && (
        <PopupShell key={pm.id} tone="input" title={pm.title} onDismiss={() => resolvePrompt(pm.id, null)}>
          <PromptForm p={pm} onDone={(v) => resolvePrompt(pm.id, v)} />
        </PopupShell>
      )}
    </PopupContext.Provider>
  )
}

export const usePopup = () => useContext(PopupContext)

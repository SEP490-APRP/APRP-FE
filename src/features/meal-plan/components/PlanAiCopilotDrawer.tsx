import { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Flame,
  Store,
  RefreshCw,
  Lightbulb,
} from 'lucide-react'
import type {
  BuildPlanResponse,
  PlanCopilotActionDto,
  CopilotChatMessage,
} from '@/services'
import { useCopilotChat, useCopilotApply } from '../hooks/useMealPlanQueries'
import { useUiStore } from '@/stores/useUiStore'

interface PlanAiCopilotDrawerProps {
  isOpen: boolean
  onClose: () => void
  plan: BuildPlanResponse | null
}

interface MessageItem {
  id: string
  role: 'user' | 'assistant'
  content: string
  suggestedAction?: PlanCopilotActionDto | null
  canExecute?: boolean
  applied?: boolean
  timestamp: string
}

function FormattedMessage({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <div className="whitespace-pre-line">{content}</div>
  }

  const lines = content.split('\n')

  const parseInline = (text: string) => {
    // Tách các đoạn in đậm **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        const inner = part.slice(2, -2)
        return (
          <strong
            key={i}
            className="font-bold text-emerald-950 bg-emerald-100/70 px-1.5 py-0.5 rounded-md border border-emerald-200/60"
          >
            {inner}
          </strong>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="space-y-1.5 leading-relaxed text-xs">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) {
          return <div key={idx} className="h-1" />
        }

        // Dòng dạng danh sách gạch đầu dòng
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletText = trimmed.slice(2)
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 text-slate-700">
              <span className="text-emerald-600 font-bold mt-0.5">•</span>
              <div className="flex-1">{parseInline(bulletText)}</div>
            </div>
          )
        }

        return (
          <div key={idx} className="text-slate-800">
            {parseInline(line)}
          </div>
        )
      })}
    </div>
  )
}

export default function PlanAiCopilotDrawer({
  isOpen,
  onClose,
  plan,
}: PlanAiCopilotDrawerProps) {
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [quickChips, setQuickChips] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const copilotChatMutation = useCopilotChat(plan?.planId || 0)
  const copilotApplyMutation = useCopilotApply(plan?.planId || 0)

  // Scroll xuống tin nhắn cuối
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  // Khởi tạo tin nhắn chào mừng & phân tích khi mở drawer lần đầu
  useEffect(() => {
    if (isOpen && plan && messages.length === 0) {
      const isDraft = plan.status === 'AI_DRAFT' || plan.status === 'DRAFT'
      const isConfirmed = plan.status === 'CONFIRMED'

      let welcomeText = `Xin chào! Tôi là **Trợ Lý Dinh Dưỡng AI** đồng hành cùng bạn.\n\n`
      if (isDraft) {
        welcomeText += `Thực đơn **${plan.planName}** (${plan.numberOfDays} ngày, ${plan.numberOfPeople} người) đang ở chế độ **Bản nháp AI**.\n\n`
        welcomeText += `Tôi đã tối ưu hóa mâm cơm từ kho combo giải cứu, loại trừ 100% chất gây dị ứng và ưu tiên các nguyên liệu nhẹ bụng. Bạn có thể hỏi tôi lý do chọn món, hoặc ra lệnh đổi combo theo ý muốn!`
      } else if (isConfirmed) {
        welcomeText += `Thực đơn **${plan.planName}** đã được **Xác nhận**. Tôi sẵn sàng giải thích chi tiết dinh dưỡng, hướng dẫn cách sơ chế và bảo quản nông sản tươi ngon trong tuần!`
      } else {
        welcomeText += `Thực đơn này đã được **Lưu trữ vào lịch sử**. Tôi sẵn sàng giải đáp thắc mắc và tổng kết các chỉ số dinh dưỡng tuần qua.`
      }

      setMessages([
        {
          id: 'welcome-1',
          role: 'assistant',
          content: welcomeText,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ])

      setQuickChips(
        isConfirmed
          ? [
              'Tại sao AI lại chọn các món này?',
              'Cách bảo quản nông sản trong tủ lạnh?',
              'Thực đơn này cung cấp bao nhiêu calo?',
            ]
          : [
              'Tại sao AI lại chọn các món này?',
              'Đổi bữa tối Ngày 1 sang món canh/súp',
              'Tối mai nhà tôi có thêm 2 khách, tăng khẩu phần',
              'Cách bảo quản nông sản trong tủ lạnh',
            ]
      )
    }
  }, [isOpen, plan, messages.length])

  if (!isOpen || !plan) return null

  const isDraft = plan.status === 'AI_DRAFT' || plan.status === 'DRAFT'
  const isConfirmed = plan.status === 'CONFIRMED'
  const isArchived = plan.status === 'ARCHIVED'

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim()
    if (!text || copilotChatMutation.isPending) return

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputMessage('')

    // Chuẩn bị history cho backend
    const history: CopilotChatMessage[] = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const res = await copilotChatMutation.mutateAsync({
        message: text,
        history,
      })

      const botMsg: MessageItem = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: res.replyMessage,
        suggestedAction: res.suggestedAction,
        canExecute: res.canExecute,
        applied: false,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, botMsg])

      if (res.quickSuggestions && res.quickSuggestions.length > 0) {
        setQuickChips(res.quickSuggestions)
      }
    } catch (err: any) {
      const errorMsg: MessageItem = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          err?.response?.data?.message ||
          'Xin lỗi, kết nối tới Trợ lý AI đang gặp sự cố. Vui lòng thử lại sau ít phút!',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMsg])
    }
  }

  const handleApplyAction = async (msgId: string, action: PlanCopilotActionDto) => {
    if (!action || copilotApplyMutation.isPending) return

    if (!isDraft) {
      useUiStore.getState().showToast(
        'Thực đơn này đã được xác nhận hoặc lưu trữ, không thể chỉnh sửa trực tiếp qua AI!'
      )
      return
    }

    try {
      await copilotApplyMutation.mutateAsync({
        actionType: action.actionType,
        targetMealId: action.targetMealId || 0,
        targetItemId: action.targetItemId || 0,
        newComboId: action.newComboId,
        quantity: action.quantity || 1,
      })

      // Đánh dấu action card đã áp dụng
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, applied: true } : m))
      )

      useUiStore.getState().showToast(
        `✓ Đã áp dụng thành công: Đổi sang ${action.newComboName || 'combo mới'}!`
      )
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi khi áp dụng thay đổi'
      useUiStore.getState().showToast(msg)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl border-l border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Trợ Lý Dinh Dưỡng AI</h3>
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-emerald-100/80">
                Đồng hành phân tích & tối ưu thực đơn CapNong
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Governance Matrix Banner */}
        <div
          className={`border-b px-4 py-2.5 text-xs flex items-center gap-2 ${
            isDraft
              ? 'bg-amber-50 text-amber-900 border-amber-200/80'
              : isConfirmed
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200/80'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          {isDraft ? (
            <>
              <Sparkles size={14} className="shrink-0 text-amber-600" />
              <span>
                <b>Chế độ Nháp AI:</b> AI có thể phân tích và thay đổi món trực tiếp theo yêu cầu.
              </span>
            </>
          ) : isConfirmed ? (
            <>
              <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
              <span>
                <b>Đã xác nhận:</b> AI hỗ trợ giải thích dinh dưỡng, mẹo nấu và bảo quản nông sản.
              </span>
            </>
          ) : (
            <>
              <Clock size={14} className="shrink-0 text-slate-500" />
              <span>
                <b>Lưu trữ (Chỉ đọc):</b> Thực đơn đã hoàn tất, AI hỗ trợ giải đáp & tổng kết.
              </span>
            </>
          )}
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-amber-300 shadow-xs">
                  <Bot size={16} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-2 shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-emerald-700 text-white font-medium rounded-tr-xs'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-xs'
                }`}
              >
                {/* Message Content formatted */}
                <FormattedMessage content={msg.content} isUser={msg.role === 'user'} />

                {/* Interactive Action Card Widget if AI proposed a tweak */}
                {msg.suggestedAction && (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900">
                      <Sparkles size={13} className="text-amber-500" />
                      <span>Đề xuất điều chỉnh từ AI:</span>
                    </div>

                    <div className="rounded-lg bg-white p-2.5 border border-emerald-100 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 truncate">
                            {msg.suggestedAction.newComboName}
                          </span>
                          <span className="rounded-md bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                            Ngày {msg.suggestedAction.dayIndex} - {msg.suggestedAction.mealType}
                          </span>
                        </div>
                        {msg.suggestedAction.reason && (
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                            {msg.suggestedAction.reason}
                          </p>
                        )}
                        {msg.suggestedAction.newPrice && (
                          <span className="text-[11px] font-bold text-emerald-700">
                            {msg.suggestedAction.newPrice.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Button Áp dụng */}
                    {isDraft ? (
                      <button
                        type="button"
                        disabled={msg.applied || copilotApplyMutation.isPending}
                        onClick={() => handleApplyAction(msg.id, msg.suggestedAction!)}
                        className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition shadow-xs ${
                          msg.applied
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        {msg.applied ? (
                          <>
                            <CheckCircle2 size={14} className="text-emerald-700" />
                            <span>Đã áp dụng vào thực đơn</span>
                          </>
                        ) : copilotApplyMutation.isPending ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Đang áp dụng...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Áp dụng vào thực đơn</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic text-center">
                        (Thực đơn đã xác nhận, bạn có thể tự đổi ở thẻ món nếu cần)
                      </p>
                    )}
                  </div>
                )}

                <div className="text-[9px] opacity-60 text-right mt-1">
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700 shadow-xs">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {copilotChatMutation.isPending && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-amber-300">
                <Bot size={16} />
              </div>
              <div className="rounded-2xl rounded-tl-xs bg-white border border-slate-100 px-4 py-3 shadow-2xs text-xs text-slate-500 flex items-center gap-2">
                <RefreshCw size={13} className="animate-spin text-emerald-600" />
                <span>AI đang phân tích thực đơn và tìm câu trả lời...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {quickChips.length > 0 && (
          <div className="border-t border-slate-100 bg-white px-3 py-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <Lightbulb size={13} className="shrink-0 text-amber-500 ml-1" />
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={copilotChatMutation.isPending}
                  onClick={() => handleSendMessage(chip)}
                  className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/80 whitespace-nowrap transition"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="border-t border-slate-100 p-3 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                isDraft
                  ? 'Nhập câu hỏi hoặc ra lệnh đổi combo...'
                  : 'Hỏi AI về dinh dưỡng, mẹo nấu, bảo quản...'
              }
              disabled={copilotChatMutation.isPending}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || copilotChatMutation.isPending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40 transition shadow-xs"
            >
              <Send size={15} />
            </button>
          </form>

          {/* Medical & Nutritional Disclaimer Badge */}
          <div className="mt-2 text-center">
            <span className="text-[10px] text-slate-400 leading-tight block">
              🛡️ Gợi ý dinh dưỡng AI dựa trên định mức RDA Viện Dinh Dưỡng Quốc Gia. Không thay thế tư vấn y khoa chuyên sâu.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

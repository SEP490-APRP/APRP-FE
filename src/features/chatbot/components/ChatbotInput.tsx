import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useChatbotStore } from '../stores/useChatbotStore'

export const ChatbotInput: React.FC = () => {
  const [text, setText] = useState('')
  const sendMessage = useChatbotStore((s) => s.sendMessage)
  const isLoading = useChatbotStore((s) => s.isLoading)
  const isOpen = useChatbotStore((s) => s.isOpen)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || isLoading) return
    sendMessage(text)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 bg-white border-t border-[#e5e2da] flex items-center gap-2"
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Hỏi về nông sản, chính sách, hoặc gõ 'Mua 2kg cà chua'..."
        disabled={isLoading}
        className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#d6d3c9] focus:outline-none focus:border-[#326318] focus:ring-2 focus:ring-[#326318]/15 text-xs sm:text-sm text-[#1c2216] placeholder:text-[#5f6b57] bg-[#f8faf6] focus:bg-white transition-all disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!text.trim() || isLoading}
        className="size-10 rounded-xl bg-[#326318] hover:bg-[#254b12] active:scale-95 text-white shadow-xs transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center shrink-0 cursor-pointer"
        title="Gửi tin nhắn"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4 translate-x-[-0.5px]" />
        )}
      </button>
    </form>
  )
}

export default ChatbotInput

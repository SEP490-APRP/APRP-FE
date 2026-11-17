import React, { useEffect, useRef } from 'react'
import { useChatbotStore } from '../stores/useChatbotStore'
import { ChatbotMessageItem } from './ChatbotMessageItem'

export const ChatbotMessageList: React.FC = () => {
  const messages = useChatbotStore((s) => s.messages)
  const isLoading = useChatbotStore((s) => s.isLoading)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8faf6]">
      {messages.map((msg) => (
        <ChatbotMessageItem key={msg.id} message={msg} />
      ))}

      {/* Typing indicator nông sản */}
      {isLoading && (
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white border border-[#cfe6c4] p-0.5 flex items-center justify-center shadow-2xs shrink-0">
            <img
              src="/logo-icon.png"
              alt="CapNong AI"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="p-3 rounded-2xl rounded-tl-xs bg-white border border-[#e2e6dc] shadow-2xs">
            <div className="flex items-center gap-1.5 py-1 px-1">
              <span className="w-2 h-2 rounded-full bg-[#4a7c2f] animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 rounded-full bg-[#5e9440] animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 rounded-full bg-[#a4e876] animate-bounce"></span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

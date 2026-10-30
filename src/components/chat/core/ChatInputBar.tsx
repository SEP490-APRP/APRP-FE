import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Loader2,
  Image as ImageIcon,
  Video,
  Mic,
  Square,
  X,
} from 'lucide-react'
import { uploadService } from '@/services/upload.service'
import { globalShowAlert } from '@/components/common/Popup'
import { useVoiceRecorder } from './useVoiceRecorder'

export interface PendingMedia {
  url: string
  type: 'IMAGE' | 'VIDEO' | 'AUDIO'
  name?: string
}

export interface ChatInputBarProps {
  onSendMessage: (content: string, type: string, attachmentUrl?: string) => Promise<void>
  onSendTyping: (isTyping: boolean) => void
  disabled?: boolean
  placeholder?: string
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  onSendTyping,
  disabled = false,
  placeholder = 'Nhập nội dung tin nhắn trao đổi...',
}) => {
  const [messageInput, setMessageInput] = useState('')
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [sending, setSending] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { isRecording, recordingSeconds, startRecording, stopRecording, cancelRecording } =
    useVoiceRecorder()

  // Dọn dẹp typing khi unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        onSendTyping(false)
      }
    }
  }, [onSendTyping])

  // Xử lý typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    onSendTyping(true)
    typingTimeoutRef.current = setTimeout(() => {
      onSendTyping(false)
    }, 1500)
  }

  // Tải ảnh hoặc video lên Cloudinary
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024

    if (file.size > maxSize) {
      globalShowAlert(
        isVideo
          ? 'Video đính kèm không được vượt quá 50MB'
          : 'Hình ảnh đính kèm không được vượt quá 10MB',
        'Tệp quá lớn',
        'warning',
      )
      if (imageInputRef.current) imageInputRef.current.value = ''
      if (videoInputRef.current) videoInputRef.current.value = ''
      return
    }

    try {
      setUploadingMedia(true)
      const res = await uploadService.uploadMedia(file, 'chat')
      if (res.result?.url) {
        setPendingMedia({
          url: res.result.url,
          type: isVideo ? 'VIDEO' : 'IMAGE',
          name: file.name,
        })
      }
    } catch (err) {
      console.error('[ChatInputBar] Upload media error:', err)
      globalShowAlert('Tải tệp tin thất bại. Vui lòng thử lại.', 'Lỗi tải tệp', 'error')
    } finally {
      setUploadingMedia(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  // Hoàn tất ghi âm và tải lên Cloudinary
  const handleStopAndUploadVoice = async () => {
    const result = await stopRecording()
    if (!result?.file) return

    try {
      setUploadingMedia(true)
      const res = await uploadService.uploadMedia(result.file, 'chat')
      if (res.result?.url) {
        setPendingMedia({
          url: res.result.url,
          type: 'AUDIO',
          name: 'Tin nhắn thoại',
        })
      }
    } catch (err) {
      console.error('[ChatInputBar] Upload audio error:', err)
      globalShowAlert('Không thể tải đoạn ghi âm lên máy chủ.', 'Lỗi tải âm thanh', 'error')
    } finally {
      setUploadingMedia(false)
    }
  }

  // Gửi tin nhắn
  const handleSend = async () => {
    if ((!messageInput.trim() && !pendingMedia) || sending || disabled) return

    const content = messageInput.trim()
    const media = pendingMedia
    const attachmentUrl = media?.url || undefined
    const type = media ? media.type : 'TEXT'

    setMessageInput('')
    setPendingMedia(null)
    setSending(true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    onSendTyping(false)

    try {
      await onSendMessage(content, type, attachmentUrl)
    } catch (err) {
      console.error('[ChatInputBar] Send message error:', err)
      setMessageInput(content)
      setPendingMedia(media)
      globalShowAlert('Không thể gửi tin nhắn. Vui lòng thử lại.', 'Lỗi gửi tin', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="shrink-0">
      {/* Banner tải tệp */}
      {uploadingMedia && (
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 flex items-center gap-2 text-xs font-semibold text-amber-800 animate-fadeIn">
          <Loader2 size={15} className="animate-spin text-amber-600" />
          <span>Đang tải tệp lên máy chủ... Vui lòng đợi trong giây lát!</span>
        </div>
      )}

      {/* Preview Pending Media trước khi gửi */}
      {pendingMedia && (
        <div className="px-5 py-2.5 bg-white border-t border-[#edf1e8] flex items-center gap-3 shrink-0 animate-fadeIn">
          <div className="relative size-14 rounded-lg overflow-hidden border border-[#dce3d5] bg-black/5 flex items-center justify-center shrink-0">
            {pendingMedia.type === 'VIDEO' ? (
              <video src={pendingMedia.url} className="size-full object-cover" muted playsInline />
            ) : pendingMedia.type === 'AUDIO' ? (
              <div className="size-full bg-rose-50 flex items-center justify-center text-rose-600">
                <Mic size={24} />
              </div>
            ) : (
              <img src={pendingMedia.url} alt="Đính kèm" className="size-full object-cover" />
            )}
            {pendingMedia.type === 'VIDEO' && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                <Video size={18} className="text-white drop-shadow" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setPendingMedia(null)}
              className="absolute top-0.5 right-0.5 size-4 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black cursor-pointer"
              title="Gỡ bỏ tệp"
            >
              <X size={10} />
            </button>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-[#1c2216]">
              {pendingMedia.type === 'VIDEO'
                ? 'Video đã sẵn sàng gửi'
                : pendingMedia.type === 'AUDIO'
                ? 'Tin nhắn thoại đã sẵn sàng gửi'
                : 'Hình ảnh đã sẵn sàng gửi'}
            </span>
            <span className="text-[11px] text-[#717c6b] truncate max-w-xs">
              {pendingMedia.name ||
                (pendingMedia.type === 'VIDEO'
                  ? 'Tệp video'
                  : pendingMedia.type === 'AUDIO'
                  ? 'Ghi âm thoại'
                  : 'Tệp hình ảnh')}
            </span>
          </div>
        </div>
      )}

      {/* Input controls */}
      <div className="p-3 lg:p-3.5 border-t border-[#e8ece3] bg-white">
        {isRecording ? (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-lg animate-pulse">
            <div className="size-2.5 rounded-full bg-rose-600 animate-ping" />
            <span className="text-xs font-bold text-rose-700">Đang ghi âm...</span>
            <span className="text-xs font-mono font-bold text-rose-800">
              {Math.floor(recordingSeconds / 60)}:
              {(recordingSeconds % 60).toString().padStart(2, '0')}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={cancelRecording}
                className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-md cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleStopAndUploadVoice}
                className="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md flex items-center gap-1 cursor-pointer"
              >
                <Square size={12} fill="white" />
                Xong
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Input file ẩn */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleMediaUpload}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleMediaUpload}
            />

            {/* Nút đính kèm ảnh */}
            <button
              type="button"
              disabled={disabled || uploadingMedia || sending}
              onClick={() => imageInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-[#326318] hover:bg-[#f2f7ee] rounded-lg transition-all cursor-pointer disabled:opacity-40"
              title="Gửi hình ảnh (tối đa 10MB)"
            >
              <ImageIcon size={18} />
            </button>

            {/* Nút đính kèm video */}
            <button
              type="button"
              disabled={disabled || uploadingMedia || sending}
              onClick={() => videoInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-[#326318] hover:bg-[#f2f7ee] rounded-lg transition-all cursor-pointer disabled:opacity-40"
              title="Gửi video ngắn (tối đa 50MB)"
            >
              <Video size={18} />
            </button>

            {/* Nút ghi âm thoại */}
            <button
              type="button"
              disabled={disabled || uploadingMedia || sending}
              onClick={startRecording}
              className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer disabled:opacity-40"
              title="Ghi âm tin nhắn thoại"
            >
              <Mic size={18} />
            </button>

            {/* Ô nhập tin nhắn */}
            <input
              type="text"
              disabled={disabled || sending}
              placeholder={placeholder}
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              className="flex-1 bg-[#f4f7f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1c2216] px-3.5 py-2.5 rounded-lg outline-none transition"
            />

            {/* Nút gửi */}
            <button
              type="button"
              disabled={(!messageInput.trim() && !pendingMedia) || sending || disabled}
              onClick={handleSend}
              className="p-2.5 bg-[#326318] hover:bg-[#285013] text-white rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
              title="Gửi tin nhắn"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

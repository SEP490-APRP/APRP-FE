import { useState, useRef, useCallback } from 'react'
import { globalShowAlert } from '@/components/common/Popup'

export interface VoiceRecorderState {
  isRecording: boolean
  recordingSeconds: number
  startRecording: () => Promise<boolean>
  stopRecording: () => Promise<{ file: File; blob: Blob } | null>
  cancelRecording: () => void
}

const getSupportedAudioMimeType = (): { mimeType: string; ext: string } => {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return { mimeType: 'audio/webm', ext: 'webm' }
  }
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return { mimeType: 'audio/webm;codecs=opus', ext: 'webm' }
  }
  if (MediaRecorder.isTypeSupported('audio/webm')) {
    return { mimeType: 'audio/webm', ext: 'webm' }
  }
  if (MediaRecorder.isTypeSupported('audio/mp4')) {
    return { mimeType: 'audio/mp4', ext: 'mp4' }
  }
  if (MediaRecorder.isTypeSupported('audio/ogg')) {
    return { mimeType: 'audio/ogg', ext: 'ogg' }
  }
  return { mimeType: '', ext: 'webm' }
}

export function useVoiceRecorder(): VoiceRecorderState {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mimeTypeInfoRef = useRef<{ mimeType: string; ext: string }>({ mimeType: 'audio/webm', ext: 'webm' })

  const cancelRecording = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.onstop = null
        mediaRecorderRef.current.stop()
      } catch {
        // ignore
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    mediaRecorderRef.current = null
    audioChunksRef.current = []
    setIsRecording(false)
    setRecordingSeconds(0)
  }, [])

  const startRecording = useCallback(async (): Promise<boolean> => {
    cancelRecording()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeInfo = getSupportedAudioMimeType()
      mimeTypeInfoRef.current = mimeInfo

      const recorder = mimeInfo.mimeType
        ? new MediaRecorder(stream, { mimeType: mimeInfo.mimeType })
        : new MediaRecorder(stream)

      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.start()
      setIsRecording(true)
      setRecordingSeconds(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)

      return true
    } catch (err) {
      console.error('[useVoiceRecorder] Micro permission error:', err)
      globalShowAlert(
        'Không thể truy cập Microphone. Vui lòng cấp quyền trong cài đặt trình duyệt để sử dụng tính năng ghi âm.',
        'Lỗi Micro',
        'warning',
      )
      cancelRecording()
      return false
    }
  }, [cancelRecording])

  const stopRecording = useCallback((): Promise<{ file: File; blob: Blob } | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        cancelRecording()
        resolve(null)
        return
      }

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }

      recorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }

        const chunks = audioChunksRef.current
        if (chunks.length > 0) {
          const { mimeType, ext } = mimeTypeInfoRef.current
          const finalMime = mimeType || 'audio/webm'
          const blob = new Blob(chunks, { type: finalMime })
          const file = new File([blob], `voice_${Date.now()}.${ext}`, { type: finalMime })
          setIsRecording(false)
          setRecordingSeconds(0)
          mediaRecorderRef.current = null
          audioChunksRef.current = []
          resolve({ file, blob })
        } else {
          setIsRecording(false)
          setRecordingSeconds(0)
          mediaRecorderRef.current = null
          audioChunksRef.current = []
          resolve(null)
        }
      }

      try {
        recorder.stop()
      } catch {
        cancelRecording()
        resolve(null)
      }
    })
  }, [cancelRecording])

  return {
    isRecording,
    recordingSeconds,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}

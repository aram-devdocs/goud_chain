import { useState, useCallback } from 'react'
import { ToastType } from '@goudchain/types'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

export function useToast(): {
  toasts: Toast[]
  show: (type: ToastType, message: string, duration?: number) => string
  dismiss: (id: string) => void
  success: (msg: string) => string
  error: (msg: string) => string
  warning: (msg: string) => string
  info: (msg: string) => string
} {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback(
    (type: ToastType, message: string, duration = 3000): string => {
      const id = Math.random().toString(36).substring(7)
      const toast: Toast = { id, type, message }

      setToasts((prev) => [...prev, toast])

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)

      return id
    },
    []
  )

  const dismiss = useCallback((id: string): void => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return {
    toasts,
    show,
    dismiss,
    success: useCallback(
      (msg: string): string => show(ToastType.Success, msg),
      [show]
    ),
    error: useCallback(
      (msg: string): string => show(ToastType.Error, msg),
      [show]
    ),
    warning: useCallback(
      (msg: string): string => show(ToastType.Warning, msg),
      [show]
    ),
    info: useCallback(
      (msg: string): string => show(ToastType.Info, msg),
      [show]
    ),
  }
}

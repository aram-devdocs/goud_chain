import { useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback(
    (type: ToastType, message: string, duration: number = 3000) => {
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

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return {
    toasts,
    show,
    dismiss,
    success: useCallback(
      (msg: string) => show('success', msg),
      [show]
    ),
    error: useCallback(
      (msg: string) => show('error', msg),
      [show]
    ),
    warning: useCallback(
      (msg: string) => show('warning', msg),
      [show]
    ),
    info: useCallback(
      (msg: string) => show('info', msg),
      [show]
    ),
  }
}

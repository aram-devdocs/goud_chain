import { createContext, useContext, useState, useCallback } from 'react'
import { ToastType } from '@goudchain/types'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toasts: Toast[]
  show: (type: ToastType, message: string, duration?: number) => string
  dismiss: (id: string) => void
  success: (msg: string) => string
  error: (msg: string) => string
  warning: (msg: string) => string
  info: (msg: string) => string
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
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

  const value: ToastContextValue = {
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

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToastContext(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider')
  }
  return context
}

// Backward-compatible hook name
export const useToast = useToastContext

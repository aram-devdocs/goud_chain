import { clsx } from 'clsx'
import { ToastType } from '@goudchain/types'

export interface ToastProps {
  type: ToastType
  message: string
  onDismiss: () => void
}

export function Toast({ type, message, onDismiss }: ToastProps): JSX.Element {
  return (
    <div
      onClick={onDismiss}
      className={clsx(
        'cursor-pointer rounded-lg border p-3 shadow-lg backdrop-blur-sm flex items-start gap-3',
        {
          'bg-green-950/90 border-green-700': type === ToastType.Success,
          'bg-blue-950/90 border-blue-700': type === ToastType.Info,
          'bg-yellow-950/90 border-yellow-700': type === ToastType.Warning,
          'bg-red-950/90 border-red-700': type === ToastType.Error,
        }
      )}
    >
      <div
        className={clsx(
          'text-xs font-mono font-bold px-1.5 py-0.5 rounded',
          {
            'bg-green-500/20 text-green-400': type === ToastType.Success,
            'bg-blue-500/20 text-blue-400': type === ToastType.Info,
            'bg-yellow-500/20 text-yellow-400': type === ToastType.Warning,
            'bg-red-500/20 text-red-400': type === ToastType.Error,
          }
        )}
      >
        {type === ToastType.Success && 'OK'}
        {type === ToastType.Info && 'INFO'}
        {type === ToastType.Warning && 'WARN'}
        {type === ToastType.Error && 'ERR'}
      </div>
      <div className="flex-1 text-sm text-white">{message}</div>
    </div>
  )
}

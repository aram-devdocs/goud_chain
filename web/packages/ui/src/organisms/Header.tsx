import { type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  title: string
  subtitle?: string
  wsConnected?: boolean
  accountId?: string | null
  isRefreshing?: boolean
  onRefresh?: () => void
}

export function Header({
  title,
  subtitle,
  wsConnected = false,
  accountId = null,
  isRefreshing = false,
  onRefresh,
  className,
  children,
  ...props
}: HeaderProps) {
  return (
    <header
      className={clsx(
        'bg-black border-b border-zinc-800 sticky top-0 z-40',
        className
      )}
      {...props}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">{title}</h1>
            {subtitle && (
              <p className="text-zinc-500 text-xs mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* WebSocket Connection Status */}
            <div className="flex items-center gap-2">
              <span
                className={clsx('w-2 h-2 rounded-full', {
                  'bg-green-500': wsConnected,
                  'bg-red-500 animate-pulse': !wsConnected,
                })}
              />
              <span className="text-xs text-zinc-400">
                {wsConnected ? 'Live' : 'Polling'}
              </span>
            </div>

            {/* Account Info */}
            {accountId && (
              <span className="text-xs text-zinc-400">
                {accountId.substring(0, 12)}...
              </span>
            )}

            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-sm border border-zinc-700 transition"
              >
                {isRefreshing ? '...' : 'Refresh'}
              </button>
            )}

            {children}
          </div>
        </div>
      </div>
    </header>
  )
}

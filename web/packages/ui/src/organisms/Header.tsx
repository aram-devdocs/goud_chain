import { type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  title: string
  subtitle?: string
}

export function Header({
  title,
  subtitle,
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
              <p className="text-sm text-zinc-500 font-mono mt-1">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </header>
  )
}

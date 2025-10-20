import type React from 'react'
import { type HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const isInteractive = !!onClick

    const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        onClick?.(e as any)
      }
    }

    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-lg border border-zinc-800 bg-zinc-950 p-6',
          isInteractive &&
            'cursor-pointer hover:border-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black',
          className
        )}
        onClick={onClick}
        onKeyPress={isInteractive ? handleKeyPress : undefined}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        {...props}
      >
        {children}
      </div>
    )
  }
)

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={clsx('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <h3
      className={clsx('text-lg font-semibold text-white', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardContent({ className, children, ...props }: CardProps) {
  return (
    <div className={clsx('text-zinc-300', className)} {...props}>
      {children}
    </div>
  )
}

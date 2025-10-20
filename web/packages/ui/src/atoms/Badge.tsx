/**
 * Badge Component
 *
 * Small badge for displaying status, counts, or labels
 * Supports multiple color variants matching semantic colors
 */

import { type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual variant */
  variant?: BadgeVariant
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

export function Badge({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded border',
        {
          // Variants
          'bg-zinc-900/20 border-zinc-700 text-zinc-400': variant === 'default',
          'bg-blue-900/20 border-blue-700 text-blue-400': variant === 'primary',
          'bg-green-900/20 border-green-700 text-green-400':
            variant === 'success',
          'bg-red-900/20 border-red-700 text-red-400': variant === 'error',
          'bg-yellow-900/20 border-yellow-700 text-yellow-400':
            variant === 'warning',
          'bg-cyan-900/20 border-cyan-700 text-cyan-400': variant === 'info',
          // Sizes
          'px-1.5 py-0.5 text-xs': size === 'sm',
          'px-2 py-1 text-xs': size === 'md',
          'px-2.5 py-1 text-sm': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

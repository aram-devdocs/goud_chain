/**
 * ActionCard Component
 *
 * Clickable card for quick actions with title and description
 */

import { type ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface ActionCardProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Action title */
  title: string
  /** Action description */
  description: string
  /** Visual variant */
  variant?: 'primary' | 'secondary'
}

export function ActionCard({
  title,
  description,
  variant = 'secondary',
  className,
  ...props
}: ActionCardProps) {
  return (
    <button
      type="button"
      className={clsx(
        'rounded-lg p-4 transition text-left w-full',
        {
          'bg-white text-black hover:bg-zinc-200': variant === 'primary',
          'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800':
            variant === 'secondary',
        },
        className
      )}
      {...props}
    >
      <div
        className={clsx('font-semibold mb-1', {
          'text-black': variant === 'primary',
          'text-white': variant === 'secondary',
        })}
      >
        {title}
      </div>
      <div
        className={clsx('text-sm', {
          'text-zinc-700': variant === 'primary',
          'text-zinc-400': variant === 'secondary',
        })}
      >
        {description}
      </div>
    </button>
  )
}

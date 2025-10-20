/**
 * EmptyState Component
 * 
 * Display when no data is available
 * Actionable with optional button
 */

import { type ReactNode } from 'react'
import { clsx } from 'clsx'
import { Button } from '../atoms/Button'
import { ButtonVariant } from '@goudchain/types'

export interface EmptyStateProps {
  /** Title text */
  title: string
  /** Description text */
  description?: string
  /** Optional icon or illustration */
  icon?: ReactNode
  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
  }
  /** Custom className */
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
    >
      {icon && <div className="mb-4 text-zinc-500">{icon}</div>}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-500 max-w-md mb-4">{description}</p>
      )}
      {action && (
        <Button variant={ButtonVariant.Primary} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

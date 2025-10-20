/**
 * ProgressBar Component
 * 
 * Visual progress indicator with percentage display
 * Supports different colors for different states
 */

import { type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export type ProgressVariant = 'primary' | 'success' | 'warning' | 'error'

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Progress value (0-100) */
  value: number
  /** Maximum value */
  max?: number
  /** Visual variant */
  variant?: ProgressVariant
  /** Show percentage label */
  showLabel?: boolean
  /** Custom label */
  label?: string
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'primary',
  showLabel = false,
  label,
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const variantClasses = {
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }

  return (
    <div className={clsx('w-full', className)} {...props}>
      {(showLabel || label) && (
        <div className="flex justify-between mb-1 text-xs text-zinc-400">
          <span>{label || 'Progress'}</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className="w-full bg-zinc-800 rounded-full h-2">
        <div
          className={clsx('h-2 rounded-full transition-all', variantClasses[variant])}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}

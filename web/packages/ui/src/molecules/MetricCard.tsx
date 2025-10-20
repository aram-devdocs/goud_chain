/**
 * MetricCard Component
 *
 * Display a single metric with label, value, description, and timestamp
 * Supports color variants and gradients
 */

import { type HTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { formatRelativeTime } from '@goudchain/utils'

export interface MetricCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Metric label (small text at top) */
  label: string
  /** Main metric value (large number) */
  value: string | number
  /** Description below the value */
  description: string
  /** Timestamp for "Updated X ago" text */
  lastUpdated?: number
  /** Color variant for gradient and text */
  variant?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'zinc'
}

export function MetricCard({
  label,
  value,
  description,
  lastUpdated,
  variant = 'blue',
  className,
  ...props
}: MetricCardProps) {
  const variantClasses = {
    blue: {
      bg: 'from-blue-950/50 to-blue-900/30',
      border: 'border-blue-800/50',
      label: 'text-blue-300',
      value: 'text-blue-400',
      description: 'text-blue-300/60',
    },
    green: {
      bg: 'from-green-950/50 to-green-900/30',
      border: 'border-green-800/50',
      label: 'text-green-300',
      value: 'text-green-400',
      description: 'text-green-300/60',
    },
    purple: {
      bg: 'from-purple-950/50 to-purple-900/30',
      border: 'border-purple-800/50',
      label: 'text-purple-300',
      value: 'text-purple-400',
      description: 'text-purple-300/60',
    },
    yellow: {
      bg: 'from-yellow-950/50 to-yellow-900/30',
      border: 'border-yellow-800/50',
      label: 'text-yellow-300',
      value: 'text-yellow-400',
      description: 'text-yellow-300/60',
    },
    red: {
      bg: 'from-red-950/50 to-red-900/30',
      border: 'border-red-800/50',
      label: 'text-red-300',
      value: 'text-red-400',
      description: 'text-red-300/60',
    },
    zinc: {
      bg: 'from-zinc-900/50 to-zinc-800/30',
      border: 'border-zinc-700/50',
      label: 'text-zinc-300',
      value: 'text-zinc-100',
      description: 'text-zinc-400',
    },
  }

  const colors = variantClasses[variant]

  return (
    <div
      className={clsx(
        'bg-gradient-to-br rounded-lg p-6 border',
        colors.bg,
        colors.border,
        className
      )}
      {...props}
    >
      <div className={clsx('text-xs mb-2 font-medium', colors.label)}>
        {label}
      </div>
      <div className={clsx('text-4xl font-bold mb-1', colors.value)}>
        {value}
      </div>
      <div className={clsx('text-xs', colors.description)}>{description}</div>
      {lastUpdated && (
        <div className="text-xs text-zinc-500 mt-2">
          Updated {formatRelativeTime(lastUpdated)}
        </div>
      )}
    </div>
  )
}

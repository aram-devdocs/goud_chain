/**
 * ButtonGroup Component
 *
 * Group of buttons with consistent spacing
 * Supports horizontal and vertical layouts
 */

import { type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Layout direction */
  direction?: 'horizontal' | 'vertical'
  /** Spacing between buttons */
  spacing?: 'tight' | 'normal' | 'comfortable'
}

export function ButtonGroup({
  direction = 'horizontal',
  spacing = 'normal',
  className,
  children,
  ...props
}: ButtonGroupProps) {
  const spacingClasses = {
    tight: 'gap-1',
    normal: 'gap-2',
    comfortable: 'gap-4',
  }

  return (
    <div
      className={clsx(
        'flex',
        {
          'flex-row': direction === 'horizontal',
          'flex-col': direction === 'vertical',
        },
        spacingClasses[spacing],
        className
      )}
      role="group"
      {...props}
    >
      {children}
    </div>
  )
}

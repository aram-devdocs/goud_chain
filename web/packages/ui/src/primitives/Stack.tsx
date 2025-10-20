/**
 * Stack Primitive
 *
 * Vertical or horizontal layout with consistent spacing
 * Mobile-first with responsive direction support
 */

import { forwardRef, type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Stack direction
   * @default 'vertical'
   */
  direction?: 'vertical' | 'horizontal'
  /**
   * Spacing between children (4px grid)
   * @default 4
   */
  spacing?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12
  /**
   * Alignment of children
   */
  align?: 'start' | 'center' | 'end' | 'stretch'
  /**
   * Justify content
   */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  /**
   * Allow wrapping
   * @default false
   */
  wrap?: boolean
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    {
      direction = 'vertical',
      spacing = 4,
      align,
      justify,
      wrap = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'flex',
          {
            'flex-col': direction === 'vertical',
            'flex-row': direction === 'horizontal',
            'flex-wrap': wrap,
            // Spacing
            'gap-0': spacing === 0,
            'gap-1': spacing === 1,
            'gap-2': spacing === 2,
            'gap-3': spacing === 3,
            'gap-4': spacing === 4,
            'gap-5': spacing === 5,
            'gap-6': spacing === 6,
            'gap-8': spacing === 8,
            'gap-10': spacing === 10,
            'gap-12': spacing === 12,
            // Alignment
            'items-start': align === 'start',
            'items-center': align === 'center',
            'items-end': align === 'end',
            'items-stretch': align === 'stretch',
            // Justify
            'justify-start': justify === 'start',
            'justify-center': justify === 'center',
            'justify-end': justify === 'end',
            'justify-between': justify === 'between',
            'justify-around': justify === 'around',
            'justify-evenly': justify === 'evenly',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Stack.displayName = 'Stack'

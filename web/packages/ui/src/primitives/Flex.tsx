/**
 * Flex Primitive
 *
 * Flexible box layout with comprehensive flexbox props
 * More control than Stack for complex layouts
 */

import { forwardRef, type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface FlexProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Flex direction
   */
  direction?: 'row' | 'row-reverse' | 'col' | 'col-reverse'
  /**
   * Align items
   */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  /**
   * Justify content
   */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  /**
   * Flex wrap
   */
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse'
  /**
   * Gap between items (4px grid)
   */
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12
  /**
   * Full width
   * @default false
   */
  fullWidth?: boolean
}

export const Flex = forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      direction,
      align,
      justify,
      wrap,
      gap,
      fullWidth = false,
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
            // Direction
            'flex-row': direction === 'row',
            'flex-row-reverse': direction === 'row-reverse',
            'flex-col': direction === 'col',
            'flex-col-reverse': direction === 'col-reverse',
            // Align
            'items-start': align === 'start',
            'items-center': align === 'center',
            'items-end': align === 'end',
            'items-stretch': align === 'stretch',
            'items-baseline': align === 'baseline',
            // Justify
            'justify-start': justify === 'start',
            'justify-center': justify === 'center',
            'justify-end': justify === 'end',
            'justify-between': justify === 'between',
            'justify-around': justify === 'around',
            'justify-evenly': justify === 'evenly',
            // Wrap
            'flex-wrap': wrap === 'wrap',
            'flex-nowrap': wrap === 'nowrap',
            'flex-wrap-reverse': wrap === 'wrap-reverse',
            // Gap
            'gap-0': gap === 0,
            'gap-1': gap === 1,
            'gap-2': gap === 2,
            'gap-3': gap === 3,
            'gap-4': gap === 4,
            'gap-5': gap === 5,
            'gap-6': gap === 6,
            'gap-8': gap === 8,
            'gap-10': gap === 10,
            'gap-12': gap === 12,
            // Width
            'w-full': fullWidth,
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

Flex.displayName = 'Flex'

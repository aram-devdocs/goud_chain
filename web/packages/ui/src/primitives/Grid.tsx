/**
 * Grid Primitive
 *
 * CSS Grid layout with responsive column support
 * Mobile-first with automatic column adjustment
 */

import { forwardRef, type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Number of columns (responsive)
   * Can be a single number or object with breakpoints
   * @default 1
   */
  columns?:
    | 1
    | 2
    | 3
    | 4
    | 6
    | 12
    | { sm?: number; md?: number; lg?: number; xl?: number }
  /**
   * Gap between items (4px grid)
   * @default 4
   */
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12
  /**
   * Row gap (if different from column gap)
   */
  rowGap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12
  /**
   * Column gap (if different from row gap)
   */
  colGap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  (
    { columns = 1, gap, rowGap, colGap, className, children, ...props },
    ref
  ) => {
    const isResponsive = typeof columns === 'object'

    return (
      <div
        ref={ref}
        className={clsx(
          'grid',
          {
            // Fixed columns
            'grid-cols-1': !isResponsive && columns === 1,
            'grid-cols-2': !isResponsive && columns === 2,
            'grid-cols-3': !isResponsive && columns === 3,
            'grid-cols-4': !isResponsive && columns === 4,
            'grid-cols-6': !isResponsive && columns === 6,
            'grid-cols-12': !isResponsive && columns === 12,
            // Responsive columns
            'sm:grid-cols-2': isResponsive && columns.sm === 2,
            'sm:grid-cols-3': isResponsive && columns.sm === 3,
            'sm:grid-cols-4': isResponsive && columns.sm === 4,
            'md:grid-cols-2': isResponsive && columns.md === 2,
            'md:grid-cols-3': isResponsive && columns.md === 3,
            'md:grid-cols-4': isResponsive && columns.md === 4,
            'md:grid-cols-6': isResponsive && columns.md === 6,
            'lg:grid-cols-2': isResponsive && columns.lg === 2,
            'lg:grid-cols-3': isResponsive && columns.lg === 3,
            'lg:grid-cols-4': isResponsive && columns.lg === 4,
            'lg:grid-cols-6': isResponsive && columns.lg === 6,
            'xl:grid-cols-4': isResponsive && columns.xl === 4,
            'xl:grid-cols-6': isResponsive && columns.xl === 6,
            // Gap
            'gap-0': gap === 0 && !rowGap && !colGap,
            'gap-1': gap === 1 && !rowGap && !colGap,
            'gap-2': gap === 2 && !rowGap && !colGap,
            'gap-3': gap === 3 && !rowGap && !colGap,
            'gap-4': gap === 4 && !rowGap && !colGap,
            'gap-5': gap === 5 && !rowGap && !colGap,
            'gap-6': gap === 6 && !rowGap && !colGap,
            'gap-8': gap === 8 && !rowGap && !colGap,
            'gap-10': gap === 10 && !rowGap && !colGap,
            'gap-12': gap === 12 && !rowGap && !colGap,
            // Row gap
            'gap-y-0': rowGap === 0,
            'gap-y-1': rowGap === 1,
            'gap-y-2': rowGap === 2,
            'gap-y-3': rowGap === 3,
            'gap-y-4': rowGap === 4,
            'gap-y-5': rowGap === 5,
            'gap-y-6': rowGap === 6,
            'gap-y-8': rowGap === 8,
            'gap-y-10': rowGap === 10,
            'gap-y-12': rowGap === 12,
            // Column gap
            'gap-x-0': colGap === 0,
            'gap-x-1': colGap === 1,
            'gap-x-2': colGap === 2,
            'gap-x-3': colGap === 3,
            'gap-x-4': colGap === 4,
            'gap-x-5': colGap === 5,
            'gap-x-6': colGap === 6,
            'gap-x-8': colGap === 8,
            'gap-x-10': colGap === 10,
            'gap-x-12': colGap === 12,
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

Grid.displayName = 'Grid'

/**
 * Container Primitive
 *
 * Responsive container with max-width constraints
 * Centers content and applies consistent horizontal padding
 */

import { forwardRef, type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Maximum width constraint
   * @default 'xl'
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /**
   * Remove horizontal padding
   * @default false
   */
  noPadding?: boolean
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  (
    { maxWidth = 'xl', noPadding = false, className, children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'mx-auto w-full',
          {
            'max-w-screen-sm': maxWidth === 'sm',
            'max-w-screen-md': maxWidth === 'md',
            'max-w-screen-lg': maxWidth === 'lg',
            'max-w-screen-xl': maxWidth === 'xl',
            'max-w-screen-2xl': maxWidth === '2xl',
            'max-w-full': maxWidth === 'full',
            'px-4 sm:px-6 lg:px-8': !noPadding,
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

Container.displayName = 'Container'

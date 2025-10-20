/**
 * Heading Component
 *
 * Semantic heading element with consistent typography
 * Supports all heading levels (h1-h6)
 */

import { type HTMLAttributes, createElement } from 'react'
import { clsx } from 'clsx'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Heading level (h1-h6) */
  level?: HeadingLevel
  /** Visual styling (can differ from semantic level) */
  as?: HeadingLevel
}

export function Heading({
  level = 1,
  as,
  className,
  children,
  ...props
}: HeadingProps) {
  const visualLevel = as ?? level
  const tag = `h${level}` as const

  return createElement(
    tag,
    {
      className: clsx(
        'font-bold text-white',
        {
          'text-4xl': visualLevel === 1,
          'text-3xl': visualLevel === 2,
          'text-2xl': visualLevel === 3,
          'text-xl': visualLevel === 4,
          'text-lg': visualLevel === 5,
          'text-base': visualLevel === 6,
        },
        className
      ),
      ...props,
    },
    children
  )
}

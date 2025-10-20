/**
 * Text Component
 * 
 * Semantic text element with consistent typography
 * Supports different sizes and colors
 */

import { type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl'
export type TextColor =
  | 'white'
  | 'zinc-100'
  | 'zinc-300'
  | 'zinc-400'
  | 'zinc-500'

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  /** Text size */
  size?: TextSize
  /** Text color */
  color?: TextColor
  /** Use monospace font */
  mono?: boolean
  /** Font weight */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
}

export function Text({
  size = 'base',
  color = 'zinc-300',
  mono = false,
  weight = 'normal',
  className,
  children,
  ...props
}: TextProps) {
  return (
    <p
      className={clsx(
        {
          // Sizes
          'text-xs': size === 'xs',
          'text-sm': size === 'sm',
          'text-base': size === 'base',
          'text-lg': size === 'lg',
          'text-xl': size === 'xl',
          // Colors
          'text-white': color === 'white',
          'text-zinc-100': color === 'zinc-100',
          'text-zinc-300': color === 'zinc-300',
          'text-zinc-400': color === 'zinc-400',
          'text-zinc-500': color === 'zinc-500',
          // Font
          'font-mono': mono,
          'font-normal': weight === 'normal',
          'font-medium': weight === 'medium',
          'font-semibold': weight === 'semibold',
          'font-bold': weight === 'bold',
        },
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

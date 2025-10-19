import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { ButtonVariant, ButtonSize } from '@goudchain/types'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = ButtonVariant.Primary,
      size = ButtonSize.Medium,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-white text-black hover:bg-zinc-200 focus:ring-white':
              variant === ButtonVariant.Primary,
            'bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 focus:ring-zinc-500':
              variant === ButtonVariant.Secondary,
            'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500':
              variant === ButtonVariant.Danger,
            'text-white hover:bg-zinc-900 focus:ring-zinc-500':
              variant === ButtonVariant.Ghost,
            'px-3 py-1.5 text-sm': size === ButtonSize.Small,
            'px-4 py-2 text-base': size === ButtonSize.Medium,
            'px-6 py-3 text-lg': size === ButtonSize.Large,
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

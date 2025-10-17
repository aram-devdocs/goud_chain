import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-white text-black hover:bg-zinc-200 focus:ring-white':
              variant === 'primary',
            'bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 focus:ring-zinc-500':
              variant === 'secondary',
            'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500':
              variant === 'danger',
            'text-white hover:bg-zinc-900 focus:ring-zinc-500':
              variant === 'ghost',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
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

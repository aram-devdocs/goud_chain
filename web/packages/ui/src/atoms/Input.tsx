import { forwardRef, type InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx(
          'w-full px-3 py-2 bg-zinc-900 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black transition-colors',
          {
            'border-zinc-700 focus:border-white focus:ring-white': !error,
            'border-red-500 focus:border-red-500 focus:ring-red-500': error,
          },
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

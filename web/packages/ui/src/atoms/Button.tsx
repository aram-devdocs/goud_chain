import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { ButtonVariant, ButtonSize, SpinnerSize } from '@goudchain/types'
import { Spinner } from './Spinner'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant using design system semantic colors
   * - Primary: bg-white (zinc-100), text-black, hover:bg-zinc-200
   * - Secondary: bg-zinc-800, text-white, border-zinc-700
   * - Danger: bg-red-500 (semantic.error), text-white
   * - Ghost: transparent, text-white, hover:bg-zinc-900
   * @default ButtonVariant.Primary
   */
  variant?: ButtonVariant
  /**
   * Size using design system spacing tokens
   * - Small: px-3 (spacing[3]), py-1.5, text-sm (typography.bodySmall)
   * - Medium: px-4 (spacing[4]), py-2, text-base (typography.body)
   * - Large: px-6 (spacing[6]), py-3, text-lg (typography.lg)
   * @default ButtonSize.Medium
   */
  size?: ButtonSize
  /**
   * Show loading spinner, disables button interaction
   * @default false
   */
  loading?: boolean
  /**
   * Icon to display on the left side of button text
   */
  iconLeft?: ReactNode
  /**
   * Icon to display on the right side of button text
   */
  iconRight?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = ButtonVariant.Primary,
      size = ButtonSize.Medium,
      loading = false,
      iconLeft,
      iconRight,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const spinnerSize =
      size === ButtonSize.Small
        ? SpinnerSize.Small
        : size === ButtonSize.Large
          ? SpinnerSize.Large
          : SpinnerSize.Medium

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed',
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
        {loading && <Spinner size={spinnerSize} />}
        {!loading && iconLeft && (
          <span className="flex-shrink-0">{iconLeft}</span>
        )}
        {children}
        {!loading && iconRight && (
          <span className="flex-shrink-0">{iconRight}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

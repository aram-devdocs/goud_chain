/**
 * Select Component
 * 
 * Dropdown select input with label support
 * Consistent styling matching design system
 */

import { forwardRef, type SelectHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Label text */
  label?: string
  /** Error message */
  error?: string
  /** Helper text */
  helperText?: string
  /** Full width */
  fullWidth?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div className={clsx('flex flex-col', { 'w-full': fullWidth })}>
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-zinc-300 mb-1"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={clsx(
            'bg-zinc-900 border rounded px-3 py-2 text-white text-sm',
            'focus:outline-none focus:border-white transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            {
              'border-red-500': error,
              'border-zinc-700': !error,
              'w-full': fullWidth,
            },
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? `${props.id}-error`
              : helperText
                ? `${props.id}-helper`
                : undefined
          }
          {...props}
        >
          {children}
        </select>
        {error && (
          <p id={`${props.id}-error`} className="text-xs text-red-500 mt-1">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${props.id}-helper`} className="text-xs text-zinc-500 mt-1">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

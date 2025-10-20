/**
 * Checkbox Component
 * 
 * Checkbox input with label support
 * Consistent styling matching design system
 */

import { forwardRef, type InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label text */
  label?: string
  /** Error message */
  error?: string
  /** Helper text */
  helperText?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="flex flex-col">
        <div className="flex items-center">
          <input
            ref={ref}
            type="checkbox"
            className={clsx(
              'w-4 h-4 rounded border-zinc-700 bg-zinc-900',
              'text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'cursor-pointer',
              {
                'border-red-500': error,
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
          />
          {label && (
            <label
              htmlFor={props.id}
              className="ml-2 text-sm text-zinc-300 cursor-pointer select-none"
            >
              {label}
            </label>
          )}
        </div>
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

Checkbox.displayName = 'Checkbox'

/**
 * Textarea Component
 * 
 * Multi-line text input with label support
 * Consistent styling matching design system
 */

import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label text */
  label?: string
  /** Error message */
  error?: string
  /** Helper text */
  helperText?: string
  /** Full width */
  fullWidth?: boolean
  /** Number of visible rows */
  rows?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      rows = 4,
      className,
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
        <textarea
          ref={ref}
          rows={rows}
          className={clsx(
            'bg-zinc-900 border rounded px-3 py-2 text-white text-sm',
            'focus:outline-none focus:border-white transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'resize-y',
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
        />
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

Textarea.displayName = 'Textarea'

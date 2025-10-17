import { forwardRef, type LabelHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={clsx('block text-sm font-medium text-zinc-300', className)}
        {...props}
      >
        {children}
      </label>
    )
  }
)

Label.displayName = 'Label'

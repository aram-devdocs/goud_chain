import { clsx } from 'clsx'
import { SpinnerSize } from '@goudchain/types'

export interface SpinnerProps {
  size?: SpinnerSize
  className?: string
}

export function Spinner({
  size = SpinnerSize.Medium,
  className,
}: SpinnerProps): JSX.Element {
  return (
    <div
      className={clsx(
        'inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent',
        {
          'h-4 w-4': size === SpinnerSize.Small,
          'h-8 w-8': size === SpinnerSize.Medium,
          'h-12 w-12': size === SpinnerSize.Large,
        },
        className
      )}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

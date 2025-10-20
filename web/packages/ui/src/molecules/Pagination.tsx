/**
 * Pagination Component
 * 
 * Navigation for paginated data
 * Displays current page and total pages with prev/next controls
 */

import { clsx } from 'clsx'
import { Button } from '../atoms/Button'
import { ButtonVariant, ButtonSize } from '@goudchain/types'

export interface PaginationProps {
  /** Current page (0-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Total items count */
  totalItems?: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Custom className */
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  className,
}: PaginationProps) {
  const hasPrevious = currentPage > 0
  const hasNext = currentPage < totalPages - 1

  return (
    <div
      className={clsx(
        'flex justify-between items-center px-4 py-3 bg-zinc-900 border-t border-zinc-800',
        className
      )}
    >
      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Small}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevious}
      >
        Previous
      </Button>

      <span className="text-sm text-zinc-400">
        Page {currentPage + 1} of {totalPages}
        {totalItems !== undefined && ` (${totalItems} total)`}
      </span>

      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Small}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
      >
        Next
      </Button>
    </div>
  )
}

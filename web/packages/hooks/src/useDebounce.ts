import { useState, useEffect } from 'react'

/**
 * Debounce a value by delaying updates until after a specified delay
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('')
 * const debouncedQuery = useDebounce(searchQuery, 300)
 *
 * useEffect(() => {
 *   // Only fires 300ms after user stops typing
 *   fetchResults(debouncedQuery)
 * }, [debouncedQuery])
 * ```
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

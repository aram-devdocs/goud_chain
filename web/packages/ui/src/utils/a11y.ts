/**
 * Accessibility Utilities
 *
 * Helper functions and CSS classes for accessible UI components
 */

/**
 * Visually Hidden CSS class
 * Hides element visually but keeps it accessible to screen readers
 *
 * @example
 * ```tsx
 * <span className={visuallyHidden}>Skip to main content</span>
 * ```
 */
export const visuallyHidden =
  'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0'

/**
 * Focus Visible CSS class
 * Shows focus ring only when keyboard navigating
 *
 * @example
 * ```tsx
 * <button className={`${focusVisible} rounded`}>Click me</button>
 * ```
 */
export const focusVisible =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black'

/**
 * Trap focus within a container (useful for modals/dialogs)
 *
 * @param container - HTML element to trap focus within
 * @returns Cleanup function to remove event listener
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   const cleanup = trapFocus(modalRef.current)
 *   return cleanup
 * }, [isOpen])
 * ```
 */
export function trapFocus(container: HTMLElement | null): () => void {
  if (!container) return () => {}

  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement?.focus()
        e.preventDefault()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement?.focus()
        e.preventDefault()
      }
    }
  }

  container.addEventListener('keydown', handleTabKey)

  // Focus first element
  firstElement?.focus()

  return () => {
    container.removeEventListener('keydown', handleTabKey)
  }
}

/**
 * Handle keyboard shortcuts
 *
 * @param key - Keyboard key to listen for
 * @param callback - Function to call when key is pressed
 * @param options - Additional options (ctrl, alt, shift)
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   return handleKeyboardShortcut('k', () => openSearch(), { ctrl: true })
 * }, [])
 * ```
 */
export function handleKeyboardShortcut(
  key: string,
  callback: () => void,
  options: {
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
    meta?: boolean
  } = {}
): () => void {
  function handleKeyPress(e: KeyboardEvent) {
    const matchesKey = e.key.toLowerCase() === key.toLowerCase()
    const matchesCtrl = options.ctrl ? e.ctrlKey : !e.ctrlKey
    const matchesAlt = options.alt ? e.altKey : !e.altKey
    const matchesShift = options.shift ? e.shiftKey : !e.shiftKey
    const matchesMeta = options.meta ? e.metaKey : !e.metaKey

    if (
      matchesKey &&
      matchesCtrl &&
      matchesAlt &&
      matchesShift &&
      matchesMeta
    ) {
      e.preventDefault()
      callback()
    }
  }

  window.addEventListener('keydown', handleKeyPress)

  return () => {
    window.removeEventListener('keydown', handleKeyPress)
  }
}

/**
 * Announce to screen readers
 *
 * @param message - Message to announce
 * @param priority - Priority level (polite or assertive)
 *
 * @example
 * ```tsx
 * announceToScreenReader('Data saved successfully', 'polite')
 * ```
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = visuallyHidden
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Get accessible label for element
 *
 * @param element - HTML element
 * @returns Accessible label text or null
 */
export function getAccessibleLabel(element: HTMLElement): string | null {
  // Check aria-label
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel

  // Check aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy)
    if (labelElement) return labelElement.textContent
  }

  // Check associated label element
  if (element instanceof HTMLInputElement) {
    const labels = element.labels
    if (labels && labels.length > 0) {
      const firstLabel = labels[0]
      if (firstLabel) return firstLabel.textContent
    }
  }

  return null
}

/**
 * Check if element is focusable
 *
 * @param element - HTML element to check
 * @returns True if element can receive focus
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.hasAttribute('disabled')) return false
  if (
    element.hasAttribute('tabindex') &&
    element.getAttribute('tabindex') === '-1'
  )
    return false

  const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']
  return focusableTags.includes(element.tagName)
}

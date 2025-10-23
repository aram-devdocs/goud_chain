/**
 * Layout Constants
 *
 * Defines standard layout dimensions and constraints for UI components.
 * These constants ensure consistency across the application and prevent magic numbers.
 */

/**
 * Minimum width for form components to accommodate 12-column grid layout.
 * Ensures proper spacing for key-type-value field arrangements without collapsing.
 */
export const FORM_MIN_WIDTH = 640 // px

/**
 * Layout dimension types for type-safe usage
 */
export type LayoutDimension = {
  readonly minWidth: number
  readonly maxWidth?: number
}

export const FORM_LAYOUT: LayoutDimension = {
  minWidth: FORM_MIN_WIDTH,
  maxWidth: 896, // max-w-4xl in Tailwind (56rem = 896px)
} as const

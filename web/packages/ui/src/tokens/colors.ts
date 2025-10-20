/**
 * Color Design Tokens
 *
 * Implements minimalist zinc grayscale aesthetic from CLAUDE.md
 * All colors follow the brand guidelines with semantic naming for consistent usage
 */

import type { ColorToken, SemanticColor, ZincShade } from '@goudchain/types'

// Zinc grayscale palette (zinc-950 to zinc-100)
export const zinc: Record<ZincShade, ColorToken> = {
  50: '#fafafa' as ColorToken,
  100: '#f4f4f5' as ColorToken,
  200: '#e4e4e7' as ColorToken,
  300: '#d4d4d8' as ColorToken,
  400: '#a1a1aa' as ColorToken,
  500: '#71717a' as ColorToken,
  600: '#52525b' as ColorToken,
  700: '#3f3f46' as ColorToken,
  800: '#27272a' as ColorToken,
  900: '#18181b' as ColorToken,
  950: '#09090b' as ColorToken,
}

// Semantic color system
export const semantic: Record<SemanticColor, ColorToken> = {
  primary: '#3b82f6' as ColorToken, // blue-500
  secondary: '#71717a' as ColorToken, // zinc-500
  success: '#22c55e' as ColorToken, // green-500
  error: '#ef4444' as ColorToken, // red-500
  warning: '#eab308' as ColorToken, // yellow-500
  info: '#06b6d4' as ColorToken, // cyan-500
}

// Special colors
export const colors = {
  black: '#000000' as ColorToken,
  white: '#ffffff' as ColorToken,
  transparent: 'transparent' as ColorToken,
  ...zinc,
  ...semantic,
}

/**
 * Helper function to add opacity to a color value
 *
 * Converts a hex color and opacity value to a hex color with alpha channel.
 * Useful for CSS custom properties when Tailwind's opacity utilities can't be used.
 *
 * @param color - A ColorToken (hex color value)
 * @param opacity - Opacity value between 0 and 1
 * @returns Hex color with alpha channel (e.g., #3b82f680 for 50% opacity)
 *
 * @example
 * ```typescript
 * import { colors, withOpacity } from '@goudchain/ui/tokens'
 *
 * // Add 50% opacity to primary color
 * const semiTransparentPrimary = withOpacity(colors.primary, 0.5)
 * // Result: '#3b82f680'
 *
 * // Use in CSS custom properties
 * const style = {
 *   backgroundColor: withOpacity(colors.zinc[950], 0.8)
 * }
 * ```
 *
 * Note: For Tailwind classes, prefer opacity utilities (e.g., bg-primary/50)
 * This function is primarily for runtime styling or CSS-in-JS scenarios.
 */
export function withOpacity(color: ColorToken, opacity: number): string {
  if (opacity < 0 || opacity > 1) {
    throw new Error('Opacity must be between 0 and 1')
  }
  // Convert opacity (0-1) to hex (00-FF)
  const alphaHex = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0')
  return `${color}${alphaHex}`
}

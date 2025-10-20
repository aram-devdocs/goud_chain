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

// Helper function to get color with opacity
export function withOpacity(color: ColorToken, opacity: number): string {
  if (opacity < 0 || opacity > 1) {
    throw new Error('Opacity must be between 0 and 1')
  }
  // Tailwind classes will handle opacity, but this is for CSS custom properties
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
}

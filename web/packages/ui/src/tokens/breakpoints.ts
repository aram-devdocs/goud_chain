/**
 * Breakpoint Design Tokens
 *
 * Mobile-first responsive breakpoint system
 * Following industry-standard device sizes
 */

import type { Breakpoint, BreakpointValue } from '@goudchain/types'

// Breakpoint values (mobile-first)
export const breakpoints: Record<Breakpoint, BreakpointValue> = {
  sm: '640px' as BreakpointValue, // Phones (landscape)
  md: '768px' as BreakpointValue, // Tablets
  lg: '1024px' as BreakpointValue, // Laptops
  xl: '1280px' as BreakpointValue, // Desktops
  '2xl': '1536px' as BreakpointValue, // Large desktops
}

// Common viewport sizes for testing
export const viewports = {
  mobile: 375, // iPhone SE
  tablet: 768, // iPad
  desktop: 1920, // Full HD
}

// Media query helpers
export const mediaQueries = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
}

// Container max widths for each breakpoint
export const containerMaxWidth: Record<Breakpoint, string> = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

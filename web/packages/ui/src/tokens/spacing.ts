/**
 * Spacing Design Tokens
 *
 * 4px base grid spacing scale for consistent rhythm
 * All spacing follows multiples of 4px for pixel-perfect alignment
 */

import type { SpacingToken, SpacingScale } from '@goudchain/types'

// Spacing scale (4px base grid)
export const spacing: Record<SpacingScale, SpacingToken> = {
  0: '0' as SpacingToken,
  0.5: '0.125rem' as SpacingToken, // 2px
  1: '0.25rem' as SpacingToken, // 4px
  1.5: '0.375rem' as SpacingToken, // 6px
  2: '0.5rem' as SpacingToken, // 8px
  2.5: '0.625rem' as SpacingToken, // 10px
  3: '0.75rem' as SpacingToken, // 12px
  4: '1rem' as SpacingToken, // 16px
  5: '1.25rem' as SpacingToken, // 20px
  6: '1.5rem' as SpacingToken, // 24px
  8: '2rem' as SpacingToken, // 32px
  10: '2.5rem' as SpacingToken, // 40px
  12: '3rem' as SpacingToken, // 48px
  16: '4rem' as SpacingToken, // 64px
  20: '5rem' as SpacingToken, // 80px
  24: '6rem' as SpacingToken, // 96px
}

// Common spacing presets
export const spacingPresets = {
  // Component internal spacing
  tight: spacing[2], // 8px
  normal: spacing[4], // 16px
  comfortable: spacing[6], // 24px
  spacious: spacing[8], // 32px

  // Layout spacing
  sectionGap: spacing[12], // 48px
  containerPadding: spacing[6], // 24px

  // Element spacing
  elementGap: spacing[3], // 12px
  iconGap: spacing[2], // 8px
}

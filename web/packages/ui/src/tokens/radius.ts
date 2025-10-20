/**
 * Border Radius Design Tokens
 * 
 * Consistent border radius values for rounded corners
 */

import type { RadiusToken } from '@goudchain/types'

export const radius: Record<RadiusToken, string> = {
  none: '0',
  sm: '0.25rem', // 4px
  base: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  full: '9999px', // Fully rounded
}

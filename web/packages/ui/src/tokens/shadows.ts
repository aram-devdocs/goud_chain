/**
 * Shadow Design Tokens
 * 
 * Note: Per CLAUDE.md, we use "Borders only, no shadows" for the minimalist aesthetic
 * These tokens are provided for edge cases but should be used sparingly
 */

import type { ShadowToken } from '@goudchain/types'

export const shadows: Record<ShadowToken, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
}

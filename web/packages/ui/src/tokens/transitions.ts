/**
 * Transition Design Tokens
 * 
 * Functional transitions for interactive elements
 * Per CLAUDE.md: "functional transitions only"
 */

import type { TransitionToken } from '@goudchain/types'

export const transitions: Record<TransitionToken, string> = {
  fast: '150ms ease-in-out',
  normal: '250ms ease-in-out',
  slow: '350ms ease-in-out',
}

// Common transition properties
export const transitionProperties = {
  colors: 'color, background-color, border-color',
  opacity: 'opacity',
  transform: 'transform',
  all: 'all',
}

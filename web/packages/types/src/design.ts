/**
 * Design Token Types
 * 
 * These branded types ensure type-safe usage of design tokens throughout the application.
 * They prevent mixing of different token types and enforce consistency.
 */

// Color tokens
export type ColorToken = string & { readonly __brand: 'ColorToken' }
export type SemanticColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
export type ZincShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950

// Typography tokens
export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
export type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold'
export type LineHeight = 'tight' | 'normal' | 'relaxed'
export type FontFamily = 'sans' | 'mono'

// Spacing tokens (4px base grid)
export type SpacingToken = string & { readonly __brand: 'SpacingToken' }
export type SpacingScale = 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24

// Breakpoint tokens (mobile-first)
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type BreakpointValue = string & { readonly __brand: 'BreakpointValue' }

// Radius tokens
export type RadiusToken = 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | 'full'

// Shadow tokens
export type ShadowToken = 'none' | 'sm' | 'base' | 'md' | 'lg'

// Transition tokens
export type TransitionToken = 'fast' | 'normal' | 'slow'

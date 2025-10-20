/**
 * Typography Design Tokens
 * 
 * Font scales, line heights, weights, and families
 * Clear hierarchy with large bold headers, medium subheaders, small body text
 */

import type { FontSize, FontWeight, LineHeight, FontFamily } from '@goudchain/types'

// Font size scale
export const fontSize: Record<FontSize, string> = {
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  base: '1rem', // 16px
  lg: '1.125rem', // 18px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
}

// Line height scale
export const lineHeight: Record<LineHeight, string> = {
  tight: '1.25',
  normal: '1.5',
  relaxed: '1.75',
}

// Font weight scale
export const fontWeight: Record<FontWeight, string> = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
}

// Font families
export const fontFamily: Record<FontFamily, string[]> = {
  sans: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
  mono: [
    'SF Mono',
    'Monaco',
    'Cascadia Code',
    'Menlo',
    'Consolas',
    'monospace',
  ],
}

// Typography presets for common use cases
export const typography = {
  // Headers
  h1: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
  },
  h2: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
  },
  h3: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
  },
  h4: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
  },
  // Body text
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },
  // Technical/monospace (for hashes, addresses, code)
  code: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.mono,
    lineHeight: lineHeight.normal,
  },
  // Captions and metadata
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },
}

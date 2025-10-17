import type { Config } from 'tailwindcss'
import baseConfig from '@workspace/tailwind-config'

export default {
  ...baseConfig,
  content: ['./src/**/*.{ts,tsx}'],
} satisfies Config

import type { Config } from 'tailwindcss'
import baseConfig from '@goudchain/tailwind-config'

export default {
  ...baseConfig,
  content: ['./src/**/*.{ts,tsx}', './.storybook/**/*.{ts,tsx}'],
} satisfies Config

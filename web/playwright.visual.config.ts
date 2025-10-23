import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'

// Load test environment variables
dotenv.config({ path: '.env.test' })

/**
 * Playwright Visual Regression Test Configuration
 *
 * Standalone config for visual regression tests against Storybook.
 * No backend or dashboard needed - only Storybook server.
 */
export default defineConfig({
  testDir: './e2e/tests',

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Test configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list'],
  ],

  // Shared test configuration
  use: {
    // Base URL for Storybook
    baseURL: process.env.STORYBOOK_URL || 'http://localhost:6006',

    // Screenshot/video configuration
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // Browser configuration
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },

  // Visual regression tests only
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /visual-regression\.spec\.ts/,
    },
  ],

  // No webServer - Storybook is started by CI workflow
})

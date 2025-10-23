import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'

// Load test environment variables
dotenv.config({ path: '.env.test' })

/**
 * Playwright E2E Test Configuration
 *
 * Mock-based UI testing with fast smoke tests..å=
 * No backend required - all API calls are mocked.
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
    // Base URL for dashboard application
    baseURL: process.env.DASHBOARD_URL || 'http://localhost:3000',

    // Screenshot/video configuration
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // Browser configuration
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // API base URL for mocked routes
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },

  // Smoke tests project (fast, mocked)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /smoke\.spec\.ts/,
    },
  ],

  // Start dashboard dev server automatically (smoke tests only)
  webServer: {
    command: 'cd apps/dashboard && pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})

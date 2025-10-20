import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

/**
 * Playwright E2E Test Configuration
 * 
 * Cross-browser testing with parallel execution for comprehensive user workflow validation.
 * Tests run against Docker Compose 3-node blockchain network via load balancer.
 */
export default defineConfig({
  testDir: './e2e/tests',
  
  // Maximum time one test can run
  timeout: 60 * 1000,
  
  // Test configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list']
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
    
    // API base URL for backend
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },
  
  // Global setup and teardown
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  
  // Cross-browser testing projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile testing (optional, disabled by default)
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],
  
  // Local dev server configuration (optional)
  // webServer: {
  //   command: 'pnpm dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});

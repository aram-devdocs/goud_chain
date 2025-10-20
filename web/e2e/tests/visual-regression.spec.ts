import { test, expect } from '@playwright/test';

/**
 * Visual Regression Test Suite
 * 
 * Tests visual consistency of UI components using Playwright screenshot comparison.
 * Integrates with Storybook for component-level visual testing.
 */

test.describe('Visual Regression Testing', () => {
  const storybookUrl = process.env.STORYBOOK_URL || 'http://localhost:6006';
  const visualThreshold = parseFloat(process.env.VISUAL_THRESHOLD || '0.1');
  
  test.beforeEach(async ({ page }) => {
    // Navigate to Storybook
    await page.goto(storybookUrl);
  });
  
  test('should match button component snapshots', async ({ page }) => {
    // Navigate to Button stories
    await page.click('text=Button');
    await page.waitForLoadState('networkidle');
    
    // Test Primary button
    await page.click('text=Primary');
    await page.waitForLoadState('networkidle');
    
    const canvas = page.frameLocator('#storybook-preview-iframe').locator('#storybook-root');
    await expect(canvas).toHaveScreenshot('button-primary.png', {
      threshold: visualThreshold,
    });
    
    // Test Secondary button
    await page.click('text=Secondary');
    await page.waitForLoadState('networkidle');
    
    await expect(canvas).toHaveScreenshot('button-secondary.png', {
      threshold: visualThreshold,
    });
  });
  
  test('should match card component snapshots', async ({ page }) => {
    // Navigate to Card stories
    await page.click('text=Card');
    await page.waitForLoadState('networkidle');
    
    const canvas = page.frameLocator('#storybook-preview-iframe').locator('#storybook-root');
    await expect(canvas).toHaveScreenshot('card-default.png', {
      threshold: visualThreshold,
    });
  });
  
  test('should match table component snapshots', async ({ page }) => {
    // Navigate to Table stories
    await page.click('text=Table');
    await page.waitForLoadState('networkidle');
    
    const canvas = page.frameLocator('#storybook-preview-iframe').locator('#storybook-root');
    await expect(canvas).toHaveScreenshot('table-default.png', {
      threshold: visualThreshold,
    });
  });
  
  test('should match form components snapshots', async ({ page }) => {
    // Test Input
    await page.click('text=Input');
    await page.waitForLoadState('networkidle');
    
    let canvas = page.frameLocator('#storybook-preview-iframe').locator('#storybook-root');
    await expect(canvas).toHaveScreenshot('input-default.png', {
      threshold: visualThreshold,
    });
    
    // Test Select
    await page.click('text=Select');
    await page.waitForLoadState('networkidle');
    
    canvas = page.frameLocator('#storybook-preview-iframe').locator('#storybook-root');
    await expect(canvas).toHaveScreenshot('select-default.png', {
      threshold: visualThreshold,
    });
  });
  
  test('should match metric card snapshots', async ({ page }) => {
    // Navigate to MetricCard stories
    await page.click('text=MetricCard');
    await page.waitForLoadState('networkidle');
    
    const canvas = page.frameLocator('#storybook-preview-iframe').locator('#storybook-root');
    await expect(canvas).toHaveScreenshot('metric-card-default.png', {
      threshold: visualThreshold,
    });
  });
  
  test('should match toast notification snapshots', async ({ page }) => {
    // Navigate to Toast stories
    await page.click('text=Toast');
    await page.waitForLoadState('networkidle');
    
    const canvas = page.frameLocator('#storybook-preview-iframe').locator('#storybook-root');
    await expect(canvas).toHaveScreenshot('toast-default.png', {
      threshold: visualThreshold,
    });
  });
});

test.describe('Page-Level Visual Regression', () => {
  test('should match auth page snapshot', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('page-auth.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });
  
  // Note: Authenticated page snapshots would require fixture setup
  // These are placeholders showing the pattern
});

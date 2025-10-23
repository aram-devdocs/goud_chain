import { test, expect } from '@playwright/test'
import { setupApiMocks } from '../mocks/api-mocks'

/**
 * Smoke Test Suite
 *
 * Fast UI validation tests with mocked API responses.
 * No backend required - all API calls are intercepted and mocked.
 * Target: <30s total runtime for pre-commit hooks.
 */

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
  })

  test('should load auth page', async ({ page }) => {
    await page.goto('/auth')

    // Verify page loads
    await expect(page).toHaveURL('/auth')

    // Verify page title
    await expect(page.locator('text=Goud Chain')).toBeVisible()

    // Verify tabs are present
    await expect(
      page
        .getByTestId('create-account-tab')
        .or(page.locator('text=Create Account'))
    ).toBeVisible()
  })

  test('should redirect unauthenticated user to auth page', async ({
    page,
  }) => {
    // Clear any existing auth
    await page.goto('/auth')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    // Try to access protected route
    await page.goto('/')

    // Should redirect to auth
    await expect(page).toHaveURL('/auth')
  })
})

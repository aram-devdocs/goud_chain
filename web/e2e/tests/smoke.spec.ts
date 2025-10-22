import { test, expect } from '@playwright/test'

/**
 * Smoke Test Suite
 *
 * Quick validation tests to ensure basic functionality works.
 * Run these first to verify the environment is set up correctly.
 * These tests run in pre-commit hooks for fast feedback.
 */

test.describe('Smoke Tests', () => {
  test('should load auth page', async ({ page }) => {
    await page.goto('/auth')

    // Verify page loads
    await expect(page).toHaveURL('/auth')

    // Verify page title
    await expect(page.locator('text=Goud Chain')).toBeVisible()
  })

  test('should verify backend API is responding', async ({ page }) => {
    const apiUrl = process.env.API_URL || 'http://localhost:8080'

    // Test health endpoint
    const healthResponse = await page.request.get(`${apiUrl}/health`)
    expect(healthResponse.ok()).toBe(true)

    // Test chain endpoint
    const chainResponse = await page.request.get(`${apiUrl}/chain`)
    expect(chainResponse.ok()).toBe(true)
  })

  test('should create account via API', async ({ page }) => {
    const apiUrl = process.env.API_URL || 'http://localhost:8080'

    // Create account
    const response = await page.request.post(`${apiUrl}/account/create`, {
      data: { metadata: null },
    })

    expect(response.ok()).toBe(true)

    const data = await response.json()
    expect(data.api_key).toBeTruthy()
    expect(data.api_key).toHaveLength(64)
  })

  test('should redirect unauthenticated user to auth page', async ({
    page,
  }) => {
    // Clear any existing auth
    await page.goto('/auth')
    await page.evaluate(() => {
      localStorage.clear()
    })

    // Try to access protected route
    await page.goto('/')

    // Should redirect to auth
    await expect(page).toHaveURL('/auth')
  })
})

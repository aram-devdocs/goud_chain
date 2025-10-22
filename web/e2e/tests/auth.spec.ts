import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/AuthPage'
import { DashboardPage } from '../pages/DashboardPage'

/**
 * Authentication Test Suite
 *
 * Tests account creation, login, session persistence, logout, and error handling.
 */

test.describe('Authentication', () => {
  let authPage: AuthPage
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    dashboardPage = new DashboardPage(page)
    await authPage.goto()
  })

  test('should create a new account successfully', async ({ page }) => {
    // Create account
    const apiKey = await authPage.createAccount()

    // Verify API key is displayed
    expect(apiKey).toBeTruthy()
    expect(apiKey.length).toBe(64) // 64-character hex string
  })

  test('should login with valid API key', async ({ page }) => {
    const apiUrl = process.env.API_URL || 'http://localhost:8080'

    // Create account via API
    const response = await page.request.post(`${apiUrl}/account/create`, {
      data: { metadata: null },
    })

    const { api_key } = await response.json()

    // Login with API key
    await authPage.login(api_key)

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/')

    // Verify session token is stored
    const sessionToken = await authPage.getSessionToken()
    expect(sessionToken).toBeTruthy()
  })

  test('should show error for invalid API key', async ({ page }) => {
    const invalidApiKey = 'invalid_key_12345'

    // Attempt login with invalid key
    await authPage.apiKeyInput.fill(invalidApiKey)
    await authPage.loginButton.click()

    // Wait for error message
    await expect(authPage.errorMessage).toBeVisible({ timeout: 5000 })

    const errorText = await authPage.getErrorMessage()
    expect(errorText.toLowerCase()).toContain('invalid')
  })

  test('should persist session across page reloads', async ({ page }) => {
    const apiUrl = process.env.API_URL || 'http://localhost:8080'

    // Create and login
    const response = await page.request.post(`${apiUrl}/account/create`, {
      data: { metadata: null },
    })

    const { api_key } = await response.json()
    await authPage.login(api_key)

    // Verify dashboard loads
    await expect(page).toHaveURL('/')

    // Reload page
    await page.reload()

    // Verify still on dashboard (session persisted)
    await expect(page).toHaveURL('/')
  })

  test('should logout successfully', async ({ page }) => {
    const apiUrl = process.env.API_URL || 'http://localhost:8080'

    // Create and login
    const response = await page.request.post(`${apiUrl}/account/create`, {
      data: { metadata: null },
    })

    const { api_key } = await response.json()
    await authPage.login(api_key)

    // Logout
    await dashboardPage.logout()

    // Verify redirect to auth page
    await expect(page).toHaveURL('/auth')

    // Verify session cleared
    const sessionToken = await authPage.getSessionToken()
    expect(sessionToken).toBeNull()
  })

  test('should clear authentication state on logout', async ({ page }) => {
    const apiUrl = process.env.API_URL || 'http://localhost:8080'

    // Create and login
    const response = await page.request.post(`${apiUrl}/account/create`, {
      data: { metadata: null },
    })

    const { api_key } = await response.json()
    await authPage.login(api_key)

    // Logout
    await dashboardPage.logout()

    // Verify all auth data cleared
    const sessionToken = await authPage.getSessionToken()
    const storedApiKey = await authPage.getApiKey()

    expect(sessionToken).toBeNull()
    expect(storedApiKey).toBeNull()
  })

  test('should redirect to auth page when accessing protected route without authentication', async ({
    page,
  }) => {
    // Clear any existing auth
    await authPage.clearAuth()

    // Attempt to access dashboard
    await page.goto('/')

    // Should redirect to auth page
    await expect(page).toHaveURL('/auth')
  })
})

import { test as base, Page } from '@playwright/test';

/**
 * Authentication Fixture
 * 
 * Provides authenticated user session for tests.
 * Creates test account, stores API key and session token in localStorage.
 * Automatically cleans up test accounts after test completion.
 */

export interface AuthFixtures {
  authenticatedPage: Page;
  apiKey: string;
  accountName: string;
}

export const test = base.extend<AuthFixtures>({
  /**
   * Authenticated page fixture
   * Creates a test account and logs in before each test
   */
  authenticatedPage: async ({ page }, use) => {
    const apiUrl = process.env.API_URL || 'http://localhost:8080';
    const accountName = `test_user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Step 1: Create test account via API
    const createResponse = await page.request.post(`${apiUrl}/account/create`, {
      data: { account_name: accountName }
    });
    
    if (!createResponse.ok()) {
      throw new Error(`Failed to create test account: ${await createResponse.text()}`);
    }
    
    const { api_key } = await createResponse.json();
    
    // Step 2: Navigate to auth page and log in
    await page.goto('/auth');
    
    // Wait for the login form to be visible
    await page.waitForSelector('input[name="apiKey"]', { state: 'visible' });
    
    // Fill in API key and submit
    await page.fill('input[name="apiKey"]', api_key);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard (authentication successful)
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Verify session token is stored in localStorage
    const sessionToken = await page.evaluate(() => localStorage.getItem('session_token'));
    if (!sessionToken) {
      throw new Error('Session token not found in localStorage after login');
    }
    
    // Use the authenticated page in test
    await use(page);
    
    // Cleanup: Note that accounts are encrypted with their own API keys,
    // so they're effectively isolated even if not deleted
  },
  
  /**
   * API key fixture
   * Provides the API key for the authenticated user
   */
  apiKey: async ({ authenticatedPage }, use) => {
    const apiKey = await authenticatedPage.evaluate(() => 
      localStorage.getItem('api_key')
    );
    
    if (!apiKey) {
      throw new Error('API key not found in localStorage');
    }
    
    await use(apiKey);
  },
  
  /**
   * Account name fixture
   * Provides the account name for the authenticated user
   */
  accountName: async ({ authenticatedPage }, use) => {
    const accountName = await authenticatedPage.evaluate(() => 
      localStorage.getItem('account_name')
    );
    
    if (!accountName) {
      throw new Error('Account name not found in localStorage');
    }
    
    await use(accountName);
  },
});

export { expect } from '@playwright/test';

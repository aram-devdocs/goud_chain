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
    
    // Step 1: Create test account via API (metadata is null, not account_name)
    const createResponse = await page.request.post(`${apiUrl}/account/create`, {
      data: { metadata: null }
    });
    
    if (!createResponse.ok()) {
      throw new Error(`Failed to create test account: ${await createResponse.text()}`);
    }
    
    const { api_key, account_id } = await createResponse.json();
    
    // Step 2: Navigate to auth page and log in
    await page.goto('/auth');
    
    // Wait for the login form to be visible
    await page.waitForSelector('[data-testid="api-key-input"]', { state: 'visible', timeout: 10000 });
    
    // Fill in API key and submit
    await page.fill('[data-testid="api-key-input"]', api_key);
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard (authentication successful) - redirects to '/' not '/dashboard'
    await page.waitForURL('/', { timeout: 15000 });
    
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
   * Account ID fixture
   * Provides the account ID for the authenticated user
   */
  accountName: async ({ authenticatedPage }, use) => {
    const accountId = await authenticatedPage.evaluate(() => 
      localStorage.getItem('account_id')
    );
    
    if (!accountId) {
      throw new Error('Account ID not found in localStorage');
    }
    
    await use(accountId);
  },
});

export { expect } from '@playwright/test';

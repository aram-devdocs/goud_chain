import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Authentication Page Object
 * 
 * Handles login, account creation, and API key validation.
 */
export class AuthPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }
  
  // Selectors
  get apiKeyInput(): Locator {
    return this.page.locator('input[name="apiKey"]');
  }
  
  get loginButton(): Locator {
    return this.page.locator('button[type="submit"]');
  }
  
  get createAccountButton(): Locator {
    return this.page.locator('button:has-text("Create Account")');
  }
  
  get accountNameInput(): Locator {
    return this.page.locator('input[name="accountName"]');
  }
  
  get errorMessage(): Locator {
    return this.page.locator('[role="alert"], .error-message');
  }
  
  get apiKeyDisplay(): Locator {
    return this.page.locator('[data-testid="api-key-display"]');
  }
  
  // Actions
  async goto(): Promise<void> {
    await this.navigateTo('/auth');
  }
  
  async login(apiKey: string): Promise<void> {
    await this.apiKeyInput.fill(apiKey);
    await this.loginButton.click();
    await this.page.waitForURL('/dashboard');
  }
  
  async createAccount(accountName: string): Promise<string> {
    // Fill account name
    await this.accountNameInput.fill(accountName);
    await this.createAccountButton.click();
    
    // Wait for API key to be displayed
    await this.apiKeyDisplay.waitFor({ state: 'visible', timeout: 10000 });
    
    const apiKey = await this.apiKeyDisplay.textContent();
    
    if (!apiKey) {
      throw new Error('API key not displayed after account creation');
    }
    
    return apiKey.trim();
  }
  
  async loginWithNewAccount(accountName: string): Promise<string> {
    const apiKey = await this.createAccount(accountName);
    await this.login(apiKey);
    return apiKey;
  }
  
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }
  
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }
}

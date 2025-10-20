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
    return this.page.locator('[data-testid="api-key-input"]');
  }
  
  get loginButton(): Locator {
    return this.page.locator('[data-testid="login-button"]');
  }
  
  get createAccountTab(): Locator {
    return this.page.locator('[data-testid="create-account-tab"]');
  }
  
  get createAccountButton(): Locator {
    return this.page.locator('[data-testid="create-account-button"]');
  }
  
  get continueButton(): Locator {
    return this.page.locator('[data-testid="continue-to-dashboard-button"]');
  }
  
  get errorMessage(): Locator {
    return this.page.locator('[data-testid="login-error"]');
  }
  
  get apiKeyDisplay(): Locator {
    return this.page.locator('[data-testid="api-key-display"]');
  }
  
  get confirmCheckbox(): Locator {
    return this.page.locator('input[type="checkbox"]#confirm-saved');
  }
  
  // Actions
  async goto(): Promise<void> {
    await this.navigateTo('/auth');
  }
  
  async login(apiKey: string): Promise<void> {
    await this.apiKeyInput.fill(apiKey);
    await this.loginButton.click();
    await this.page.waitForURL('/');
  }
  
  async createAccount(): Promise<string> {
    // Switch to Create Account tab
    await this.createAccountTab.click();
    
    // Click Generate API Key button
    await this.createAccountButton.click();
    
    // Wait for API key to be displayed
    await this.apiKeyDisplay.waitFor({ state: 'visible', timeout: 10000 });
    
    const apiKey = await this.apiKeyDisplay.inputValue();
    
    if (!apiKey) {
      throw new Error('API key not displayed after account creation');
    }
    
    return apiKey.trim();
  }
  
  async loginWithNewAccount(): Promise<string> {
    const apiKey = await this.createAccount();
    
    // Check the confirmation checkbox
    await this.confirmCheckbox.check();
    
    // Click Continue to Dashboard
    await this.continueButton.click();
    
    // Wait for redirect to dashboard
    await this.page.waitForURL('/');
    
    return apiKey;
  }
  
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }
  
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }
}

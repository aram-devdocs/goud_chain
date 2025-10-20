import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object
 * 
 * Contains common selectors and utilities used across all page objects.
 * All page objects should extend this class for consistent behavior.
 */
export class BasePage {
  constructor(protected page: Page) {}
  
  // Common selectors
  get header(): Locator {
    return this.page.locator('header');
  }
  
  get navigation(): Locator {
    return this.page.locator('nav');
  }
  
  get toast(): Locator {
    return this.page.locator('[role="alert"], [data-testid="toast"]');
  }
  
  get loading(): Locator {
    return this.page.locator('[data-testid="loading"], [role="progressbar"]');
  }
  
  // Navigation methods
  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }
  
  async clickNavLink(linkText: string): Promise<void> {
    await this.page.click(`nav a:has-text("${linkText}")`);
    await this.waitForPageLoad();
  }
  
  // Wait utilities
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }
  
  async waitForToast(timeout = 5000): Promise<string> {
    await this.toast.waitFor({ state: 'visible', timeout });
    return await this.toast.textContent() || '';
  }
  
  async waitForLoadingComplete(timeout = 10000): Promise<void> {
    // Wait for loading indicator to disappear
    try {
      await this.loading.waitFor({ state: 'visible', timeout: 1000 });
      await this.loading.waitFor({ state: 'hidden', timeout });
    } catch {
      // Loading indicator may not appear for fast operations
    }
  }
  
  // Screenshot utilities
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `screenshots/${name}.png`,
      fullPage: true 
    });
  }
  
  // Form utilities
  async fillForm(data: Record<string, string>): Promise<void> {
    for (const [name, value] of Object.entries(data)) {
      await this.page.fill(`[name="${name}"]`, value);
    }
  }
  
  async submitForm(): Promise<void> {
    await this.page.click('button[type="submit"]');
  }
  
  // Table utilities
  async getTableRowCount(): Promise<number> {
    return await this.page.locator('table tbody tr').count();
  }
  
  async getTableCellText(row: number, column: number): Promise<string> {
    return await this.page.locator(`table tbody tr:nth-child(${row}) td:nth-child(${column})`).textContent() || '';
  }
  
  // Authentication utilities
  async getSessionToken(): Promise<string | null> {
    return await this.page.evaluate(() => localStorage.getItem('session_token'));
  }
  
  async getApiKey(): Promise<string | null> {
    return await this.page.evaluate(() => localStorage.getItem('api_key'));
  }
  
  async clearAuth(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('session_token');
      localStorage.removeItem('api_key');
      localStorage.removeItem('account_name');
    });
  }
}

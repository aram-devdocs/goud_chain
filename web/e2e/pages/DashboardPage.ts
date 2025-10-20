import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Dashboard Page Object
 * 
 * Main dashboard page with header, navigation, and WebSocket status.
 */
export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }
  
  // Selectors
  get welcomeMessage(): Locator {
    return this.page.locator('h1, [data-testid="welcome"]');
  }
  
  get logoutButton(): Locator {
    return this.page.locator('button:has-text("Logout")');
  }
  
  get refreshButton(): Locator {
    return this.page.locator('button:has-text("Refresh")');
  }
  
  get websocketStatus(): Locator {
    return this.page.locator('[data-testid="ws-status"]');
  }
  
  get accountId(): Locator {
    return this.page.locator('text=/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i');
  }
  
  get quickActions(): Locator {
    return this.page.locator('[data-testid="quick-actions"]');
  }
  
  get activityFeed(): Locator {
    return this.page.locator('[data-testid="activity-feed"]');
  }
  
  // Actions
  async goto(): Promise<void> {
    await this.navigateTo('/');
  }
  
  async logout(): Promise<void> {
    await this.logoutButton.click();
    await this.page.waitForURL('/auth');
  }
  
  async refresh(): Promise<void> {
    await this.refreshButton.click();
    await this.waitForLoadingComplete();
  }
  
  async isWebSocketConnected(): Promise<boolean> {
    try {
      const status = await this.websocketStatus.textContent();
      return status?.includes('Live') || false;
    } catch {
      return false;
    }
  }
  
  async getAccountId(): Promise<string> {
    try {
      return await this.accountId.textContent() || '';
    } catch {
      return '';
    }
  }
  
  async navigateToSubmit(): Promise<void> {
    await this.clickNavLink('Submit Data');
  }
  
  async navigateToCollections(): Promise<void> {
    await this.clickNavLink('Collections');
  }
  
  async navigateToExplorer(): Promise<void> {
    await this.clickNavLink('Explorer');
  }
  
  async navigateToNetwork(): Promise<void> {
    await this.clickNavLink('Network');
  }
  
  async navigateToAnalytics(): Promise<void> {
    await this.clickNavLink('Analytics');
  }
  
  async navigateToAudit(): Promise<void> {
    await this.clickNavLink('Audit');
  }
  
  async navigateToMetrics(): Promise<void> {
    await this.clickNavLink('Metrics');
  }
  
  async navigateToDebug(): Promise<void> {
    await this.clickNavLink('Debug');
  }
  
  async getQuickActionCount(): Promise<number> {
    return await this.quickActions.locator('button').count();
  }
  
  async getActivityFeedItems(): Promise<number> {
    return await this.activityFeed.locator('[data-testid="activity-item"]').count();
  }
}

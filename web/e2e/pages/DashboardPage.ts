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
  
  get accountName(): Locator {
    return this.page.locator('[data-testid="account-name"]');
  }
  
  get quickActions(): Locator {
    return this.page.locator('[data-testid="quick-actions"]');
  }
  
  get activityFeed(): Locator {
    return this.page.locator('[data-testid="activity-feed"]');
  }
  
  // Actions
  async goto(): Promise<void> {
    await this.navigateTo('/dashboard');
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
    const status = await this.websocketStatus.textContent();
    return status?.includes('Connected') || false;
  }
  
  async getAccountName(): Promise<string> {
    return await this.accountName.textContent() || '';
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

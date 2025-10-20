import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Metrics Page Object
 * 
 * Handles system metrics, Prometheus endpoint, and cache statistics.
 */
export class MetricsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }
  
  // Selectors
  get systemMetrics(): Locator {
    return this.page.locator('[data-testid="system-metrics"]');
  }
  
  get metricCards(): Locator {
    return this.systemMetrics.locator('[data-testid="metric-card"]');
  }
  
  get cacheStatistics(): Locator {
    return this.page.locator('[data-testid="cache-statistics"]');
  }
  
  get prometheusLink(): Locator {
    return this.page.locator('a:has-text("Prometheus Endpoint")');
  }
  
  get refreshButton(): Locator {
    return this.page.locator('button:has-text("Refresh")');
  }
  
  get autoRefreshToggle(): Locator {
    return this.page.locator('[data-testid="auto-refresh-toggle"]');
  }
  
  // Actions
  async goto(): Promise<void> {
    await this.navigateTo('/metrics');
  }
  
  async getMetricCount(): Promise<number> {
    return await this.metricCards.count();
  }
  
  async getMetric(index: number): Promise<{
    label: string;
    value: string;
    timestamp: string;
  }> {
    const card = this.metricCards.nth(index);
    
    return {
      label: await card.locator('[data-testid="metric-label"]').textContent() || '',
      value: await card.locator('[data-testid="metric-value"]').textContent() || '',
      timestamp: await card.locator('[data-testid="metric-timestamp"]').textContent() || '',
    };
  }
  
  async getCacheStatistics(): Promise<{
    hitRate: string;
    size: string;
    evictions: string;
  }> {
    return {
      hitRate: await this.cacheStatistics.locator('[data-testid="cache-hit-rate"]').textContent() || '',
      size: await this.cacheStatistics.locator('[data-testid="cache-size"]').textContent() || '',
      evictions: await this.cacheStatistics.locator('[data-testid="cache-evictions"]').textContent() || '',
    };
  }
  
  async refresh(): Promise<void> {
    await this.refreshButton.click();
    await this.waitForLoadingComplete();
  }
  
  async toggleAutoRefresh(): Promise<void> {
    await this.autoRefreshToggle.click();
  }
  
  async isAutoRefreshEnabled(): Promise<boolean> {
    return await this.autoRefreshToggle.isChecked();
  }
  
  async openPrometheusEndpoint(): Promise<void> {
    await this.prometheusLink.click();
  }
}

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Analytics Page Object
 * 
 * Handles metrics charts, statistics, and time range selector.
 */
export class AnalyticsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }
  
  // Selectors
  get metricsCharts(): Locator {
    return this.page.locator('[data-testid="metrics-charts"]');
  }
  
  get statisticsCards(): Locator {
    return this.page.locator('[data-testid="statistics-card"]');
  }
  
  get timeRangeSelector(): Locator {
    return this.page.locator('[data-testid="time-range-selector"]');
  }
  
  get exportButton(): Locator {
    return this.page.locator('button:has-text("Export")');
  }
  
  get chartLabels(): Locator {
    return this.metricsCharts.locator('[data-testid="chart-label"]');
  }
  
  // Actions
  async goto(): Promise<void> {
    await this.navigateTo('/analytics');
  }
  
  async getStatisticsCount(): Promise<number> {
    return await this.statisticsCards.count();
  }
  
  async getStatistic(index: number): Promise<{
    label: string;
    value: string;
  }> {
    const card = this.statisticsCards.nth(index);
    
    return {
      label: await card.locator('[data-testid="stat-label"]').textContent() || '',
      value: await card.locator('[data-testid="stat-value"]').textContent() || '',
    };
  }
  
  async selectTimeRange(range: '1h' | '24h' | '7d' | '30d'): Promise<void> {
    await this.timeRangeSelector.selectOption(range);
    await this.waitForLoadingComplete();
  }
  
  async exportData(): Promise<void> {
    await this.exportButton.click();
    // Wait for download to start
    await this.page.waitForTimeout(1000);
  }
  
  async getChartCount(): Promise<number> {
    return await this.chartLabels.count();
  }
}

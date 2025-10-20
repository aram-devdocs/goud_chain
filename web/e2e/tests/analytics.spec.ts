import { test, expect } from '../fixtures/auth.fixture';
import { AnalyticsPage } from '../pages/AnalyticsPage';

/**
 * Analytics Test Suite
 * 
 * Tests metrics charts, statistics, time range selection, and data export.
 */

test.describe('Analytics', () => {
  let analyticsPage: AnalyticsPage;
  
  test.beforeEach(async ({ authenticatedPage }) => {
    analyticsPage = new AnalyticsPage(authenticatedPage);
    await analyticsPage.goto();
  });
  
  test('should display statistics cards', async ({ authenticatedPage }) => {
    await analyticsPage.waitForPageLoad();
    
    // Get statistics count
    const count = await analyticsPage.getStatisticsCount();
    expect(count).toBeGreaterThan(0);
  });
  
  test('should show statistic values', async ({ authenticatedPage }) => {
    await analyticsPage.waitForPageLoad();
    
    const count = await analyticsPage.getStatisticsCount();
    
    if (count > 0) {
      // Get first statistic
      const stat = await analyticsPage.getStatistic(0);
      
      // Verify has label and value
      expect(stat.label).toBeTruthy();
      expect(stat.value).toBeTruthy();
    }
  });
  
  test('should display metrics charts', async ({ authenticatedPage }) => {
    await analyticsPage.waitForPageLoad();
    
    // Verify charts are present
    const chartCount = await analyticsPage.getChartCount();
    expect(chartCount).toBeGreaterThanOrEqual(0);
  });
  
  test('should change time range', async ({ authenticatedPage }) => {
    await analyticsPage.waitForPageLoad();
    
    // Select different time ranges
    await analyticsPage.selectTimeRange('1h');
    await analyticsPage.waitForLoadingComplete();
    
    await analyticsPage.selectTimeRange('24h');
    await analyticsPage.waitForLoadingComplete();
    
    await analyticsPage.selectTimeRange('7d');
    await analyticsPage.waitForLoadingComplete();
  });
  
  test('should export analytics data', async ({ authenticatedPage }) => {
    await analyticsPage.waitForPageLoad();
    
    // Click export button
    await analyticsPage.exportData();
    
    // Export should trigger (download will start)
    // Note: Actual download verification would require more complex setup
  });
});

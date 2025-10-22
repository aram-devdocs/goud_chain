import { test, expect } from '../fixtures/auth.fixture'
import { MetricsPage } from '../pages/MetricsPage'

/**
 * Metrics Test Suite
 *
 * Tests system metrics display, cache statistics, and auto-refresh.
 */

test.describe('System Metrics', () => {
  let metricsPage: MetricsPage

  test.beforeEach(async ({ authenticatedPage }) => {
    metricsPage = new MetricsPage(authenticatedPage)
    await metricsPage.goto()
  })

  test('should display system metrics', async ({ authenticatedPage }) => {
    await metricsPage.waitForPageLoad()

    // Get metric count
    const count = await metricsPage.getMetricCount()
    expect(count).toBeGreaterThan(0)
  })

  test('should show metric details', async ({ authenticatedPage }) => {
    await metricsPage.waitForPageLoad()

    const count = await metricsPage.getMetricCount()

    if (count > 0) {
      // Get first metric
      const metric = await metricsPage.getMetric(0)

      // Verify required fields
      expect(metric.label).toBeTruthy()
      expect(metric.value).toBeTruthy()
      expect(metric.timestamp).toBeTruthy()
    }
  })

  test('should display cache statistics', async ({ authenticatedPage }) => {
    await metricsPage.waitForPageLoad()

    // Get cache stats
    const cacheStats = await metricsPage.getCacheStatistics()

    // Verify cache stats are present
    expect(cacheStats.hitRate).toBeTruthy()
    expect(cacheStats.size).toBeTruthy()
    expect(cacheStats.evictions).toBeTruthy()
  })

  test('should refresh metrics', async ({ authenticatedPage }) => {
    await metricsPage.waitForPageLoad()

    // Get initial metrics
    const initialMetric = await metricsPage.getMetric(0)

    // Refresh
    await metricsPage.refresh()

    // Get updated metrics
    const updatedMetric = await metricsPage.getMetric(0)

    // Labels should match (same metrics)
    expect(updatedMetric.label).toBe(initialMetric.label)
  })

  test('should toggle auto-refresh', async ({ authenticatedPage }) => {
    await metricsPage.waitForPageLoad()

    // Enable auto-refresh
    await metricsPage.toggleAutoRefresh()
    const enabled = await metricsPage.isAutoRefreshEnabled()
    expect(enabled).toBe(true)

    // Disable auto-refresh
    await metricsPage.toggleAutoRefresh()
    const disabled = await metricsPage.isAutoRefreshEnabled()
    expect(disabled).toBe(false)
  })
})

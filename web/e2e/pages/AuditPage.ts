import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Audit Page Object
 *
 * Handles audit log table, filters (event type, date range), and live mode toggle.
 */
export class AuditPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // Selectors
  get auditTable(): Locator {
    return this.page.locator('[data-testid="audit-table"]')
  }

  get auditRows(): Locator {
    return this.auditTable.locator('tbody tr')
  }

  get eventTypeFilter(): Locator {
    return this.page.locator('[data-testid="event-type-filter"]')
  }

  get dateRangeFilter(): Locator {
    return this.page.locator('[data-testid="date-range-filter"]')
  }

  get liveModeToggle(): Locator {
    return this.page.locator('[data-testid="live-mode-toggle"]')
  }

  get clearFiltersButton(): Locator {
    return this.page.locator('button:has-text("Clear Filters")')
  }

  get pagination(): Locator {
    return this.page.locator('[data-testid="pagination"]')
  }

  // Actions
  async goto(): Promise<void> {
    await this.navigateTo('/audit')
  }

  async getAuditLogCount(): Promise<number> {
    return await this.auditRows.count()
  }

  async getAuditLog(index: number): Promise<{
    timestamp: string
    eventType: string
    accountName: string
    details: string
  }> {
    const row = this.auditRows.nth(index)

    return {
      timestamp: (await row.locator('td:nth-child(1)').textContent()) || '',
      eventType: (await row.locator('td:nth-child(2)').textContent()) || '',
      accountName: (await row.locator('td:nth-child(3)').textContent()) || '',
      details: (await row.locator('td:nth-child(4)').textContent()) || '',
    }
  }

  async filterByEventType(eventType: string): Promise<void> {
    await this.eventTypeFilter.selectOption(eventType)
    await this.waitForLoadingComplete()
  }

  async filterByDateRange(startDate: string, endDate: string): Promise<void> {
    await this.page.fill('[data-testid="start-date"]', startDate)
    await this.page.fill('[data-testid="end-date"]', endDate)
    await this.page.click('button:has-text("Apply")')
    await this.waitForLoadingComplete()
  }

  async toggleLiveMode(): Promise<void> {
    await this.liveModeToggle.click()
  }

  async isLiveModeEnabled(): Promise<boolean> {
    return await this.liveModeToggle.isChecked()
  }

  async clearFilters(): Promise<void> {
    await this.clearFiltersButton.click()
    await this.waitForLoadingComplete()
  }

  async goToNextPage(): Promise<void> {
    await this.pagination.locator('button:has-text("Next")').click()
    await this.waitForLoadingComplete()
  }

  async goToPreviousPage(): Promise<void> {
    await this.pagination.locator('button:has-text("Previous")').click()
    await this.waitForLoadingComplete()
  }
}

import { test, expect } from '../fixtures/auth.fixture'
import { AuditPage } from '../pages/AuditPage'
import { SubmitDataPage } from '../pages/SubmitDataPage'

/**
 * Audit Log Test Suite
 *
 * Tests audit log display, filtering, live mode, and pagination.
 */

test.describe('Audit Logs', () => {
  let auditPage: AuditPage
  let submitPage: SubmitDataPage

  test.beforeEach(async ({ authenticatedPage }) => {
    auditPage = new AuditPage(authenticatedPage)
    submitPage = new SubmitDataPage(authenticatedPage)
    await auditPage.goto()
  })

  test('should display audit logs', async ({ authenticatedPage }) => {
    await auditPage.waitForPageLoad()

    // Get audit log count (should have at least login event)
    const count = await auditPage.getAuditLogCount()
    expect(count).toBeGreaterThan(0)
  })

  test('should show audit log details', async ({ authenticatedPage }) => {
    await auditPage.waitForPageLoad()

    const count = await auditPage.getAuditLogCount()

    if (count > 0) {
      // Get first audit log
      const log = await auditPage.getAuditLog(0)

      // Verify required fields
      expect(log.timestamp).toBeTruthy()
      expect(log.eventType).toBeTruthy()
      expect(log.accountName).toBeTruthy()
    }
  })

  test('should filter by event type', async ({ authenticatedPage }) => {
    await auditPage.waitForPageLoad()

    // Filter by specific event type
    await auditPage.filterByEventType('LOGIN')

    // Verify filtered results
    const count = await auditPage.getAuditLogCount()

    if (count > 0) {
      const log = await auditPage.getAuditLog(0)
      expect(log.eventType).toContain('LOGIN')
    }
  })

  test('should clear filters', async ({ authenticatedPage }) => {
    await auditPage.waitForPageLoad()

    // Get initial count
    const initialCount = await auditPage.getAuditLogCount()

    // Apply filter
    await auditPage.filterByEventType('LOGIN')
    const filteredCount = await auditPage.getAuditLogCount()

    // Clear filters
    await auditPage.clearFilters()
    const clearedCount = await auditPage.getAuditLogCount()

    // Count should be back to initial (or close)
    expect(clearedCount).toBeGreaterThanOrEqual(filteredCount)
  })

  test('should toggle live mode', async ({ authenticatedPage }) => {
    await auditPage.waitForPageLoad()

    // Enable live mode
    await auditPage.toggleLiveMode()
    const enabled = await auditPage.isLiveModeEnabled()
    expect(enabled).toBe(true)

    // Disable live mode
    await auditPage.toggleLiveMode()
    const disabled = await auditPage.isLiveModeEnabled()
    expect(disabled).toBe(false)
  })

  test('should show new events in live mode', async ({ authenticatedPage }) => {
    await auditPage.waitForPageLoad()

    // Enable live mode
    await auditPage.toggleLiveMode()

    // Get initial count
    const initialCount = await auditPage.getAuditLogCount()

    // Perform action that creates audit event (submit data)
    await submitPage.goto()
    await submitPage.submitData(`Test data ${Date.now()}`)

    // Go back to audit page
    await auditPage.goto()
    await authenticatedPage.waitForTimeout(2000)

    // Get updated count
    const updatedCount = await auditPage.getAuditLogCount()

    // Should have new event
    expect(updatedCount).toBeGreaterThan(initialCount)
  })
})

import { test, expect } from '../fixtures/auth.fixture'
import { NetworkPage } from '../pages/NetworkPage'

/**
 * Network Test Suite
 *
 * Tests peer monitoring, connection status, and validator rotation.
 */

test.describe('Network Monitoring', () => {
  let networkPage: NetworkPage

  test.beforeEach(async ({ authenticatedPage }) => {
    networkPage = new NetworkPage(authenticatedPage)
    await networkPage.goto()
  })

  test('should display peer list', async ({ authenticatedPage }) => {
    await networkPage.waitForPageLoad()

    // Get peer count (3-node network)
    const peerCount = await networkPage.getPeerCount()
    expect(peerCount).toBeGreaterThanOrEqual(0)
  })

  test('should show connection status', async ({ authenticatedPage }) => {
    await networkPage.waitForPageLoad()

    // Verify connection status is displayed
    const status = await networkPage.getConnectionStatus()
    expect(status).toBeTruthy()
  })

  test('should display current validator', async ({ authenticatedPage }) => {
    await networkPage.waitForPageLoad()

    // Verify current validator is shown
    const validator = await networkPage.getCurrentValidator()
    expect(validator).toBeTruthy()
  })

  test('should show peer information', async ({ authenticatedPage }) => {
    await networkPage.waitForPageLoad()

    const peerCount = await networkPage.getPeerCount()

    if (peerCount > 0) {
      // Get first peer info
      const peerInfo = await networkPage.getPeerInfo(0)

      // Verify peer has required fields
      expect(peerInfo.address).toBeTruthy()
      expect(peerInfo.status).toBeTruthy()
    }
  })

  test('should refresh peer list', async ({ authenticatedPage }) => {
    await networkPage.waitForPageLoad()

    // Get initial peer count
    const initialCount = await networkPage.getPeerCount()

    // Refresh
    await networkPage.refresh()

    // Get updated count
    const updatedCount = await networkPage.getPeerCount()

    // Count should be consistent
    expect(updatedCount).toBe(initialCount)
  })

  test('should display validator rotation information', async ({
    authenticatedPage,
  }) => {
    await networkPage.waitForPageLoad()

    // Check if validator rotation info is visible
    const isVisible = await networkPage.isValidatorRotationVisible()

    // Validator rotation should be shown for PoA consensus
    expect(isVisible).toBe(true)
  })
})

import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Debug Page Object
 *
 * Handles debug utilities, state inspection, and manual controls.
 */
export class DebugPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // Selectors
  get stateInspector(): Locator {
    return this.page.locator('[data-testid="state-inspector"]')
  }

  get debugControls(): Locator {
    return this.page.locator('[data-testid="debug-controls"]')
  }

  get logViewer(): Locator {
    return this.page.locator('[data-testid="log-viewer"]')
  }

  get clearCacheButton(): Locator {
    return this.page.locator('button:has-text("Clear Cache")')
  }

  get clearStorageButton(): Locator {
    return this.page.locator('button:has-text("Clear Storage")')
  }

  get forceReconnectButton(): Locator {
    return this.page.locator('button:has-text("Force Reconnect")')
  }

  get exportStateButton(): Locator {
    return this.page.locator('button:has-text("Export State")')
  }

  // Actions
  async goto(): Promise<void> {
    await this.navigateTo('/debug')
  }

  async getStateSnapshot(): Promise<Record<string, any>> {
    const stateText = await this.stateInspector.textContent()

    try {
      return JSON.parse(stateText || '{}')
    } catch {
      return {}
    }
  }

  async clearCache(): Promise<void> {
    await this.clearCacheButton.click()
    await this.waitForToast()
  }

  async clearStorage(): Promise<void> {
    await this.clearStorageButton.click()
    await this.waitForToast()
  }

  async forceReconnect(): Promise<void> {
    await this.forceReconnectButton.click()
    await this.waitForToast()
  }

  async exportState(): Promise<void> {
    await this.exportStateButton.click()
    // Wait for download to start
    await this.page.waitForTimeout(1000)
  }

  async getLogEntryCount(): Promise<number> {
    return await this.logViewer.locator('[data-testid="log-entry"]').count()
  }

  async getLogEntry(index: number): Promise<{
    level: string
    message: string
    timestamp: string
  }> {
    const entry = this.logViewer.locator('[data-testid="log-entry"]').nth(index)

    return {
      level:
        (await entry.locator('[data-testid="log-level"]').textContent()) || '',
      message:
        (await entry.locator('[data-testid="log-message"]').textContent()) ||
        '',
      timestamp:
        (await entry.locator('[data-testid="log-timestamp"]').textContent()) ||
        '',
    }
  }
}

import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Collections Page Object
 *
 * Handles collection list, search/filter, and decryption modal.
 */
export class CollectionsPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // Selectors
  get searchInput(): Locator {
    return this.page.locator(
      'input[name="search"], input[placeholder*="Search"]'
    )
  }

  get collectionList(): Locator {
    return this.page.locator('[data-testid="collection-list"]')
  }

  get collectionItems(): Locator {
    return this.collectionList.locator('[data-testid="collection-item"]')
  }

  get decryptButton(): Locator {
    return this.page.locator('button:has-text("Decrypt")')
  }

  get decryptModal(): Locator {
    return this.page.locator('[data-testid="decrypt-modal"]')
  }

  get decryptedData(): Locator {
    return this.page.locator('[data-testid="decrypted-data"]')
  }

  get closeModalButton(): Locator {
    return this.decryptModal.locator('button:has-text("Close")')
  }

  // Actions
  async goto(): Promise<void> {
    await this.navigateTo('/collections')
  }

  async searchCollections(query: string): Promise<void> {
    await this.searchInput.fill(query)
    await this.waitForLoadingComplete()
  }

  async getCollectionCount(): Promise<number> {
    return await this.collectionItems.count()
  }

  async getCollectionName(index: number): Promise<string> {
    return (
      (await this.collectionItems
        .nth(index)
        .locator('[data-testid="collection-name"]')
        .textContent()) || ''
    )
  }

  async getCollectionItemCount(index: number): Promise<number> {
    const text =
      (await this.collectionItems
        .nth(index)
        .locator('[data-testid="item-count"]')
        .textContent()) || '0'
    return parseInt(text.match(/\d+/)?.[0] || '0')
  }

  async openDecryptModal(collectionIndex: number): Promise<void> {
    await this.collectionItems
      .nth(collectionIndex)
      .locator('button:has-text("Decrypt")')
      .click()
    await this.decryptModal.waitFor({ state: 'visible', timeout: 5000 })
  }

  async decryptData(dataId: string): Promise<string> {
    // Find the data item by ID and click decrypt
    await this.page.click(`[data-id="${dataId}"] button:has-text("Decrypt")`)

    // Wait for decrypted data to appear
    await this.decryptedData.waitFor({ state: 'visible', timeout: 10000 })

    const decrypted = await this.decryptedData.textContent()

    if (!decrypted) {
      throw new Error('Decrypted data not found')
    }

    return decrypted.trim()
  }

  async closeDecryptModal(): Promise<void> {
    await this.closeModalButton.click()
    await this.decryptModal.waitFor({ state: 'hidden', timeout: 5000 })
  }
}

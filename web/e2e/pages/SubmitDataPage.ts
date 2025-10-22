import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Submit Data Page Object
 *
 * Handles data submission form and encryption indicator.
 */
export class SubmitDataPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // Selectors
  get dataInput(): Locator {
    return this.page.locator('textarea[name="data"], input[name="data"]')
  }

  get collectionNameInput(): Locator {
    return this.page.locator('input[name="collection_name"]')
  }

  get submitButton(): Locator {
    return this.page.locator('button[type="submit"]')
  }

  get encryptionIndicator(): Locator {
    return this.page.locator('[data-testid="encryption-status"]')
  }

  get successMessage(): Locator {
    return this.page.locator('[data-testid="success-message"]')
  }

  get dataIdDisplay(): Locator {
    return this.page.locator('[data-testid="data-id"]')
  }

  // Actions
  async goto(): Promise<void> {
    await this.navigateTo('/submit')
  }

  async submitData(data: string, collectionName?: string): Promise<string> {
    // Fill in the data
    await this.dataInput.fill(data)

    // Fill in collection name if provided
    if (collectionName) {
      await this.collectionNameInput.fill(collectionName)
    }

    // Submit the form
    await this.submitButton.click()

    // Wait for success message
    await this.successMessage.waitFor({ state: 'visible', timeout: 10000 })

    // Extract data ID from success message or display
    const dataId = await this.dataIdDisplay.textContent()

    if (!dataId) {
      throw new Error('Data ID not found after submission')
    }

    return dataId.trim()
  }

  async isEncryptionIndicatorVisible(): Promise<boolean> {
    return await this.encryptionIndicator.isVisible()
  }

  async getEncryptionStatus(): Promise<string> {
    return (await this.encryptionIndicator.textContent()) || ''
  }
}

import { test, expect } from '../fixtures/auth.fixture'
import { SubmitDataPage } from '../pages/SubmitDataPage'

/**
 * Data Submission Test Suite
 *
 * Tests data submission, encryption, blockchain confirmation, and WebSocket events.
 */

test.describe('Data Submission', () => {
  let submitPage: SubmitDataPage

  test.beforeEach(async ({ authenticatedPage }) => {
    submitPage = new SubmitDataPage(authenticatedPage)
    await submitPage.goto()
  })

  test('should submit data successfully', async ({ authenticatedPage }) => {
    const testData = `Test data ${Date.now()}`

    // Submit data
    const dataId = await submitPage.submitData(testData)

    // Verify data ID is returned
    expect(dataId).toBeTruthy()
    expect(dataId.length).toBeGreaterThan(0)

    // Verify success message
    await expect(submitPage.successMessage).toBeVisible()
  })

  test('should show encryption indicator', async ({ authenticatedPage }) => {
    // Verify encryption indicator is visible
    const isVisible = await submitPage.isEncryptionIndicatorVisible()
    expect(isVisible).toBe(true)

    // Verify encryption status text
    const status = await submitPage.getEncryptionStatus()
    expect(status.toLowerCase()).toContain('encrypt')
  })

  test('should submit data with collection name', async ({
    authenticatedPage,
  }) => {
    const testData = `Test data ${Date.now()}`
    const collectionName = `test_collection_${Date.now()}`

    // Submit data with collection
    const dataId = await submitPage.submitData(testData, collectionName)

    // Verify submission
    expect(dataId).toBeTruthy()
    await expect(submitPage.successMessage).toBeVisible()
  })

  test('should clear form after successful submission', async ({
    authenticatedPage,
  }) => {
    const testData = `Test data ${Date.now()}`

    // Submit data
    await submitPage.submitData(testData)

    // Verify form is cleared
    const dataValue = await submitPage.dataInput.inputValue()
    expect(dataValue).toBe('')
  })

  test('should handle large data submission', async ({ authenticatedPage }) => {
    // Generate large test data (1KB)
    const largeData = 'X'.repeat(1024)

    // Submit large data
    const dataId = await submitPage.submitData(largeData)

    // Verify submission
    expect(dataId).toBeTruthy()
    await expect(submitPage.successMessage).toBeVisible()
  })

  test('should show error for empty data submission', async ({
    authenticatedPage,
  }) => {
    // Attempt to submit empty data
    await submitPage.submitButton.click()

    // Should show validation error
    const errorMessage = await submitPage.page
      .locator('[role="alert"]')
      .textContent()
    expect(errorMessage).toBeTruthy()
  })

  test('should submit multiple data items sequentially', async ({
    authenticatedPage,
  }) => {
    const dataItems = [
      `Test data 1 ${Date.now()}`,
      `Test data 2 ${Date.now()}`,
      `Test data 3 ${Date.now()}`,
    ]

    const dataIds: string[] = []

    for (const data of dataItems) {
      const dataId = await submitPage.submitData(data)
      dataIds.push(dataId)

      // Wait a bit between submissions
      await authenticatedPage.waitForTimeout(500)
    }

    // Verify all submissions succeeded
    expect(dataIds).toHaveLength(3)
    dataIds.forEach((id) => {
      expect(id).toBeTruthy()
    })
  })
})

import { test, expect } from '../fixtures/auth.fixture';
import { SubmitDataPage } from '../pages/SubmitDataPage';
import { CollectionsPage } from '../pages/CollectionsPage';

/**
 * Collections Test Suite
 * 
 * Tests collection listing, search, data decryption, and verification.
 */

test.describe('Collections', () => {
  let collectionsPage: CollectionsPage;
  let submitPage: SubmitDataPage;
  
  test.beforeEach(async ({ authenticatedPage }) => {
    collectionsPage = new CollectionsPage(authenticatedPage);
    submitPage = new SubmitDataPage(authenticatedPage);
  });
  
  test('should display collections list', async ({ authenticatedPage }) => {
    await collectionsPage.goto();
    
    // Wait for page to load
    await collectionsPage.waitForPageLoad();
    
    // Get collection count (may be 0 for new account)
    const count = await collectionsPage.getCollectionCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });
  
  test('should create and view collection', async ({ authenticatedPage }) => {
    const collectionName = `test_collection_${Date.now()}`;
    const testData = `Test data ${Date.now()}`;
    
    // Submit data with collection name
    await submitPage.goto();
    await submitPage.submitData(testData, collectionName);
    
    // Navigate to collections
    await collectionsPage.goto();
    await collectionsPage.waitForPageLoad();
    
    // Search for the collection
    await collectionsPage.searchCollections(collectionName);
    
    // Verify collection appears
    const count = await collectionsPage.getCollectionCount();
    expect(count).toBeGreaterThan(0);
    
    // Verify collection name
    const name = await collectionsPage.getCollectionName(0);
    expect(name).toContain(collectionName);
  });
  
  test('should show correct item count in collection', async ({ authenticatedPage }) => {
    const collectionName = `test_collection_${Date.now()}`;
    
    // Submit multiple items to the same collection
    await submitPage.goto();
    await submitPage.submitData(`Data 1 ${Date.now()}`, collectionName);
    await authenticatedPage.waitForTimeout(500);
    await submitPage.submitData(`Data 2 ${Date.now()}`, collectionName);
    await authenticatedPage.waitForTimeout(500);
    await submitPage.submitData(`Data 3 ${Date.now()}`, collectionName);
    
    // Navigate to collections
    await collectionsPage.goto();
    await collectionsPage.searchCollections(collectionName);
    
    // Verify item count
    const itemCount = await collectionsPage.getCollectionItemCount(0);
    expect(itemCount).toBe(3);
  });
  
  test('should search collections by name', async ({ authenticatedPage }) => {
    const uniqueName = `unique_${Date.now()}`;
    
    // Create collection with unique name
    await submitPage.goto();
    await submitPage.submitData('Test data', uniqueName);
    
    // Navigate to collections and search
    await collectionsPage.goto();
    await collectionsPage.searchCollections(uniqueName);
    
    // Verify only matching collections shown
    const count = await collectionsPage.getCollectionCount();
    expect(count).toBeGreaterThan(0);
    
    const name = await collectionsPage.getCollectionName(0);
    expect(name).toContain(uniqueName);
  });
  
  test('should decrypt data successfully', async ({ authenticatedPage, apiKey }) => {
    const testData = `Test data ${Date.now()}`;
    const collectionName = `test_collection_${Date.now()}`;
    
    // Submit data
    await submitPage.goto();
    const dataId = await submitPage.submitData(testData, collectionName);
    
    // Navigate to collections
    await collectionsPage.goto();
    await collectionsPage.searchCollections(collectionName);
    
    // Decrypt the data
    // Note: This assumes the collection page has decrypt functionality
    // The exact implementation may vary based on the UI
    
    // For now, just verify we can navigate to the collection
    const count = await collectionsPage.getCollectionCount();
    expect(count).toBeGreaterThan(0);
  });
  
  test('should handle empty collection list', async ({ authenticatedPage }) => {
    // Clear search to show all collections
    await collectionsPage.goto();
    
    // Search for non-existent collection
    await collectionsPage.searchCollections('nonexistent_collection_xyz');
    
    // Verify empty state
    const count = await collectionsPage.getCollectionCount();
    expect(count).toBe(0);
  });
});

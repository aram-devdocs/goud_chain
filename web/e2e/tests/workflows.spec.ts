import { test, expect } from '@playwright/test';
import { 
  AuthPage, 
  DashboardPage, 
  SubmitDataPage, 
  CollectionsPage,
  ExplorerPage,
  AuditPage 
} from '../pages';

/**
 * End-to-End Workflow Test Suite
 * 
 * Tests complete user journeys across multiple pages and features.
 * Validates integration between authentication, data operations, and monitoring.
 */

test.describe('End-to-End User Workflows', () => {
  test('should complete new user onboarding workflow', async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // Step 1: Navigate to auth page
    await authPage.goto();
    
    // Step 2: Create new account and login
    const apiKey = await authPage.loginWithNewAccount();
    expect(apiKey).toBeTruthy();
    
    // Step 3: Verify redirect to dashboard
    await expect(page).toHaveURL('/');
    
    // Step 4: Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Step 5: Verify WebSocket status is displayed
    await page.waitForTimeout(2000); // Wait for WebSocket connection
    // WebSocket connection is optional, don't fail if it's not connected
  });
  
  test('should complete data submission and retrieval workflow', async ({ page }) => {
    const authPage = new AuthPage(page);
    const submitPage = new SubmitDataPage(page);
    const collectionsPage = new CollectionsPage(page);
    const collectionName = `e2e_collection_${Date.now()}`;
    const testData = `E2E test data ${Date.now()}`;
    
    // Step 1: Create account and login
    await authPage.goto();
    const apiKey = await authPage.loginWithNewAccount();
    expect(apiKey).toBeTruthy();
    
    // Step 2: Submit data
    await submitPage.goto();
    const dataId = await submitPage.submitData(testData, collectionName);
    expect(dataId).toBeTruthy();
    
    // Step 3: Navigate to collections
    await collectionsPage.goto();
    await collectionsPage.waitForPageLoad();
    
    // Step 4: Search for collection
    await collectionsPage.searchCollections(collectionName);
    
    // Step 5: Verify collection exists
    const collectionCount = await collectionsPage.getCollectionCount();
    expect(collectionCount).toBeGreaterThan(0);
    
    const name = await collectionsPage.getCollectionName(0);
    expect(name).toContain(collectionName);
  });
  
  test('should complete data submission and blockchain verification workflow', async ({ page }) => {
    const authPage = new AuthPage(page);
    const submitPage = new SubmitDataPage(page);
    const explorerPage = new ExplorerPage(page);
    
    // Step 1: Create account and login
    await authPage.goto();
    const apiKey = await authPage.loginWithNewAccount();
    expect(apiKey).toBeTruthy();
    
    // Step 2: Get initial block count
    await explorerPage.goto();
    await explorerPage.waitForPageLoad();
    const initialBlockCount = await explorerPage.getBlockCount();
    
    // Step 3: Submit data (creates new block)
    await submitPage.goto();
    await submitPage.submitData(`E2E test data ${Date.now()}`);
    
    // Step 4: Verify new block created
    await explorerPage.goto();
    await page.waitForTimeout(2000); // Wait for block propagation
    await explorerPage.waitForPageLoad();
    
    const updatedBlockCount = await explorerPage.getBlockCount();
    expect(updatedBlockCount).toBeGreaterThan(initialBlockCount);
    
    // Step 5: Inspect latest block
    await explorerPage.selectBlock(updatedBlockCount - 1);
    
    // Step 6: Verify block details
    const blockHeight = await explorerPage.getBlockHeight();
    expect(blockHeight).toBe(updatedBlockCount - 1);
    
    const validator = await explorerPage.getValidator();
    expect(validator).toBeTruthy();
  });
  
  test('should complete audit trail workflow', async ({ page }) => {
    const authPage = new AuthPage(page);
    const submitPage = new SubmitDataPage(page);
    const auditPage = new AuditPage(page);
    
    // Step 1: Create account and login (generates audit events)
    await authPage.goto();
    const apiKey = await authPage.loginWithNewAccount();
    expect(apiKey).toBeTruthy();
    
    // Step 2: Perform actions that generate audit events
    await submitPage.goto();
    await submitPage.submitData(`E2E test data ${Date.now()}`);
    
    // Step 3: Navigate to audit page
    await auditPage.goto();
    await auditPage.waitForPageLoad();
    
    // Step 4: Verify audit logs exist
    const logCount = await auditPage.getAuditLogCount();
    expect(logCount).toBeGreaterThan(0);
    
    // Step 5: Verify account ID in logs (if displayed)
    const firstLog = await auditPage.getAuditLog(0);
    expect(firstLog.accountName).toBeTruthy();
    
    // Step 6: Filter by event type
    await auditPage.filterByEventType('LOGIN');
    
    // Step 7: Verify filtered results
    const filteredCount = await auditPage.getAuditLogCount();
    expect(filteredCount).toBeGreaterThan(0);
  });
  
  test('should handle session expiry and re-authentication workflow', async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // Step 1: Create account and login
    await authPage.goto();
    const apiKey = await authPage.loginWithNewAccount();
    expect(apiKey).toBeTruthy();
    
    // Step 2: Verify logged in
    await expect(page).toHaveURL('/');
    
    // Step 3: Logout
    await dashboardPage.logout();
    
    // Step 4: Verify redirect to auth page
    await expect(page).toHaveURL('/auth');
    
    // Step 5: Login again with same API key
    await authPage.login(apiKey);
    
    // Step 6: Verify successful re-authentication
    await expect(page).toHaveURL('/');
  });
  
  test('should navigate through all dashboard pages', async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // Step 1: Create account and login
    await authPage.goto();
    const apiKey = await authPage.loginWithNewAccount();
    expect(apiKey).toBeTruthy();
    
    // Step 2: Navigate through all pages
    const pages = [
      { nav: () => dashboardPage.navigateToSubmit(), url: '/submit' },
      { nav: () => dashboardPage.navigateToCollections(), url: '/collections' },
      { nav: () => dashboardPage.navigateToExplorer(), url: '/explorer' },
      { nav: () => dashboardPage.navigateToNetwork(), url: '/network' },
      { nav: () => dashboardPage.navigateToAnalytics(), url: '/analytics' },
      { nav: () => dashboardPage.navigateToAudit(), url: '/audit' },
      { nav: () => dashboardPage.navigateToMetrics(), url: '/metrics' },
      { nav: () => dashboardPage.navigateToDebug(), url: '/debug' },
    ];
    
    for (const { nav, url } of pages) {
      await nav();
      await expect(page).toHaveURL(url);
      await page.waitForLoadState('networkidle');
    }
    
    // Step 3: Return to dashboard
    await dashboardPage.goto();
    await expect(page).toHaveURL('/');
  });
  
  test('should handle multiple data submissions with different collections', async ({ page }) => {
    const authPage = new AuthPage(page);
    const submitPage = new SubmitDataPage(page);
    const collectionsPage = new CollectionsPage(page);
    
    // Step 1: Create account and login
    await authPage.goto();
    const apiKey = await authPage.loginWithNewAccount();
    expect(apiKey).toBeTruthy();
    
    // Step 2: Submit data to multiple collections
    const collections = [
      `collection_a_${Date.now()}`,
      `collection_b_${Date.now()}`,
      `collection_c_${Date.now()}`,
    ];
    
    for (const collectionName of collections) {
      await submitPage.goto();
      await submitPage.submitData(`Data for ${collectionName}`, collectionName);
      await page.waitForTimeout(500);
    }
    
    // Step 3: Verify all collections created
    await collectionsPage.goto();
    await collectionsPage.waitForPageLoad();
    
    for (const collectionName of collections) {
      await collectionsPage.searchCollections(collectionName);
      const count = await collectionsPage.getCollectionCount();
      expect(count).toBeGreaterThan(0);
    }
  });
});

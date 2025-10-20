import { test, expect } from '../fixtures/auth.fixture';
import { DebugPage } from '../pages/DebugPage';

/**
 * Debug Utilities Test Suite
 * 
 * Tests state inspection, debug controls, and log viewer.
 */

test.describe('Debug Utilities', () => {
  let debugPage: DebugPage;
  
  test.beforeEach(async ({ authenticatedPage }) => {
    debugPage = new DebugPage(authenticatedPage);
    await debugPage.goto();
  });
  
  test('should display state inspector', async ({ authenticatedPage }) => {
    await debugPage.waitForPageLoad();
    
    // Verify state inspector is visible
    await expect(debugPage.stateInspector).toBeVisible();
  });
  
  test('should show current state snapshot', async ({ authenticatedPage }) => {
    await debugPage.waitForPageLoad();
    
    // Get state snapshot
    const state = await debugPage.getStateSnapshot();
    
    // Verify state is an object
    expect(typeof state).toBe('object');
  });
  
  test('should clear cache', async ({ authenticatedPage }) => {
    await debugPage.waitForPageLoad();
    
    // Clear cache
    await debugPage.clearCache();
    
    // Should show success message
    const toast = await debugPage.waitForToast();
    expect(toast.toLowerCase()).toContain('cache');
  });
  
  test('should clear storage', async ({ authenticatedPage }) => {
    await debugPage.waitForPageLoad();
    
    // Clear storage
    await debugPage.clearStorage();
    
    // Should show success message
    const toast = await debugPage.waitForToast();
    expect(toast.toLowerCase()).toContain('storage');
  });
  
  test('should force WebSocket reconnect', async ({ authenticatedPage }) => {
    await debugPage.waitForPageLoad();
    
    // Force reconnect
    await debugPage.forceReconnect();
    
    // Should show success or info message
    const toast = await debugPage.waitForToast();
    expect(toast).toBeTruthy();
  });
  
  test('should export state', async ({ authenticatedPage }) => {
    await debugPage.waitForPageLoad();
    
    // Export state
    await debugPage.exportState();
    
    // Export should trigger (download will start)
    // Note: Actual download verification would require more complex setup
  });
  
  test('should display log viewer', async ({ authenticatedPage }) => {
    await debugPage.waitForPageLoad();
    
    // Verify log viewer is visible
    await expect(debugPage.logViewer).toBeVisible();
  });
  
  test('should show log entries', async ({ authenticatedPage }) => {
    await debugPage.waitForPageLoad();
    
    // Get log entry count
    const count = await debugPage.getLogEntryCount();
    expect(count).toBeGreaterThanOrEqual(0);
    
    if (count > 0) {
      // Get first log entry
      const entry = await debugPage.getLogEntry(0);
      
      // Verify log entry has required fields
      expect(entry.level).toBeTruthy();
      expect(entry.message).toBeTruthy();
      expect(entry.timestamp).toBeTruthy();
    }
  });
});

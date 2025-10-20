import { test, expect } from '../fixtures/auth.fixture';
import { ExplorerPage } from '../pages/ExplorerPage';
import { SubmitDataPage } from '../pages/SubmitDataPage';

/**
 * Explorer Test Suite
 * 
 * Tests block browsing, block details, transactions, and Merkle tree visualization.
 */

test.describe('Blockchain Explorer', () => {
  let explorerPage: ExplorerPage;
  let submitPage: SubmitDataPage;
  
  test.beforeEach(async ({ authenticatedPage }) => {
    explorerPage = new ExplorerPage(authenticatedPage);
    submitPage = new SubmitDataPage(authenticatedPage);
    await explorerPage.goto();
  });
  
  test('should display blockchain blocks', async ({ authenticatedPage }) => {
    // Wait for page to load
    await explorerPage.waitForPageLoad();
    
    // Get block count (should have at least genesis block)
    const blockCount = await explorerPage.getBlockCount();
    expect(blockCount).toBeGreaterThan(0);
  });
  
  test('should display block details when selected', async ({ authenticatedPage }) => {
    // Wait for blocks to load
    await explorerPage.waitForPageLoad();
    
    // Select first block
    await explorerPage.selectBlock(0);
    
    // Verify block details are displayed
    await expect(explorerPage.blockDetails).toBeVisible();
    
    // Verify block properties
    const height = await explorerPage.getBlockHeight();
    expect(height).toBeGreaterThanOrEqual(0);
    
    const hash = await explorerPage.getBlockHash();
    expect(hash).toBeTruthy();
    expect(hash.length).toBeGreaterThan(0);
  });
  
  test('should show validator information', async ({ authenticatedPage }) => {
    await explorerPage.waitForPageLoad();
    await explorerPage.selectBlock(0);
    
    // Verify validator is displayed
    const validator = await explorerPage.getValidator();
    expect(validator).toBeTruthy();
  });
  
  test('should show block timestamp', async ({ authenticatedPage }) => {
    await explorerPage.waitForPageLoad();
    await explorerPage.selectBlock(0);
    
    // Verify timestamp is displayed
    const timestamp = await explorerPage.getTimestamp();
    expect(timestamp).toBeTruthy();
  });
  
  test('should show previous hash for non-genesis blocks', async ({ authenticatedPage }) => {
    await explorerPage.waitForPageLoad();
    
    // Check if there are multiple blocks
    const blockCount = await explorerPage.getBlockCount();
    
    if (blockCount > 1) {
      // Select second block
      await explorerPage.selectBlock(1);
      
      // Verify previous hash exists
      const prevHash = await explorerPage.getPreviousHash();
      expect(prevHash).toBeTruthy();
      expect(prevHash.length).toBeGreaterThan(0);
    }
  });
  
  test('should display transactions in block', async ({ authenticatedPage }) => {
    // Submit data to create a new block with transactions
    await submitPage.goto();
    await submitPage.submitData(`Test data ${Date.now()}`);
    
    // Go to explorer
    await explorerPage.goto();
    await explorerPage.waitForPageLoad();
    
    // Get latest block count
    const blockCount = await explorerPage.getBlockCount();
    
    // Select latest block
    await explorerPage.selectBlock(blockCount - 1);
    
    // Check transaction count (should be at least 1)
    const txCount = await explorerPage.getTransactionCount();
    expect(txCount).toBeGreaterThan(0);
  });
  
  test('should display Merkle tree visualization', async ({ authenticatedPage }) => {
    await explorerPage.waitForPageLoad();
    await explorerPage.selectBlock(0);
    
    // Check if Merkle tree is available
    const isVisible = await explorerPage.isMerkleTreeVisible();
    
    if (isVisible) {
      // Try to expand the tree
      await explorerPage.expandMerkleTree();
    }
  });
  
  test('should update when new blocks are created', async ({ authenticatedPage }) => {
    await explorerPage.waitForPageLoad();
    
    // Get initial block count
    const initialCount = await explorerPage.getBlockCount();
    
    // Submit new data (creates new block)
    await submitPage.goto();
    await submitPage.submitData(`Test data ${Date.now()}`);
    
    // Go back to explorer
    await explorerPage.goto();
    await explorerPage.waitForPageLoad();
    
    // Wait for new block
    await authenticatedPage.waitForTimeout(2000);
    
    // Get updated block count
    const updatedCount = await explorerPage.getBlockCount();
    
    // Verify block count increased
    expect(updatedCount).toBeGreaterThan(initialCount);
  });
});

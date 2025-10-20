import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Explorer Page Object
 * 
 * Handles block list, block details, transaction viewer, and Merkle tree visualization.
 */
export class ExplorerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }
  
  // Selectors
  get blockList(): Locator {
    return this.page.locator('[data-testid="block-list"]');
  }
  
  get blockItems(): Locator {
    return this.blockList.locator('[data-testid="block-item"]');
  }
  
  get blockDetails(): Locator {
    return this.page.locator('[data-testid="block-details"]');
  }
  
  get transactionViewer(): Locator {
    return this.page.locator('[data-testid="transaction-viewer"]');
  }
  
  get merkleTree(): Locator {
    return this.page.locator('[data-testid="merkle-tree"]');
  }
  
  get blockHeight(): Locator {
    return this.blockDetails.locator('[data-testid="block-height"]');
  }
  
  get blockHash(): Locator {
    return this.blockDetails.locator('[data-testid="block-hash"]');
  }
  
  get previousHash(): Locator {
    return this.blockDetails.locator('[data-testid="previous-hash"]');
  }
  
  get timestamp(): Locator {
    return this.blockDetails.locator('[data-testid="timestamp"]');
  }
  
  get validator(): Locator {
    return this.blockDetails.locator('[data-testid="validator"]');
  }
  
  // Actions
  async goto(): Promise<void> {
    await this.navigateTo('/explorer');
  }
  
  async getBlockCount(): Promise<number> {
    return await this.blockItems.count();
  }
  
  async selectBlock(index: number): Promise<void> {
    await this.blockItems.nth(index).click();
    await this.blockDetails.waitFor({ state: 'visible', timeout: 5000 });
  }
  
  async getBlockHeight(): Promise<number> {
    const text = await this.blockHeight.textContent();
    return parseInt(text || '0');
  }
  
  async getBlockHash(): Promise<string> {
    return await this.blockHash.textContent() || '';
  }
  
  async getPreviousHash(): Promise<string> {
    return await this.previousHash.textContent() || '';
  }
  
  async getTimestamp(): Promise<string> {
    return await this.timestamp.textContent() || '';
  }
  
  async getValidator(): Promise<string> {
    return await this.validator.textContent() || '';
  }
  
  async getTransactionCount(): Promise<number> {
    return await this.transactionViewer.locator('[data-testid="transaction-item"]').count();
  }
  
  async isMerkleTreeVisible(): Promise<boolean> {
    return await this.merkleTree.isVisible();
  }
  
  async expandMerkleTree(): Promise<void> {
    const expandButton = this.merkleTree.locator('button:has-text("Expand")');
    if (await expandButton.isVisible()) {
      await expandButton.click();
    }
  }
}

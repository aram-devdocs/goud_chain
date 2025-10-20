import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Network Page Object
 * 
 * Handles peer list, connection status, and validator rotation monitoring.
 */
export class NetworkPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }
  
  // Selectors
  get peerList(): Locator {
    return this.page.locator('[data-testid="peer-list"]');
  }
  
  get peerItems(): Locator {
    return this.peerList.locator('[data-testid="peer-item"]');
  }
  
  get connectionStatus(): Locator {
    return this.page.locator('[data-testid="connection-status"]');
  }
  
  get currentValidator(): Locator {
    return this.page.locator('[data-testid="current-validator"]');
  }
  
  get validatorRotation(): Locator {
    return this.page.locator('[data-testid="validator-rotation"]');
  }
  
  get refreshButton(): Locator {
    return this.page.locator('button:has-text("Refresh")');
  }
  
  // Actions
  async goto(): Promise<void> {
    await this.navigateTo('/network');
  }
  
  async getPeerCount(): Promise<number> {
    return await this.peerItems.count();
  }
  
  async getPeerInfo(index: number): Promise<{
    address: string;
    status: string;
    lastSeen: string;
  }> {
    const peer = this.peerItems.nth(index);
    
    return {
      address: await peer.locator('[data-testid="peer-address"]').textContent() || '',
      status: await peer.locator('[data-testid="peer-status"]').textContent() || '',
      lastSeen: await peer.locator('[data-testid="peer-last-seen"]').textContent() || '',
    };
  }
  
  async getConnectionStatus(): Promise<string> {
    return await this.connectionStatus.textContent() || '';
  }
  
  async getCurrentValidator(): Promise<string> {
    return await this.currentValidator.textContent() || '';
  }
  
  async refresh(): Promise<void> {
    await this.refreshButton.click();
    await this.waitForLoadingComplete();
  }
  
  async isValidatorRotationVisible(): Promise<boolean> {
    return await this.validatorRotation.isVisible();
  }
}

import { test as base, Page } from '@playwright/test';

/**
 * Blockchain Fixture
 * 
 * Provides utilities for interacting with blockchain state during tests.
 * Includes helpers for waiting for block creation, querying chain state,
 * and verifying consensus.
 */

export interface BlockchainFixtures {
  blockchain: {
    waitForBlock: (blockHeight: number, timeout?: number) => Promise<void>;
    getCurrentHeight: () => Promise<number>;
    getBlock: (height: number) => Promise<any>;
    waitForBlockWithData: (dataId: string, timeout?: number) => Promise<number>;
  };
}

export const test = base.extend<BlockchainFixtures>({
  blockchain: async ({ page }, use) => {
    const apiUrl = process.env.API_URL || 'http://localhost:8080';
    
    const blockchain = {
      /**
       * Wait for blockchain to reach a specific height
       */
      async waitForBlock(blockHeight: number, timeout = 30000): Promise<void> {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
          const height = await this.getCurrentHeight();
          
          if (height >= blockHeight) {
            return;
          }
          
          await page.waitForTimeout(1000);
        }
        
        throw new Error(`Blockchain did not reach height ${blockHeight} within ${timeout}ms`);
      },
      
      /**
       * Get current blockchain height
       */
      async getCurrentHeight(): Promise<number> {
        const response = await page.request.get(`${apiUrl}/chain`);
        
        if (!response.ok()) {
          throw new Error(`Failed to get chain info: ${await response.text()}`);
        }
        
        const data = await response.json();
        return data.chain_length;
      },
      
      /**
       * Get block at specific height
       */
      async getBlock(height: number): Promise<any> {
        const response = await page.request.get(`${apiUrl}/chain`);
        
        if (!response.ok()) {
          throw new Error(`Failed to get chain: ${await response.text()}`);
        }
        
        const data = await response.json();
        
        if (height >= data.blocks.length) {
          throw new Error(`Block ${height} does not exist (chain length: ${data.blocks.length})`);
        }
        
        return data.blocks[height];
      },
      
      /**
       * Wait for a block containing specific data ID
       */
      async waitForBlockWithData(dataId: string, timeout = 30000): Promise<number> {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
          const response = await page.request.get(`${apiUrl}/chain`);
          
          if (response.ok()) {
            const data = await response.json();
            
            for (let i = 0; i < data.blocks.length; i++) {
              const block = data.blocks[i];
              
              if (block.data && block.data.some((d: any) => d.id === dataId)) {
                return i;
              }
            }
          }
          
          await page.waitForTimeout(1000);
        }
        
        throw new Error(`Block with data ID ${dataId} not found within ${timeout}ms`);
      },
    };
    
    await use(blockchain);
  },
});

export { expect } from '@playwright/test';

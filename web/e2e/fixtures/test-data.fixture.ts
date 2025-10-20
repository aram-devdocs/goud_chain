import { test as base } from '@playwright/test';
import * as crypto from 'crypto';

/**
 * Test Data Fixture
 * 
 * Provides utilities for generating test data with deterministic values.
 * Includes helpers for creating test accounts, encrypted data, and API keys.
 */

export interface TestDataFixtures {
  testData: {
    generateAccountName: () => string;
    generateEncryptedData: (size?: number) => string;
    generateApiKey: () => string;
    randomString: (length: number) => string;
  };
}

export const test = base.extend<TestDataFixtures>({
  testData: async ({}, use) => {
    const testData = {
      /**
       * Generate a unique test account name
       */
      generateAccountName(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `test_${timestamp}_${random}`;
      },
      
      /**
       * Generate random encrypted data for testing
       */
      generateEncryptedData(size = 100): string {
        return crypto.randomBytes(size).toString('base64');
      },
      
      /**
       * Generate a deterministic API key for testing
       */
      generateApiKey(): string {
        return crypto.randomBytes(32).toString('hex');
      },
      
      /**
       * Generate a random string of specified length
       */
      randomString(length: number): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
      },
    };
    
    await use(testData);
  },
});

export { expect } from '@playwright/test';

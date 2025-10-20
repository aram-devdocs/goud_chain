/**
 * Test Helper Utilities
 * 
 * Common utilities for E2E tests including wait functions, data generation,
 * and validation helpers.
 */

import { Page } from '@playwright/test';

/**
 * Wait for API response with specific status code
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  expectedStatus: number = 200,
  timeout: number = 10000
): Promise<any> {
  const response = await page.waitForResponse(
    (response) => {
      const url = response.url();
      const matches = typeof urlPattern === 'string' 
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      
      return matches && response.status() === expectedStatus;
    },
    { timeout }
  );
  
  return await response.json();
}

/**
 * Wait for element with retry logic
 */
export async function waitForElementWithRetry(
  page: Page,
  selector: string,
  options: {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
  } = {}
): Promise<boolean> {
  const { timeout = 5000, retries = 3, retryDelay = 1000 } = options;
  
  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { timeout, state: 'visible' });
      return true;
    } catch (error) {
      if (i === retries - 1) {
        return false;
      }
      await page.waitForTimeout(retryDelay);
    }
  }
  
  return false;
}

/**
 * Generate unique test identifier
 */
export function generateTestId(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Wait for WebSocket connection
 */
export async function waitForWebSocketConnection(
  page: Page,
  timeout: number = 10000
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const isConnected = await page.evaluate(() => {
      const statusElement = document.querySelector('[data-testid="ws-status"]');
      return statusElement?.textContent?.includes('Connected') || false;
    });
    
    if (isConnected) {
      return true;
    }
    
    await page.waitForTimeout(500);
  }
  
  return false;
}

/**
 * Capture console logs for debugging
 */
export function setupConsoleCapture(page: Page): string[] {
  const logs: string[] = [];
  
  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', (error) => {
    logs.push(`[error] ${error.message}`);
  });
  
  return logs;
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(
  page: Page,
  name: string,
  directory: string = 'screenshots'
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${directory}/${name}_${timestamp}.png`;
  
  await page.screenshot({ path: filename, fullPage: true });
  
  return filename;
}

/**
 * Wait for network idle with custom timeout
 */
export async function waitForNetworkIdle(
  page: Page,
  timeout: number = 10000
): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (error) {
    // Ignore timeout, network may be busy
  }
}

/**
 * Check if element contains text (case-insensitive)
 */
export async function elementContainsText(
  page: Page,
  selector: string,
  expectedText: string,
  caseInsensitive: boolean = true
): Promise<boolean> {
  const elementText = await page.locator(selector).textContent();
  
  if (!elementText) {
    return false;
  }
  
  if (caseInsensitive) {
    return elementText.toLowerCase().includes(expectedText.toLowerCase());
  }
  
  return elementText.includes(expectedText);
}

/**
 * Get all table rows as objects
 */
export async function getTableData(
  page: Page,
  tableSelector: string = 'table'
): Promise<Record<string, string>[]> {
  return await page.evaluate((selector) => {
    const table = document.querySelector(selector);
    
    if (!table) {
      return [];
    }
    
    const headers = Array.from(table.querySelectorAll('thead th')).map(
      (th) => th.textContent?.trim() || ''
    );
    
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    
    return rows.map((row) => {
      const cells = Array.from(row.querySelectorAll('td'));
      const rowData: Record<string, string> = {};
      
      cells.forEach((cell, index) => {
        rowData[headers[index]] = cell.textContent?.trim() || '';
      });
      
      return rowData;
    });
  }, tableSelector);
}

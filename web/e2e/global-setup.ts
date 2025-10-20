import { chromium, FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Global Setup for E2E Tests
 * 
 * Responsibilities:
 * 1. Start Docker Compose 3-node blockchain network (local only)
 * 2. Wait for backend health checks to pass
 * 3. Wait for dashboard application to be ready
 * 4. Seed test data if needed
 * 
 * Note: In CI, Docker Compose is started by the workflow, so we only verify services are ready.
 */
async function globalSetup(config: FullConfig) {
  console.log('Starting E2E test environment setup...');
  
  const dashboardUrl = config.use.baseURL || 'http://localhost:3000';
  const apiUrl = process.env.API_URL || 'http://localhost:8080';
  const isCI = process.env.CI === 'true';
  
  // Step 1: Start Docker Compose (local development only)
  if (!isCI) {
    console.log('Starting Docker Compose services...');
    try {
      await execAsync('cd .. && docker compose -f docker-compose.local.yml up -d', {
        cwd: process.cwd(),
      });
      console.log('Docker Compose services started');
    } catch (error) {
      console.log('Docker Compose services may already be running:', error);
    }
  } else {
    console.log('Skipping Docker Compose startup (running in CI)');
  }
  
  // Step 2: Wait for backend health check
  console.log('Waiting for backend API to be ready...');
  await waitForService(`${apiUrl}/health`, 120000);
  
  // Step 3: Wait for dashboard to be ready
  console.log('Waiting for dashboard to be ready...');
  await waitForService(dashboardUrl, 120000);
  
  // Step 4: Seed test data (optional)
  // For now, tests will create their own data via fixtures
  
  console.log('E2E test environment ready!');
}

/**
 * Wait for a service to be ready by polling its health endpoint
 */
async function waitForService(url: string, timeout: number): Promise<void> {
  const startTime = Date.now();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      });
      
      if (response && response.ok()) {
        console.log(`Service at ${url} is ready`);
        await browser.close();
        return;
      }
    } catch (error) {
      // Service not ready yet, continue polling
    }
    
    await page.waitForTimeout(2000);
  }
  
  await browser.close();
  throw new Error(`Service at ${url} did not become ready within ${timeout}ms`);
}

export default globalSetup;

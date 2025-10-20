import { FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Global Teardown for E2E Tests
 * 
 * Responsibilities:
 * 1. Clean up test data (optional - tests should clean up after themselves)
 * 2. Stop Docker Compose services (optional - keep running for development)
 * 3. Archive test artifacts
 */
async function globalTeardown(config: FullConfig) {
  console.log('Starting E2E test environment teardown...');
  
  const shouldStopDocker = process.env.E2E_STOP_DOCKER === 'true';
  
  if (shouldStopDocker) {
    console.log('Stopping Docker Compose services...');
    try {
      await execAsync('cd .. && docker-compose -f docker-compose.local.yml down', {
        cwd: process.cwd(),
      });
      console.log('Docker Compose services stopped');
    } catch (error) {
      console.error('Failed to stop Docker Compose:', error);
    }
  } else {
    console.log('Keeping Docker Compose services running (set E2E_STOP_DOCKER=true to stop)');
  }
  
  console.log('E2E test environment teardown complete!');
}

export default globalTeardown;

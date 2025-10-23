import { Page } from '@playwright/test'
import type {
  CreateAccountResponse,
  LoginResponse,
  SubmitDataResponse,
  ListCollectionsResponse,
  MetricsResponse,
  PeersResponse,
  AuditLogsResponse,
} from '@goudchain/types'
import type { ChainInfo, ValidatorInfo } from '@goudchain/types'

/**
 * Mock API Responses
 *
 * Type-safe mock data matching backend API contracts.
 * Uses types from @goudchain/types for compile-time validation.
 */

export const mockApiResponses = {
  health: { status: 'healthy', timestamp: Date.now() },

  chain: {
    schema_version: '1.0.0',
    chain: [
      {
        index: 0,
        timestamp: 1609459200000,
        encrypted_block_data: 'genesis_encrypted_data',
        blind_indexes: [],
        block_salt: 'genesis_salt',
        previous_hash: '0'.repeat(64),
        merkle_root: '1'.repeat(64),
        validator: 'genesis_validator',
        signature: '2'.repeat(128),
        data_count: 0,
      },
      {
        index: 1,
        timestamp: Date.now() - 3600000,
        encrypted_block_data: 'mock_encrypted_block_1',
        blind_indexes: ['blind_index_1', 'blind_index_2'],
        block_salt: 'mock_salt_1',
        previous_hash: '1'.repeat(64),
        merkle_root: '3'.repeat(64),
        validator: 'mock_validator_1',
        signature: '4'.repeat(128),
        data_count: 2,
      },
    ],
    node_id: 'mock_node_1',
    checkpoints: ['checkpoint_0'],
  } satisfies ChainInfo,

  validator: {
    current_validator: 'mock_validator_1',
    next_validator: 'mock_validator_2',
    block_time: 10,
  } satisfies ValidatorInfo,

  createAccount: {
    api_key: 'a'.repeat(64),
    user_id: 'mock_user_' + Math.random().toString(36).substr(2, 9),
    account_id: 'mock_account_' + Math.random().toString(36).substr(2, 9),
  } satisfies CreateAccountResponse,

  login: {
    session_token: 'mock_session_' + Math.random().toString(36).substr(2, 16),
    account_id: 'mock_account_123',
    expires_in: 3600,
  } satisfies LoginResponse,

  submitData: {
    message: 'Data submitted successfully',
    data_id: 'mock_data_' + Math.random().toString(36).substr(2, 9),
  } satisfies SubmitDataResponse,

  listCollections: {
    collections: [
      {
        collection_id: 'collection_1',
        label: 'Test Collection 1',
        user_id: 'mock_user_123',
        blind_index: 'blind_index_1',
        created_at: Date.now() - 86400000,
        block_number: 1,
        data_count: 3,
      },
      {
        collection_id: 'collection_2',
        label: 'Test Collection 2',
        user_id: 'mock_user_123',
        blind_index: 'blind_index_2',
        created_at: Date.now() - 172800000,
        block_number: 1,
        data_count: 1,
      },
    ],
  } satisfies ListCollectionsResponse,

  metrics: {
    chain: {
      length: 2,
      latest_block_number: 1,
      latest_block_timestamp: Date.now() - 3600000,
    },
    network: {
      peer_count: 2,
    },
    performance: {
      cache_hit_rate: 0.85,
      operations_total: 127,
    },
  } satisfies MetricsResponse,

  peers: {
    peers: ['peer_1', 'peer_2'],
    count: 2,
    reputation: {
      peer_1: 100,
      peer_2: 95,
    },
  } satisfies PeersResponse,

  auditLogs: {
    logs: [
      {
        event_id: 'event_1',
        user_id: 'mock_user_123',
        event_type: 'account_created',
        ip_address_hash: 'hash_' + '5'.repeat(32),
        timestamp: Date.now() - 3600000,
      },
      {
        event_id: 'event_2',
        user_id: 'mock_user_123',
        event_type: 'data_submitted',
        ip_address_hash: 'hash_' + '5'.repeat(32),
        timestamp: Date.now() - 1800000,
      },
    ],
    total: 2,
    page: 1,
    total_pages: 1,
    page_size: 50,
  } satisfies AuditLogsResponse,
}

/**
 * Setup API mocks for a page
 *
 * Intercepts all API requests and returns mock data.
 * Call this in beforeEach or test setup.
 */
export async function setupApiMocks(page: Page) {
  // Health endpoint
  await page.route('**/health', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.health),
    })
  })

  // Chain endpoint
  await page.route('**/chain', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.chain),
    })
  })

  // Validator endpoint
  await page.route('**/validator/current', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.validator),
    })
  })

  // Create account endpoint
  await page.route('**/account/create', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.createAccount),
    })
  })

  // Login endpoint
  await page.route('**/account/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.login),
    })
  })

  // Submit data endpoint
  await page.route('**/data/submit', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.submitData),
    })
  })

  // List collections endpoint
  await page.route('**/data/list', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.listCollections),
    })
  })

  // Metrics endpoint
  await page.route('**/metrics', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.metrics),
    })
  })

  // Stats endpoint (alias for metrics)
  await page.route('**/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.metrics),
    })
  })

  // Peers endpoint
  await page.route('**/peers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.peers),
    })
  })

  // Audit logs endpoint
  await page.route('**/api/audit**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.auditLogs),
    })
  })
}

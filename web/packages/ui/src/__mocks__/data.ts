/**
 * Mock Data Generators for Storybook
 *
 * Provides realistic mock data for testing and documentation
 */

import type { AuditLogEntry } from '@goudchain/types'
import type { AuditEventType } from '../atoms/AuditEventBadge'

// Mock Chain Health Data
export interface MockChainHealth {
  chainLength: number
  latestBlockHash: string
  latestBlockTimestamp: number
  validatorAddress: string
  averageBlockTime: number
  transactionCount: number
}

export function mockChainHealth(): MockChainHealth {
  return {
    chainLength: 1234,
    latestBlockHash:
      '0x' +
      Array(64)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join(''),
    latestBlockTimestamp: Date.now() - Math.floor(Math.random() * 60000),
    validatorAddress: 'node-1.goudchain.local:9000',
    averageBlockTime: 2.5 + Math.random(),
    transactionCount: 42567,
  }
}

// Mock Block Data
export interface MockBlock {
  index: number
  hash: string
  previousHash: string
  timestamp: number
  data: any[]
  validator: string
}

export function mockBlock(index: number): MockBlock {
  return {
    index,
    hash:
      '0x' +
      Array(64)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join(''),
    previousHash:
      index > 0
        ? '0x' +
          Array(64)
            .fill(0)
            .map(() => Math.floor(Math.random() * 16).toString(16))
            .join('')
        : '0x0',
    timestamp: Date.now() - (100 - index) * 3000,
    data: [],
    validator: `node-${(index % 3) + 1}.goudchain.local:9000`,
  }
}

export function mockBlocks(count: number): MockBlock[] {
  return Array.from({ length: count }, (_, i) => mockBlock(i))
}

// Mock Collection Data
export interface MockCollection {
  collection_id: string
  label: string
  created_at: number
  data_count: number
  size_bytes: number
}

export function mockCollection(): MockCollection {
  const labels = [
    'Customer Data',
    'Transaction Records',
    'User Profiles',
    'Analytics Data',
    'System Logs',
  ]
  const randomLabel = labels[Math.floor(Math.random() * labels.length)]!
  return {
    collection_id: 'col_' + Math.random().toString(36).substring(2, 15),
    label: randomLabel,
    created_at: Date.now() - Math.floor(Math.random() * 86400000 * 30), // Last 30 days
    data_count: Math.floor(Math.random() * 100) + 1,
    size_bytes: Math.floor(Math.random() * 1024 * 1024) + 1024,
  }
}

export function mockCollections(count: number): MockCollection[] {
  return Array.from({ length: count }, () => mockCollection())
}

// Mock Peer Data
export interface MockPeer {
  address: string
  status: 'connected' | 'disconnected' | 'syncing'
  latency: number
  lastSeen: number
  version: string
}

export function mockPeer(): MockPeer {
  const nodes = ['node-1', 'node-2', 'node-3', 'node-4']
  const statuses: ('connected' | 'disconnected' | 'syncing')[] = [
    'connected',
    'connected',
    'connected',
    'syncing',
  ]
  const randomNode = nodes[Math.floor(Math.random() * nodes.length)]!
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]!

  return {
    address: `${randomNode}.goudchain.local:${9000 + Math.floor(Math.random() * 4)}`,
    status: randomStatus,
    latency: Math.floor(Math.random() * 100) + 10,
    lastSeen: Date.now() - Math.floor(Math.random() * 60000),
    version: '1.0.0',
  }
}

export function mockPeers(count: number): MockPeer[] {
  return Array.from({ length: count }, () => mockPeer())
}

// Mock Audit Log Data
export function mockAuditLog(): AuditLogEntry {
  const eventTypes: AuditEventType[] = [
    'AccountCreated',
    'Login',
    'DataSubmit',
    'DataListed',
    'DataDecrypt',
  ]
  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]!

  return {
    event_type: eventType,
    timestamp: Date.now() - Math.floor(Math.random() * 3600000), // Last hour in milliseconds
    collection_id:
      eventType === 'DataSubmit'
        ? 'col_' + Math.random().toString(36).substring(2, 10)
        : undefined,
    ip_hash: Array(64)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join(''),
    metadata: {
      collection_id:
        eventType === 'DataSubmit'
          ? 'col_' + Math.random().toString(36).substring(2, 10)
          : undefined,
    },
    invalidated: false,
  }
}

export function mockAuditLogs(count: number): AuditLogEntry[] {
  return Array.from({ length: count }, () => mockAuditLog()).sort(
    (a, b) => b.timestamp - a.timestamp
  ) // Sort by timestamp descending
}

// Mock Metrics Data
export interface MockMetric {
  label: string
  value: number
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  change?: number
}

export function mockMetrics(): MockMetric[] {
  return [
    {
      label: 'Chain Length',
      value: 1234,
      unit: 'blocks',
      trend: 'up',
      change: 5.2,
    },
    {
      label: 'Transactions',
      value: 42567,
      unit: 'total',
      trend: 'up',
      change: 12.3,
    },
    {
      label: 'Collections',
      value: 156,
      unit: 'total',
      trend: 'up',
      change: 2.1,
    },
    {
      label: 'Network Peers',
      value: 4,
      unit: 'nodes',
      trend: 'stable',
      change: 0,
    },
    {
      label: 'Average Block Time',
      value: 2.5,
      unit: 's',
      trend: 'down',
      change: -3.2,
    },
    {
      label: 'Storage Used',
      value: 1.23,
      unit: 'GB',
      trend: 'up',
      change: 8.7,
    },
  ]
}

// Mock Validator Performance
export interface MockValidatorStat {
  validator: string
  blocksCreated: number
  uptime: number
  lastActive: number
}

export function mockValidatorStats(): MockValidatorStat[] {
  return [
    {
      validator: 'node-1.goudchain.local:9000',
      blocksCreated: 423,
      uptime: 99.8,
      lastActive: Date.now() - 1000,
    },
    {
      validator: 'node-2.goudchain.local:9001',
      blocksCreated: 398,
      uptime: 99.5,
      lastActive: Date.now() - 2000,
    },
    {
      validator: 'node-3.goudchain.local:9002',
      blocksCreated: 413,
      uptime: 99.9,
      lastActive: Date.now() - 500,
    },
  ]
}

import type { Meta, StoryObj } from '@storybook/react'
import { ChainHealthDashboard } from '../ChainHealthDashboard'
import type { ChainHealth } from '../ChainHealthDashboard'
import { mockBlocks } from '../../__mocks__/data'
import type { Block } from '@goudchain/types'

const meta = {
  title: 'Organisms/ChainHealthDashboard',
  component: ChainHealthDashboard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ChainHealthDashboard>

export default meta
type Story = StoryObj<typeof meta>

// Convert mock blocks to full Block type
function createFullBlocks(count: number): Block[] {
  return mockBlocks(count).map((mockBlock) => ({
    index: mockBlock.index,
    timestamp: Math.floor(mockBlock.timestamp / 1000),
    encrypted_block_data: 'encrypted_data_' + mockBlock.index,
    blind_indexes: ['blind_index_' + mockBlock.index],
    block_salt: 'salt_' + mockBlock.index,
    previous_hash: mockBlock.previousHash,
    merkle_root:
      '0x' +
      Array(64)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join(''),
    validator: mockBlock.validator,
    signature:
      '0x' +
      Array(128)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join(''),
    data_count: Math.floor(Math.random() * 5),
  }))
}

const blocks = createFullBlocks(100)

const healthyChain: ChainHealth = {
  isValid: true,
  score: 100,
  lastValidated: Date.now(),
  checks: {
    hashChainValid: true,
    merkleRootsValid: true,
    signaturesValid: true,
    timestampsMonotonic: true,
  },
  issues: [],
}

const degradedChain: ChainHealth = {
  isValid: false,
  score: 75,
  lastValidated: Date.now() - 300000, // 5 minutes ago
  checks: {
    hashChainValid: true,
    merkleRootsValid: true,
    signaturesValid: false,
    timestampsMonotonic: true,
  },
  issues: ['Block 42: Invalid signature detected'],
}

const criticalChain: ChainHealth = {
  isValid: false,
  score: 40,
  lastValidated: Date.now() - 600000, // 10 minutes ago
  checks: {
    hashChainValid: false,
    merkleRootsValid: false,
    signaturesValid: false,
    timestampsMonotonic: true,
  },
  issues: [
    'Block 10: Hash chain broken',
    'Block 15: Merkle root mismatch',
    'Block 20: Invalid signature',
  ],
}

export const Default: Story = {
  args: {
    blocks,
    health: healthyChain,
    isValidating: false,
    onValidate: () => console.log('Validate'),
    actualCollectionCount: 42,
  },
}

export const Validating: Story = {
  args: {
    blocks,
    health: healthyChain,
    isValidating: true,
    onValidate: () => console.log('Validate'),
    actualCollectionCount: 42,
    validationProgress: {
      current: 50,
      total: 100,
      step: 'Verifying block signatures...',
    },
  },
}

export const NotYetValidated: Story = {
  args: {
    blocks,
    health: null,
    isValidating: false,
    onValidate: () => console.log('Validate'),
    actualCollectionCount: 42,
  },
}

export const DegradedHealth: Story = {
  args: {
    blocks,
    health: degradedChain,
    isValidating: false,
    onValidate: () => console.log('Validate'),
    actualCollectionCount: 42,
  },
}

export const CriticalHealth: Story = {
  args: {
    blocks,
    health: criticalChain,
    isValidating: false,
    onValidate: () => console.log('Validate'),
    actualCollectionCount: 42,
  },
}

export const EmptyChain: Story = {
  args: {
    blocks: [],
    health: null,
    isValidating: false,
    onValidate: () => console.log('Validate'),
    actualCollectionCount: 0,
  },
}

export const LargeChain: Story = {
  args: {
    blocks: createFullBlocks(10000),
    health: {
      ...healthyChain,
      score: 98,
    },
    isValidating: false,
    onValidate: () => console.log('Validate'),
    actualCollectionCount: 5000,
  },
}

import type { Meta, StoryObj } from '@storybook/react'
import { BlockDetailPanel } from '../BlockDetailPanel'
import { mockBlocks } from '../../__mocks__/data'
import type { Block } from '@goudchain/types'

const meta = {
  title: 'Organisms/BlockDetailPanel',
  component: BlockDetailPanel,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BlockDetailPanel>

export default meta
type Story = StoryObj<typeof meta>

// Create a full Block with all required fields
function createFullBlock(index: number): Block {
  const mockBlock = mockBlocks(1)[0]!
  return {
    index,
    timestamp: mockBlock.timestamp,
    encrypted_block_data:
      'encrypted_data_' + Math.random().toString(36).substring(2),
    blind_indexes: ['blind_index_' + Math.random().toString(36).substring(2)],
    block_salt: 'salt_' + Math.random().toString(36).substring(2),
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
    data_count: Math.floor(Math.random() * 10) + 1,
  }
}

const mockBlock = createFullBlock(42)

export const Default: Story = {
  args: {
    block: mockBlock,
    blockIndex: 0,
    totalBlocks: 100,
    onCopy: (text: string, label: string) =>
      console.log('Copy', label, text.substring(0, 16)),
    onPrevious: () => console.log('Previous'),
    onNext: () => console.log('Next'),
  },
}

export const FirstBlock: Story = {
  args: {
    block: createFullBlock(0),
    blockIndex: 0,
    totalBlocks: 100,
    onCopy: (text: string, label: string) => console.log('Copy', label),
    onNext: () => console.log('Next'),
  },
}

export const LastBlock: Story = {
  args: {
    block: createFullBlock(99),
    blockIndex: 99,
    totalBlocks: 100,
    onCopy: (text: string, label: string) => console.log('Copy', label),
    onPrevious: () => console.log('Previous'),
  },
}

export const WithManyDataItems: Story = {
  args: {
    block: {
      ...createFullBlock(500),
      data_count: 157,
    },
    blockIndex: 50,
    totalBlocks: 1000,
    onCopy: (text: string, label: string) => console.log('Copy', label),
    onPrevious: () => console.log('Previous'),
    onNext: () => console.log('Next'),
  },
}

export const EmptyBlock: Story = {
  args: {
    block: {
      ...createFullBlock(10),
      data_count: 0,
    },
    blockIndex: 10,
    totalBlocks: 100,
    onCopy: (text: string, label: string) => console.log('Copy', label),
    onPrevious: () => console.log('Previous'),
    onNext: () => console.log('Next'),
  },
}

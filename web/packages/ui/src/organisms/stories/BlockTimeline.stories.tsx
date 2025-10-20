import type { Meta, StoryObj } from '@storybook/react'
import { BlockTimeline } from '../BlockTimeline'
import { mockBlocks } from '../../__mocks__/data'
import type { Block } from '@goudchain/types'

const meta = {
  title: 'Organisms/BlockTimeline',
  component: BlockTimeline,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BlockTimeline>

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

const blocks = createFullBlocks(20)

export const Default: Story = {
  args: {
    blocks,
    selectedBlockNumber: null,
    onSelectBlock: (blockNumber: number) =>
      console.log('Selected block', blockNumber),
    searchQuery: '',
    onSearchChange: (query: string) => console.log('Search', query),
    filterBy: 'all',
    onFilterChange: (filter) => console.log('Filter', filter),
  },
}

export const WithSelection: Story = {
  args: {
    blocks,
    selectedBlockNumber: 5,
    onSelectBlock: (blockNumber: number) =>
      console.log('Selected block', blockNumber),
    searchQuery: '',
    onSearchChange: (query: string) => console.log('Search', query),
    filterBy: 'all',
    onFilterChange: (filter) => console.log('Filter', filter),
  },
}

export const WithSearchQuery: Story = {
  args: {
    blocks,
    selectedBlockNumber: null,
    onSelectBlock: (blockNumber: number) =>
      console.log('Selected block', blockNumber),
    searchQuery: 'node-1',
    onSearchChange: (query: string) => console.log('Search', query),
    filterBy: 'all',
    onFilterChange: (filter) => console.log('Filter', filter),
  },
}

export const FilteredByDataBlocks: Story = {
  args: {
    blocks: blocks.map((b, i) => ({
      ...b,
      data_count: i % 3 === 0 ? Math.floor(Math.random() * 5) + 1 : 0, // Every 3rd block has data
    })),
    selectedBlockNumber: null,
    onSelectBlock: (blockNumber: number) =>
      console.log('Selected block', blockNumber),
    searchQuery: '',
    onSearchChange: (query: string) => console.log('Search', query),
    filterBy: 'with_data',
    onFilterChange: (filter) => console.log('Filter', filter),
  },
}

export const FilteredByEmptyBlocks: Story = {
  args: {
    blocks: blocks.map((b) => ({
      ...b,
      data_count: 0,
    })),
    selectedBlockNumber: null,
    onSelectBlock: (blockNumber: number) =>
      console.log('Selected block', blockNumber),
    searchQuery: '',
    onSearchChange: (query: string) => console.log('Search', query),
    filterBy: 'empty',
    onFilterChange: (filter) => console.log('Filter', filter),
  },
}

export const Empty: Story = {
  args: {
    blocks: [],
    selectedBlockNumber: null,
    onSelectBlock: (blockNumber: number) =>
      console.log('Selected block', blockNumber),
    searchQuery: '',
    onSearchChange: (query: string) => console.log('Search', query),
    filterBy: 'all',
    onFilterChange: (filter) => console.log('Filter', filter),
  },
}

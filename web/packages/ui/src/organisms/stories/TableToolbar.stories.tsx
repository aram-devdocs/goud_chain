import type { Meta, StoryObj } from '@storybook/react'
import { TableToolbar } from '../TableToolbar'
import type { SortOption } from '../TableToolbar'

const meta = {
  title: 'Organisms/TableToolbar',
  component: TableToolbar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TableToolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    searchQuery: '',
    onSearchChange: (query: string) => console.log('Search', query),
    sortBy: 'newest' as SortOption,
    onSortChange: (sort: SortOption) => console.log('Sort', sort),
    totalCount: 42,
    selectedCount: 0,
    onBulkDecrypt: () => console.log('Bulk decrypt'),
    onBulkExport: () => console.log('Bulk export'),
    onClearSelections: () => console.log('Clear selections'),
    isDecrypting: false,
  },
}

export const WithSearchQuery: Story = {
  args: {
    searchQuery: 'customer data',
    onSearchChange: (query: string) => console.log('Search', query),
    sortBy: 'newest' as SortOption,
    onSortChange: (sort: SortOption) => console.log('Sort', sort),
    totalCount: 42,
    selectedCount: 0,
    onBulkDecrypt: () => console.log('Bulk decrypt'),
    onBulkExport: () => console.log('Bulk export'),
    onClearSelections: () => console.log('Clear selections'),
    isDecrypting: false,
  },
}

export const WithSelection: Story = {
  args: {
    searchQuery: '',
    onSearchChange: (query: string) => console.log('Search', query),
    sortBy: 'newest' as SortOption,
    onSortChange: (sort: SortOption) => console.log('Sort', sort),
    totalCount: 42,
    selectedCount: 5,
    onBulkDecrypt: () => console.log('Bulk decrypt'),
    onBulkExport: () => console.log('Bulk export'),
    onClearSelections: () => console.log('Clear selections'),
    isDecrypting: false,
  },
}

export const Decrypting: Story = {
  args: {
    searchQuery: '',
    onSearchChange: (query: string) => console.log('Search', query),
    sortBy: 'newest' as SortOption,
    onSortChange: (sort: SortOption) => console.log('Sort', sort),
    totalCount: 42,
    selectedCount: 8,
    onBulkDecrypt: () => console.log('Bulk decrypt'),
    onBulkExport: () => console.log('Bulk export'),
    onClearSelections: () => console.log('Clear selections'),
    isDecrypting: true,
  },
}

export const SortedByLabel: Story = {
  args: {
    searchQuery: '',
    onSearchChange: (query: string) => console.log('Search', query),
    sortBy: 'label' as SortOption,
    onSortChange: (sort: SortOption) => console.log('Sort', sort),
    totalCount: 42,
    selectedCount: 0,
    onBulkDecrypt: () => console.log('Bulk decrypt'),
    onBulkExport: () => console.log('Bulk export'),
    onClearSelections: () => console.log('Clear selections'),
    isDecrypting: false,
  },
}

export const LargeDataset: Story = {
  args: {
    searchQuery: '',
    onSearchChange: (query: string) => console.log('Search', query),
    sortBy: 'newest' as SortOption,
    onSortChange: (sort: SortOption) => console.log('Sort', sort),
    totalCount: 1523,
    selectedCount: 0,
    onBulkDecrypt: () => console.log('Bulk decrypt'),
    onBulkExport: () => console.log('Bulk export'),
    onClearSelections: () => console.log('Clear selections'),
    isDecrypting: false,
  },
}

export const NoData: Story = {
  args: {
    searchQuery: '',
    onSearchChange: (query: string) => console.log('Search', query),
    sortBy: 'newest' as SortOption,
    onSortChange: (sort: SortOption) => console.log('Sort', sort),
    totalCount: 0,
    selectedCount: 0,
    onBulkDecrypt: () => console.log('Bulk decrypt'),
    onBulkExport: () => console.log('Bulk export'),
    onClearSelections: () => console.log('Clear selections'),
    isDecrypting: false,
  },
}

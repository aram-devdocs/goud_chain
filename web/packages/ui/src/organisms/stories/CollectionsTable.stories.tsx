import type { Meta, StoryObj } from '@storybook/react'
import { CollectionsTable } from '../CollectionsTable'
import { mockCollections } from '../../__mocks__/data'

const meta = {
  title: 'Organisms/CollectionsTable',
  component: CollectionsTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CollectionsTable>

export default meta
type Story = StoryObj<typeof meta>

const mockCollectionsData = mockCollections(3).map((col, idx) => ({
  collection_id: col.collection_id,
  label: col.label,
  user_id: `user_${idx + 1}`,
  blind_index: 'blind_index_hash',
  created_at: Math.floor(col.created_at / 1000),
  block_number: idx + 1,
  data_count: col.data_count,
}))

export const Default: Story = {
  args: {
    collections: mockCollectionsData,
    selectedIds: new Set(),
    onToggleSelection: (id: string) => console.log('Toggle', id),
    onToggleAll: () => console.log('Toggle all'),
    decryptedData: new Map(),
    expandedRows: new Set(),
    onDecrypt: (id: string) => console.log('Decrypt', id),
    onHide: (id: string) => console.log('Hide', id),
    onCopy: (text: string, label: string) => console.log('Copy', label),
    onDownload: (label: string, data: string) => console.log('Download', label),
    isDecrypting: false,
  },
}

export const WithSelection: Story = {
  args: {
    ...Default.args!,
    selectedIds: new Set([mockCollectionsData[0]!.collection_id]),
  },
}

export const WithDecryptedData: Story = {
  args: {
    ...Default.args!,
    decryptedData: new Map([
      [mockCollectionsData[0]!.collection_id, '{"name":"John Doe","age":30}'],
    ]),
    expandedRows: new Set([mockCollectionsData[0]!.collection_id]),
  },
}

export const Decrypting: Story = {
  args: {
    ...Default.args!,
    isDecrypting: true,
  },
}

export const Empty: Story = {
  args: {
    ...Default.args!,
    collections: [],
  },
}

import type { Meta, StoryObj } from '@storybook/react'
import { CollectionStatsCard } from '../CollectionStatsCard'

const meta = {
  title: 'Organisms/CollectionStatsCard',
  component: CollectionStatsCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CollectionStatsCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    stats: {
      totalCollections: 156,
      totalItems: 3420,
      avgItemsPerCollection: 21.9,
      largestCollectionSize: 234,
    },
  },
}

export const FewCollections: Story = {
  args: {
    stats: {
      totalCollections: 5,
      totalItems: 23,
      avgItemsPerCollection: 4.6,
      largestCollectionSize: 12,
    },
  },
}

export const ManyCollections: Story = {
  args: {
    stats: {
      totalCollections: 5423,
      totalItems: 125678,
      avgItemsPerCollection: 23.2,
      largestCollectionSize: 1842,
    },
  },
}

export const Empty: Story = {
  args: {
    stats: {
      totalCollections: 0,
      totalItems: 0,
      avgItemsPerCollection: 0,
      largestCollectionSize: 0,
    },
  },
}

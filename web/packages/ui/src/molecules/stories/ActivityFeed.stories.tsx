import type { Meta, StoryObj } from '@storybook/react'
import { ActivityFeed, type ActivityEvent } from '../ActivityFeed'

const meta = {
  title: 'Molecules/ActivityFeed',
  component: ActivityFeed,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ActivityFeed>

export default meta
type Story = StoryObj<typeof meta>

const sampleActivities: ActivityEvent[] = [
  {
    id: '1',
    type: 'blockchain',
    message: 'New block #1234 created by validator node-1',
    timestamp: Date.now() - 30000,
  },
  {
    id: '2',
    type: 'collection',
    message: 'New collection "user-data" created',
    timestamp: Date.now() - 120000,
  },
  {
    id: '3',
    type: 'peer',
    message: 'Peer node-2 connected',
    timestamp: Date.now() - 180000,
  },
  {
    id: '4',
    type: 'audit',
    message: 'User logged in successfully',
    timestamp: Date.now() - 300000,
  },
  {
    id: '5',
    type: 'metrics',
    message: 'Cache hit rate: 98.5%',
    timestamp: Date.now() - 450000,
  },
]

export const Default: Story = {
  args: {
    activities: sampleActivities,
  },
}

export const WithClearButton: Story = {
  args: {
    activities: sampleActivities,
    onClear: () => console.log('Clear clicked'),
  },
}

export const Empty: Story = {
  args: {
    activities: [],
  },
}

export const SingleEvent: Story = {
  args: {
    activities: [sampleActivities[0]!],
  },
}

export const CustomMaxHeight: Story = {
  args: {
    activities: [
      ...sampleActivities,
      ...sampleActivities.map((a, i) => ({
        ...a,
        id: `${a.id}-dup-${i}`,
        timestamp: a.timestamp - 600000,
      })),
    ],
    maxHeight: '300px',
  },
}

export const LimitedItems: Story = {
  args: {
    activities: [
      ...sampleActivities,
      ...sampleActivities.map((a, i) => ({
        ...a,
        id: `${a.id}-dup-${i}`,
        timestamp: a.timestamp - 600000,
      })),
    ],
    maxItems: 5,
  },
}

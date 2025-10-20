import type { Meta, StoryObj } from '@storybook/react'
import { NetworkActions } from '../NetworkActions'

const meta = {
  title: 'Organisms/NetworkActions',
  component: NetworkActions,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NetworkActions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onSyncAll: () => console.log('Sync all clicked'),
    onRefresh: () => console.log('Refresh clicked'),
    isSyncing: false,
    isRefreshing: false,
  },
}

export const Syncing: Story = {
  args: {
    onSyncAll: () => console.log('Sync all clicked'),
    onRefresh: () => console.log('Refresh clicked'),
    isSyncing: true,
    isRefreshing: false,
  },
}

export const Refreshing: Story = {
  args: {
    onSyncAll: () => console.log('Sync all clicked'),
    onRefresh: () => console.log('Refresh clicked'),
    isSyncing: false,
    isRefreshing: true,
  },
}

export const BothLoading: Story = {
  args: {
    onSyncAll: () => console.log('Sync all clicked'),
    onRefresh: () => console.log('Refresh clicked'),
    isSyncing: true,
    isRefreshing: true,
  },
}

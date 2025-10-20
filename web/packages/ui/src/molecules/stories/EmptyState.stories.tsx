import type { Meta, StoryObj } from '@storybook/react'
import { EmptyState } from '../EmptyState'

const meta = {
  title: 'Molecules/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'No data available',
    description: 'There is no data to display at this time.',
  },
}

export const WithAction: Story = {
  args: {
    title: 'No collections yet',
    description: 'Submit some data to get started!',
    action: {
      label: 'Submit Data',
      onClick: () => alert('Navigate to submit page'),
    },
  },
}

export const NoAuditLogs: Story = {
  args: {
    title: 'No audit logs found',
    description: 'Try adjusting your filters to see more results.',
  },
}

export const NoPeers: Story = {
  args: {
    title: 'No peers connected',
    description:
      'Your node is not connected to any peers. Check your network configuration.',
    action: {
      label: 'Refresh',
      onClick: () => alert('Refresh peers'),
    },
  },
}

export const WaitingForEvents: Story = {
  args: {
    title: 'Waiting for audit events',
    description: 'Events will appear here as they happen in real-time.',
  },
}

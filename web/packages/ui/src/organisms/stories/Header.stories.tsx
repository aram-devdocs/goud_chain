import type { Meta, StoryObj } from '@storybook/react'
import { Header } from '../Header'

const meta = {
  title: 'Organisms/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'GoudChain Dashboard',
    subtitle: 'Encrypted Blockchain Network',
    wsConnected: true,
    accountId: 'usr_a1b2c3d4e5f6',
  },
}

export const WithRefresh: Story = {
  args: {
    title: 'Analytics',
    subtitle: 'Real-time metrics and performance data',
    wsConnected: true,
    accountId: 'usr_a1b2c3d4e5f6',
    onRefresh: () => console.log('Refresh clicked'),
    isRefreshing: false,
  },
}

export const Refreshing: Story = {
  args: {
    title: 'Analytics',
    subtitle: 'Real-time metrics and performance data',
    wsConnected: true,
    accountId: 'usr_a1b2c3d4e5f6',
    onRefresh: () => console.log('Refresh clicked'),
    isRefreshing: true,
  },
}

export const Disconnected: Story = {
  args: {
    title: 'Network Status',
    subtitle: 'Connection lost - polling mode active',
    wsConnected: false,
    accountId: 'usr_a1b2c3d4e5f6',
  },
}

export const NoAccount: Story = {
  args: {
    title: 'Public Dashboard',
    subtitle: 'View-only mode',
    wsConnected: true,
    accountId: null,
  },
}

export const MinimalNoSubtitle: Story = {
  args: {
    title: 'Simple Page',
    wsConnected: false,
  },
}

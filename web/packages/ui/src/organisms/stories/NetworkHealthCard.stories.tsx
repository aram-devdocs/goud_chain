import type { Meta, StoryObj } from '@storybook/react'
import { NetworkHealthCard } from '../NetworkHealthCard'
import type { NetworkHealth } from '../NetworkHealthCard'

const meta = {
  title: 'Organisms/NetworkHealthCard',
  component: NetworkHealthCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NetworkHealthCard>

export default meta
type Story = StoryObj<typeof meta>

const healthyNetwork: NetworkHealth = {
  status: 'connected',
  syncStatus: 'synced',
  peerCount: 4,
  currentValidator: 'node-1',
  isThisNodeValidator: false,
  healthScore: 95,
}

const syncingNetwork: NetworkHealth = {
  status: 'connected',
  syncStatus: 'syncing',
  peerCount: 3,
  currentValidator: 'node-2',
  isThisNodeValidator: false,
  healthScore: 70,
}

const behindNetwork: NetworkHealth = {
  status: 'connected',
  syncStatus: 'behind',
  peerCount: 2,
  currentValidator: 'node-3',
  isThisNodeValidator: false,
  healthScore: 45,
}

const disconnectedNetwork: NetworkHealth = {
  status: 'disconnected',
  syncStatus: 'behind',
  peerCount: 0,
  currentValidator: 'unknown',
  isThisNodeValidator: false,
  healthScore: 15,
}

export const Default: Story = {
  args: {
    health: healthyNetwork,
    nodeId: 'node-4',
  },
}

export const AsValidator: Story = {
  args: {
    health: {
      ...healthyNetwork,
      currentValidator: 'node-1',
      isThisNodeValidator: true,
    },
    nodeId: 'node-1',
  },
}

export const Syncing: Story = {
  args: {
    health: syncingNetwork,
    nodeId: 'node-2',
  },
}

export const Behind: Story = {
  args: {
    health: behindNetwork,
    nodeId: 'node-3',
  },
}

export const Disconnected: Story = {
  args: {
    health: disconnectedNetwork,
    nodeId: 'node-1',
  },
}

export const HighPeerCount: Story = {
  args: {
    health: {
      ...healthyNetwork,
      peerCount: 10,
      healthScore: 100,
    },
    nodeId: 'node-5',
  },
}

export const LowPeerCount: Story = {
  args: {
    health: {
      ...healthyNetwork,
      peerCount: 1,
      healthScore: 60,
    },
    nodeId: 'node-2',
  },
}

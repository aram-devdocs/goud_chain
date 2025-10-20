import type { Meta, StoryObj } from '@storybook/react'
import { NodeStatsGrid } from '../NodeStatsGrid'
import type { NodeStats } from '../NodeStatsGrid'

const meta = {
  title: 'Organisms/NodeStatsGrid',
  component: NodeStatsGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NodeStatsGrid>

export default meta
type Story = StoryObj<typeof meta>

const observerNodeStats: NodeStats = {
  nodeId: 'node-2.goudchain.local:9001',
  chainLength: 1234,
  latestBlockAge: '2m ago',
  isValidator: false,
  syncStatus: 'synced',
  blocksBehind: 0,
}

const validatorNodeStats: NodeStats = {
  nodeId: 'node-1.goudchain.local:9000',
  chainLength: 1234,
  latestBlockAge: '5s ago',
  isValidator: true,
  nextValidatorTurn: 'Next in 3 blocks',
  syncStatus: 'synced',
  blocksBehind: 0,
}

const syncingNodeStats: NodeStats = {
  nodeId: 'node-3.goudchain.local:9002',
  chainLength: 1200,
  latestBlockAge: '15m ago',
  isValidator: false,
  syncStatus: 'syncing',
  blocksBehind: 34,
}

export const Default: Story = {
  args: {
    stats: observerNodeStats,
  },
}

export const ValidatorNode: Story = {
  args: {
    stats: validatorNodeStats,
  },
}

export const SyncingNode: Story = {
  args: {
    stats: syncingNodeStats,
  },
}

export const ValidatorWithTurn: Story = {
  args: {
    stats: {
      ...validatorNodeStats,
      nextValidatorTurn: 'Your turn now',
    },
  },
}

export const LargeChain: Story = {
  args: {
    stats: {
      ...observerNodeStats,
      chainLength: 99999,
      latestBlockAge: '1s ago',
    },
  },
}

export const FarBehind: Story = {
  args: {
    stats: {
      ...syncingNodeStats,
      blocksBehind: 523,
      latestBlockAge: '2h ago',
    },
  },
}

export const StaleChain: Story = {
  args: {
    stats: {
      ...observerNodeStats,
      latestBlockAge: '3d ago',
      blocksBehind: 0,
    },
  },
}

import type { Meta, StoryObj } from '@storybook/react'
import { RecentActivityTimeline } from '../RecentActivityTimeline'
import type { ActivityBlock } from '../RecentActivityTimeline'

const meta = {
  title: 'Organisms/RecentActivityTimeline',
  component: RecentActivityTimeline,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RecentActivityTimeline>

export default meta
type Story = StoryObj<typeof meta>

// Generate activity blocks
function generateActivityBlocks(
  count: number,
  dataFrequency: number = 0.5
): ActivityBlock[] {
  const now = Math.floor(Date.now() / 1000)
  const blocks: ActivityBlock[] = []

  for (let i = 0; i < count; i++) {
    const dataCount =
      Math.random() < dataFrequency ? Math.floor(Math.random() * 5) + 1 : 0
    blocks.push({
      index: count - i - 1,
      timestamp: now - i * 180, // Every 3 minutes
      dataCount,
      validator: `node-${(i % 3) + 1}.goudchain.local:900${i % 3}`,
      hasData: dataCount > 0,
    })
  }

  return blocks
}

export const Default: Story = {
  args: {
    blocks: generateActivityBlocks(20),
    maxBlocks: 20,
  },
}

export const HighActivity: Story = {
  args: {
    blocks: generateActivityBlocks(50, 0.9), // 90% of blocks have data
    maxBlocks: 20,
  },
}

export const LowActivity: Story = {
  args: {
    blocks: generateActivityBlocks(30, 0.2), // 20% of blocks have data
    maxBlocks: 20,
  },
}

export const NoActivity: Story = {
  args: {
    blocks: generateActivityBlocks(15, 0), // No blocks have data
    maxBlocks: 20,
  },
}

export const SmallBlockset: Story = {
  args: {
    blocks: generateActivityBlocks(5),
    maxBlocks: 20,
  },
}

export const LargeBlockset: Story = {
  args: {
    blocks: generateActivityBlocks(100),
    maxBlocks: 20,
  },
}

export const CustomMaxBlocks: Story = {
  args: {
    blocks: generateActivityBlocks(50),
    maxBlocks: 10,
  },
}

export const Empty: Story = {
  args: {
    blocks: [],
    maxBlocks: 20,
  },
}

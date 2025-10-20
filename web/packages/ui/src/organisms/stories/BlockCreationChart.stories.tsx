import type { Meta, StoryObj } from '@storybook/react'
import { BlockCreationChart } from '../BlockCreationChart'
import type { BlockCreationDataPoint } from '../BlockCreationChart'

const meta = {
  title: 'Organisms/BlockCreationChart',
  component: BlockCreationChart,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BlockCreationChart>

export default meta
type Story = StoryObj<typeof meta>

// Generate hourly data for the last 24 hours
function generateHourlyData(hours: number): BlockCreationDataPoint[] {
  const now = new Date()
  const data: BlockCreationDataPoint[] = []

  for (let i = hours - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 60 * 60 * 1000)
    const hour = date.getHours().toString().padStart(2, '0') + ':00'
    const count = Math.floor(Math.random() * 20) + 5 // 5-25 blocks per hour

    data.push({ hour, count })
  }

  return data
}

export const Default: Story = {
  args: {
    data: generateHourlyData(24),
    title: 'Block Creation Timeline',
  },
}

export const Last12Hours: Story = {
  args: {
    data: generateHourlyData(12),
    title: 'Block Creation Timeline (12h)',
  },
}

export const HighActivity: Story = {
  args: {
    data: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      count: Math.floor(Math.random() * 30) + 20, // 20-50 blocks per hour
    })),
    title: 'High Activity Period',
  },
}

export const LowActivity: Story = {
  args: {
    data: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      count: Math.floor(Math.random() * 3) + 1, // 1-4 blocks per hour
    })),
    title: 'Low Activity Period',
  },
}

export const SpikePattern: Story = {
  args: {
    data: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      count:
        i % 6 === 0
          ? Math.floor(Math.random() * 30) + 30
          : Math.floor(Math.random() * 5) + 2, // Spikes every 6 hours
    })),
    title: 'Periodic Activity Spikes',
  },
}

export const Empty: Story = {
  args: {
    data: [],
    title: 'Block Creation Timeline',
  },
}

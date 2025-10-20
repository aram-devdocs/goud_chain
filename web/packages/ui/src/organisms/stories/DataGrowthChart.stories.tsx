import type { Meta, StoryObj } from '@storybook/react'
import { DataGrowthChart } from '../DataGrowthChart'
import type { DataGrowthPoint } from '../DataGrowthChart'

const meta = {
  title: 'Organisms/DataGrowthChart',
  component: DataGrowthChart,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DataGrowthChart>

export default meta
type Story = StoryObj<typeof meta>

// Generate cumulative growth data
function generateGrowthData(
  blockCount: number,
  pattern: 'linear' | 'exponential' | 'stepped'
): DataGrowthPoint[] {
  const data: DataGrowthPoint[] = []
  let cumulative = 0

  for (let i = 0; i < blockCount; i++) {
    if (pattern === 'linear') {
      cumulative += Math.floor(Math.random() * 3) + 1 // 1-3 items per block
    } else if (pattern === 'exponential') {
      cumulative += Math.floor(Math.random() * (i / 5 + 1)) + 1 // Growth accelerates
    } else if (pattern === 'stepped') {
      cumulative +=
        i % 10 === 0
          ? Math.floor(Math.random() * 20) + 10
          : Math.floor(Math.random() * 2)
    }

    data.push({
      blockIndex: i,
      cumulativeData: cumulative,
    })
  }

  return data
}

export const Default: Story = {
  args: {
    data: generateGrowthData(50, 'linear'),
    title: 'Data Storage Growth',
  },
}

export const ExponentialGrowth: Story = {
  args: {
    data: generateGrowthData(50, 'exponential'),
    title: 'Exponential Growth Pattern',
  },
}

export const SteppedGrowth: Story = {
  args: {
    data: generateGrowthData(50, 'stepped'),
    title: 'Periodic Batch Uploads',
  },
}

export const SmallDataset: Story = {
  args: {
    data: generateGrowthData(10, 'linear'),
    title: 'Small Chain (10 blocks)',
  },
}

export const LargeDataset: Story = {
  args: {
    data: generateGrowthData(200, 'linear'),
    title: 'Large Chain (200 blocks)',
  },
}

export const Empty: Story = {
  args: {
    data: [],
    title: 'Data Storage Growth',
  },
}

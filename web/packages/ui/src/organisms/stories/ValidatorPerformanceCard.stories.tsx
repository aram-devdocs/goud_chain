import type { Meta, StoryObj } from '@storybook/react'
import { ValidatorPerformanceCard } from '../ValidatorPerformanceCard'

const meta = {
  title: 'Organisms/ValidatorPerformanceCard',
  component: ValidatorPerformanceCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ValidatorPerformanceCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    validators: [
      {
        validator: 'node-1.goudchain.local:9000',
        blockCount: 423,
        percentage: 34.2,
        isCurrentValidator: true,
      },
      {
        validator: 'node-2.goudchain.local:9001',
        blockCount: 398,
        percentage: 32.2,
        isCurrentValidator: false,
      },
      {
        validator: 'node-3.goudchain.local:9002',
        blockCount: 413,
        percentage: 33.6,
        isCurrentValidator: false,
      },
    ],
    totalBlocks: 1234,
  },
}

export const SingleValidator: Story = {
  args: {
    validators: [
      {
        validator: 'node-1.goudchain.local:9000',
        blockCount: 1234,
        percentage: 100,
        isCurrentValidator: true,
      },
    ],
    totalBlocks: 1234,
  },
}

export const UnevenDistribution: Story = {
  args: {
    validators: [
      {
        validator: 'node-1.goudchain.local:9000',
        blockCount: 856,
        percentage: 69.3,
        isCurrentValidator: false,
      },
      {
        validator: 'node-2.goudchain.local:9001',
        blockCount: 234,
        percentage: 19.0,
        isCurrentValidator: true,
      },
      {
        validator: 'node-3.goudchain.local:9002',
        blockCount: 144,
        percentage: 11.7,
        isCurrentValidator: false,
      },
    ],
    totalBlocks: 1234,
  },
}

export const Empty: Story = {
  args: {
    validators: [],
    totalBlocks: 0,
  },
}

import type { Meta, StoryObj } from '@storybook/react'
import { MetricCard } from '../MetricCard'

const meta = {
  title: 'Molecules/MetricCard',
  component: MetricCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['blue', 'green', 'purple', 'yellow', 'red', 'zinc'],
    },
  },
} satisfies Meta<typeof MetricCard>

export default meta
type Story = StoryObj<typeof meta>

export const Blockchain: Story = {
  args: {
    label: 'BLOCKCHAIN',
    value: '1,234',
    description: 'Total Blocks',
    lastUpdated: Date.now(),
    variant: 'blue',
  },
}

export const Collections: Story = {
  args: {
    label: 'COLLECTIONS',
    value: '42',
    description: 'Your Data',
    lastUpdated: Date.now() - 120000,
    variant: 'green',
  },
}

export const Network: Story = {
  args: {
    label: 'NETWORK',
    value: '4',
    description: 'Connected Peers',
    lastUpdated: Date.now() - 60000,
    variant: 'purple',
  },
}

export const Connection: Story = {
  args: {
    label: 'CONNECTION',
    value: 'Live',
    description: 'WebSocket Status',
    variant: 'zinc',
  },
}

export const AllVariants: Story = {
  args: {
    label: 'METRIC',
    value: '100',
    description: 'Description',
    lastUpdated: Date.now(),
  },
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <MetricCard
        label="BLUE"
        value="123"
        description="Blue variant"
        variant="blue"
      />
      <MetricCard
        label="GREEN"
        value="456"
        description="Green variant"
        variant="green"
      />
      <MetricCard
        label="PURPLE"
        value="789"
        description="Purple variant"
        variant="purple"
      />
      <MetricCard
        label="YELLOW"
        value="321"
        description="Yellow variant"
        variant="yellow"
      />
      <MetricCard
        label="RED"
        value="654"
        description="Red variant"
        variant="red"
      />
      <MetricCard
        label="ZINC"
        value="987"
        description="Zinc variant"
        variant="zinc"
      />
    </div>
  ),
}

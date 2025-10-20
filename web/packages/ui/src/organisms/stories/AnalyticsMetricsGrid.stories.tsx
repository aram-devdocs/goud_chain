import type { Meta, StoryObj } from '@storybook/react'
import { AnalyticsMetricsGrid } from '../AnalyticsMetricsGrid'

const meta = {
  title: 'Organisms/AnalyticsMetricsGrid',
  component: AnalyticsMetricsGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AnalyticsMetricsGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    metrics: [
      {
        label: 'Chain Length',
        value: '1,234',
        color: 'blue',
        trend: { direction: 'up', value: '+5.2%' },
      },
      {
        label: 'Transactions',
        value: '42,567',
        color: 'green',
        trend: { direction: 'up', value: '+12.3%' },
      },
      {
        label: 'Collections',
        value: 156,
        color: 'purple',
        trend: { direction: 'up', value: '+2.1%' },
      },
      {
        label: 'Network Peers',
        value: 4,
        color: 'yellow',
        trend: { direction: 'neutral', value: '0%' },
      },
    ],
  },
}

export const WithDownwardTrend: Story = {
  args: {
    metrics: [
      {
        label: 'Average Block Time',
        value: '2.5s',
        color: 'blue',
        trend: { direction: 'down', value: '-3.2%' },
      },
      {
        label: 'Network Latency',
        value: '45ms',
        color: 'green',
        trend: { direction: 'down', value: '-8.1%' },
      },
      {
        label: 'Error Rate',
        value: '0.02%',
        color: 'purple',
        trend: { direction: 'down', value: '-50%' },
      },
      {
        label: 'Pending Transactions',
        value: 3,
        color: 'yellow',
        trend: { direction: 'down', value: '-70%' },
      },
    ],
  },
}

export const WithoutTrends: Story = {
  args: {
    metrics: [
      {
        label: 'Total Storage',
        value: '1.23 GB',
        color: 'blue',
      },
      {
        label: 'Active Validators',
        value: 3,
        color: 'green',
      },
      {
        label: 'Last Block',
        value: '2s ago',
        color: 'purple',
      },
      {
        label: 'API Version',
        value: '1.0.0',
        color: 'yellow',
      },
    ],
  },
}

export const SingleMetric: Story = {
  args: {
    metrics: [
      {
        label: 'Chain Health',
        value: 'Healthy',
        color: 'green',
        trend: { direction: 'neutral', value: 'Stable' },
      },
    ],
  },
}

export const Empty: Story = {
  args: {
    metrics: [],
  },
}

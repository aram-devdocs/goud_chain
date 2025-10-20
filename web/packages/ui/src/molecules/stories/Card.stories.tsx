import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardTitle, CardContent } from '../Card'

const meta = {
  title: 'Molecules/Card',
  component: Card,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: <p className="text-zinc-300">Simple card with default styling</p>,
  },
}

export const WithHeader: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          Card content goes here. This is a basic card with header and content
          sections.
        </p>
      </CardContent>
    </Card>
  ),
}

export const ChainStats: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Chain Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-zinc-400 text-sm">Total Blocks</span>
            <span className="text-white font-medium font-mono">1,234</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400 text-sm">Active Peers</span>
            <span className="text-white font-medium font-mono">4</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400 text-sm">Sync Status</span>
            <span className="text-green-500 font-medium">Synced</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
}

export const MetricCard: Story = {
  render: () => (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-400 text-sm mb-1">Data Collections</p>
          <p className="text-white text-3xl font-bold">42</p>
        </div>
        <div className="text-green-500 text-sm">+12%</div>
      </div>
    </Card>
  ),
}

export const MultipleCards: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Card 1</CardTitle>
        </CardHeader>
        <CardContent>
          <p>First card content</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Card 2</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Second card content</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Card 3</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Third card content</p>
        </CardContent>
      </Card>
    </div>
  ),
}

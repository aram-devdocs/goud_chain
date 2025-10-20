import type { Meta, StoryObj } from '@storybook/react'
import { PageContainer } from '../PageContainer'
import { Card, CardContent, Button } from '../../index'

const meta = {
  title: 'Templates/PageContainer',
  component: PageContainer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageContainer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Dashboard',
    description: 'Welcome to your GoudChain dashboard',
    children: (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-white mb-2">Card 1</h3>
            <p className="text-zinc-400 text-sm">Some content here</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-white mb-2">Card 2</h3>
            <p className="text-zinc-400 text-sm">Some content here</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-white mb-2">Card 3</h3>
            <p className="text-zinc-400 text-sm">Some content here</p>
          </CardContent>
        </Card>
      </div>
    ),
  },
}

export const WithoutDescription: Story = {
  args: {
    title: 'Settings',
    children: (
      <Card>
        <CardContent className="p-6">
          <p className="text-zinc-400">Settings panel content</p>
        </CardContent>
      </Card>
    ),
  },
}

export const WithLongTitle: Story = {
  args: {
    title: 'Blockchain Analytics and Performance Monitoring Dashboard',
    description:
      'Real-time metrics, historical data, and comprehensive insights into your blockchain network',
    children: (
      <Card>
        <CardContent className="p-6">
          <p className="text-zinc-400">Dashboard content</p>
        </CardContent>
      </Card>
    ),
  },
}

export const WithActions: Story = {
  args: {
    title: 'Collections',
    description: 'Manage your encrypted data collections',
    children: (
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          <Button>Create Collection</Button>
          <Button>Import Data</Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-zinc-400">Collections table will go here</p>
          </CardContent>
        </Card>
      </div>
    ),
  },
}

export const WithComplexLayout: Story = {
  args: {
    title: 'Network Status',
    description: 'Monitor your blockchain network health and connectivity',
    children: (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <p className="text-xs text-zinc-500 mb-1">Metric {i}</p>
                <p className="text-2xl font-bold text-white">{i * 123}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Detailed View</h3>
            <p className="text-zinc-400">Chart or table content</p>
          </CardContent>
        </Card>
      </div>
    ),
  },
}

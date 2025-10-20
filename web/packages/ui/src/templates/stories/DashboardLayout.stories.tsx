import type { Meta, StoryObj } from '@storybook/react'
import { DashboardLayout } from '../DashboardLayout'
import { Header } from '../../organisms/Header'
import { Card, CardHeader, CardTitle, CardContent } from '../../molecules/Card'
import { Stack } from '../../primitives/Stack'
import { Grid } from '../../primitives/Grid'

const meta = {
  title: 'Templates/DashboardLayout',
  component: DashboardLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DashboardLayout>

export default meta
type Story = StoryObj<typeof meta>

// Simple mock navigation component without router dependencies
const MockNavigation = () => (
  <nav className="border-b border-zinc-800">
    <div className="container mx-auto px-6">
      <div className="flex gap-1 overflow-x-auto">
        {['Dashboard', 'Submit Data', 'Collections', 'Explorer'].map(
          (item, i) => (
            <button
              key={item}
              className={`px-3 py-2 border-b-2 transition whitespace-nowrap text-sm ${
                i === 0
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {item}
            </button>
          )
        )}
      </div>
    </div>
  </nav>
)

export const Default: Story = {
  args: {
    header: (
      <Header
        title="Dashboard"
        subtitle="Blockchain Overview"
        wsConnected={true}
      />
    ),
    navigation: <MockNavigation />,
    children: (
      <Stack direction="vertical" spacing={6}>
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
          <p className="text-zinc-500">Overview of your blockchain activity</p>
        </div>

        <Grid columns={{ sm: 2, md: 3 }} gap={4}>
          <Card>
            <CardHeader>
              <CardTitle>Blockchain</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">1,234</p>
              <p className="text-sm text-zinc-500">Total Blocks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">42</p>
              <p className="text-sm text-zinc-500">Your Data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Network</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">4</p>
              <p className="text-sm text-zinc-500">Connected Peers</p>
            </CardContent>
          </Card>
        </Grid>
      </Stack>
    ),
  },
}

export const WithoutNavigation: Story = {
  args: {
    header: <Header title="Welcome" wsConnected={false} />,
    children: (
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-white mb-4">Welcome</h1>
        <p className="text-zinc-400">Layout without navigation sidebar</p>
      </div>
    ),
  },
}

export const MinimalContent: Story = {
  args: {
    header: <Header title="Page" wsConnected={true} />,
    navigation: <MockNavigation />,
    children: (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-white">Page Content</h1>
      </div>
    ),
  },
}

export const FullPage: Story = {
  args: {
    header: (
      <Header
        title="Analytics"
        subtitle="Performance Metrics"
        wsConnected={true}
      />
    ),
    navigation: <MockNavigation />,
    children: (
      <Stack direction="vertical" spacing={8}>
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-zinc-400">
            Blockchain metrics and performance data
          </p>
        </div>

        <Grid columns={{ sm: 1, md: 2, lg: 4 }} gap={4}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>Metric {i}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{i * 100}</p>
                <p className="text-sm text-zinc-500">Sample data</p>
              </CardContent>
            </Card>
          ))}
        </Grid>
      </Stack>
    ),
  },
}

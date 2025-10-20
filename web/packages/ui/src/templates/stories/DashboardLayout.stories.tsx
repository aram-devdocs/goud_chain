import type { Meta, StoryObj } from '@storybook/react'
import { DashboardLayout } from '../DashboardLayout'
import { Header } from '../../organisms/Header'
import { Navigation } from '../../organisms/Navigation'
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

const mockNavItems = [
  { label: 'Dashboard', href: '/', active: true },
  { label: 'Submit Data', href: '/submit', active: false },
  { label: 'Collections', href: '/collections', active: false },
  { label: 'Explorer', href: '/explorer', active: false },
  { label: 'Analytics', href: '/analytics', active: false },
  { label: 'Network', href: '/network', active: false },
]

export const Default: Story = {
  args: {
    header: <Header />,
    navigation: <Navigation items={mockNavItems} />,
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
    header: <Header />,
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
    header: <Header />,
    navigation: <Navigation items={mockNavItems} />,
    children: (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-white">Page Content</h1>
      </div>
    ),
  },
}

export const FullPage: Story = {
  args: {
    header: <Header />,
    navigation: <Navigation items={mockNavItems} />,
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

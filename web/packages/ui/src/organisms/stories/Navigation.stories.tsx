import type { Meta, StoryObj } from '@storybook/react'
import { Navigation } from '../Navigation'

// Mock TanStack Router dependencies for Storybook
const MockRouterProvider = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>
}

const meta = {
  title: 'Organisms/Navigation',
  component: Navigation,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MockRouterProvider>
        <Story />
      </MockRouterProvider>
    ),
  ],
} satisfies Meta<typeof Navigation>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    items: [
      { id: 'dashboard', label: 'Dashboard', path: '/' },
      { id: 'submit', label: 'Submit Data', path: '/submit' },
      {
        id: 'collections',
        label: 'Collections',
        path: '/collections',
        count: 12,
      },
      { id: 'explorer', label: 'Explorer', path: '/explorer' },
      { id: 'network', label: 'Network', path: '/network' },
      { id: 'audit', label: 'Audit Logs', path: '/audit', count: 250 },
      { id: 'analytics', label: 'Analytics', path: '/analytics' },
    ],
  },
}

export const WithCounts: Story = {
  args: {
    items: [
      { id: 'inbox', label: 'Inbox', path: '/inbox', count: 5 },
      { id: 'pending', label: 'Pending', path: '/pending', count: 23 },
      { id: 'completed', label: 'Completed', path: '/completed', count: 156 },
      { id: 'archived', label: 'Archived', path: '/archived', count: 1042 },
    ],
  },
}

export const FewItems: Story = {
  args: {
    items: [
      { id: 'home', label: 'Home', path: '/' },
      { id: 'settings', label: 'Settings', path: '/settings' },
    ],
  },
}

export const ManyItems: Story = {
  args: {
    items: [
      { id: 'dashboard', label: 'Dashboard', path: '/' },
      { id: 'submit', label: 'Submit Data', path: '/submit' },
      { id: 'collections', label: 'Collections', path: '/collections' },
      { id: 'explorer', label: 'Block Explorer', path: '/explorer' },
      { id: 'network', label: 'Network Status', path: '/network' },
      { id: 'audit', label: 'Audit Logs', path: '/audit' },
      { id: 'analytics', label: 'Analytics', path: '/analytics' },
      { id: 'metrics', label: 'System Metrics', path: '/metrics' },
      { id: 'settings', label: 'Settings', path: '/settings' },
      { id: 'help', label: 'Help', path: '/help' },
    ],
  },
}

export const Empty: Story = {
  args: {
    items: [],
  },
}

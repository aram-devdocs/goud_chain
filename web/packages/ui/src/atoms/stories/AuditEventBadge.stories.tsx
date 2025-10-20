import type { Meta, StoryObj } from '@storybook/react'
import { AuditEventBadge } from '../AuditEventBadge'

const meta = {
  title: 'Atoms/AuditEventBadge',
  component: AuditEventBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    eventType: {
      control: 'select',
      options: [
        'AccountCreated',
        'Login',
        'DataSubmit',
        'DataListed',
        'DataDecrypt',
      ],
    },
  },
} satisfies Meta<typeof AuditEventBadge>

export default meta
type Story = StoryObj<typeof meta>

export const AccountCreated: Story = {
  args: {
    eventType: 'AccountCreated',
  },
}

export const Login: Story = {
  args: {
    eventType: 'Login',
  },
}

export const DataSubmit: Story = {
  args: {
    eventType: 'DataSubmit',
  },
}

export const DataListed: Story = {
  args: {
    eventType: 'DataListed',
  },
}

export const DataDecrypt: Story = {
  args: {
    eventType: 'DataDecrypt',
  },
}

export const AllEvents: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <AuditEventBadge eventType="AccountCreated" />
      <AuditEventBadge eventType="Login" />
      <AuditEventBadge eventType="DataSubmit" />
      <AuditEventBadge eventType="DataListed" />
      <AuditEventBadge eventType="DataDecrypt" />
    </div>
  ),
}

export const InContext: Story = {
  render: () => (
    <div className="w-96 space-y-3">
      {/* Simulating audit log entries */}
      <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <AuditEventBadge eventType="AccountCreated" />
          <span className="text-xs text-zinc-500 font-mono">12:34:56</span>
        </div>
        <div className="text-sm text-zinc-300 font-mono">evt_1a2b3c4d5e6f</div>
      </div>

      <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <AuditEventBadge eventType="Login" />
          <span className="text-xs text-zinc-500 font-mono">12:35:12</span>
        </div>
        <div className="text-sm text-zinc-300 font-mono">evt_2b3c4d5e6f7g</div>
      </div>

      <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <AuditEventBadge eventType="DataSubmit" />
          <span className="text-xs text-zinc-500 font-mono">12:36:45</span>
        </div>
        <div className="text-sm text-zinc-300 font-mono">evt_3c4d5e6f7g8h</div>
      </div>
    </div>
  ),
}

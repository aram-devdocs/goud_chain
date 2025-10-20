import type { Meta, StoryObj } from '@storybook/react'
import { RealTimeAuditStream } from '../RealTimeAuditStream'
import { mockAuditLogs } from '../../__mocks__/data'

const meta = {
  title: 'Organisms/RealTimeAuditStream',
  component: RealTimeAuditStream,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RealTimeAuditStream>

export default meta
type Story = StoryObj<typeof meta>

const events = mockAuditLogs(50)

export const Default: Story = {
  args: {
    events: events.slice(0, 10),
  },
}

export const ManyEvents: Story = {
  args: {
    events: events.slice(0, 50),
  },
}

export const FewEvents: Story = {
  args: {
    events: events.slice(0, 3),
  },
}

export const Empty: Story = {
  args: {
    events: [],
  },
}

export const OnlyLoginEvents: Story = {
  args: {
    events: events.filter((e) => e.event_type === 'Login').slice(0, 15),
  },
}

export const OnlyDataEvents: Story = {
  args: {
    events: events
      .filter(
        (e) =>
          e.event_type === 'DataSubmit' ||
          e.event_type === 'DataDecrypt' ||
          e.event_type === 'DataListed'
      )
      .slice(0, 20),
  },
}

export const MixedEventTypes: Story = {
  args: {
    events: [
      ...events.filter((e) => e.event_type === 'AccountCreated').slice(0, 2),
      ...events.filter((e) => e.event_type === 'Login').slice(0, 5),
      ...events.filter((e) => e.event_type === 'DataSubmit').slice(0, 8),
      ...events.filter((e) => e.event_type === 'DataDecrypt').slice(0, 3),
    ]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 18),
  },
}

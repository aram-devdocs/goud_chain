import type { Meta, StoryObj } from '@storybook/react'
import { HistoricalAuditTable } from '../HistoricalAuditTable'
import type { AuditFilters } from '../HistoricalAuditTable'
import { mockAuditLogs } from '../../__mocks__/data'

const meta = {
  title: 'Organisms/HistoricalAuditTable',
  component: HistoricalAuditTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HistoricalAuditTable>

export default meta
type Story = StoryObj<typeof meta>

const events = mockAuditLogs(50)

export const Default: Story = {
  args: {
    events: events.slice(0, 20),
    isLoading: false,
    onApplyFilters: (filters: AuditFilters) =>
      console.log('Apply filters', filters),
    onExportCSV: () => console.log('Export CSV'),
  },
}

export const Loading: Story = {
  args: {
    events: [],
    isLoading: true,
    onApplyFilters: (filters: AuditFilters) =>
      console.log('Apply filters', filters),
    onExportCSV: () => console.log('Export CSV'),
  },
}

export const Empty: Story = {
  args: {
    events: [],
    isLoading: false,
    onApplyFilters: (filters: AuditFilters) =>
      console.log('Apply filters', filters),
    onExportCSV: () => console.log('Export CSV'),
  },
}

export const SmallDataset: Story = {
  args: {
    events: events.slice(0, 3),
    isLoading: false,
    onApplyFilters: (filters: AuditFilters) =>
      console.log('Apply filters', filters),
    onExportCSV: () => console.log('Export CSV'),
  },
}

export const LargeDataset: Story = {
  args: {
    events,
    isLoading: false,
    onApplyFilters: (filters: AuditFilters) =>
      console.log('Apply filters', filters),
    onExportCSV: () => console.log('Export CSV'),
  },
}

export const OnlyAccountCreated: Story = {
  args: {
    events: events
      .filter((e) => e.event_type === 'AccountCreated')
      .slice(0, 10),
    isLoading: false,
    onApplyFilters: (filters: AuditFilters) =>
      console.log('Apply filters', filters),
    onExportCSV: () => console.log('Export CSV'),
  },
}

export const OnlyDataSubmit: Story = {
  args: {
    events: events.filter((e) => e.event_type === 'DataSubmit').slice(0, 15),
    isLoading: false,
    onApplyFilters: (filters: AuditFilters) =>
      console.log('Apply filters', filters),
    onExportCSV: () => console.log('Export CSV'),
  },
}

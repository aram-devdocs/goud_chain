import type { Meta, StoryObj } from '@storybook/react'
import { Table, Thead, Tbody, Tr, Th, Td } from '../Table'

const meta = {
  title: 'Atoms/Table',
  component: Table,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Table>
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Email</Th>
          <Th>Role</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td>John Doe</Td>
          <Td>john@example.com</Td>
          <Td>Admin</Td>
        </Tr>
        <Tr>
          <Td>Jane Smith</Td>
          <Td>jane@example.com</Td>
          <Td>User</Td>
        </Tr>
        <Tr>
          <Td>Bob Johnson</Td>
          <Td>bob@example.com</Td>
          <Td>User</Td>
        </Tr>
      </Tbody>
    </Table>
  ),
}

export const Striped: Story = {
  render: () => (
    <Table striped>
      <Thead>
        <Tr>
          <Th>Block #</Th>
          <Th>Timestamp</Th>
          <Th>Hash</Th>
          <Th>Data Count</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td className="font-mono">1234</Td>
          <Td className="text-zinc-400">2 minutes ago</Td>
          <Td className="font-mono text-xs">0x1a2b3c...</Td>
          <Td>5</Td>
        </Tr>
        <Tr>
          <Td className="font-mono">1233</Td>
          <Td className="text-zinc-400">5 minutes ago</Td>
          <Td className="font-mono text-xs">0x4d5e6f...</Td>
          <Td>3</Td>
        </Tr>
        <Tr>
          <Td className="font-mono">1232</Td>
          <Td className="text-zinc-400">8 minutes ago</Td>
          <Td className="font-mono text-xs">0x7g8h9i...</Td>
          <Td>7</Td>
        </Tr>
        <Tr>
          <Td className="font-mono">1231</Td>
          <Td className="text-zinc-400">12 minutes ago</Td>
          <Td className="font-mono text-xs">0xjk1l2m...</Td>
          <Td>2</Td>
        </Tr>
      </Tbody>
    </Table>
  ),
}

export const AuditLogs: Story = {
  render: () => (
    <Table>
      <Thead>
        <Tr>
          <Th>Timestamp</Th>
          <Th>Event Type</Th>
          <Th>IP Hash</Th>
          <Th>Event ID</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td className="font-mono text-xs">2024-01-20 14:23:15</Td>
          <Td>
            <span className="px-2 py-1 text-xs border bg-green-900/20 border-green-700 text-green-400">
              AccountCreated
            </span>
          </Td>
          <Td className="font-mono text-xs text-zinc-400">
            a1b2c3d4e5f6g7h8...
          </Td>
          <Td className="font-mono text-xs">evt_1234567890abcdef...</Td>
        </Tr>
        <Tr>
          <Td className="font-mono text-xs">2024-01-20 14:22:45</Td>
          <Td>
            <span className="px-2 py-1 text-xs border bg-blue-900/20 border-blue-700 text-blue-400">
              AccountLogin
            </span>
          </Td>
          <Td className="font-mono text-xs text-zinc-400">
            i9j8k7l6m5n4o3p2...
          </Td>
          <Td className="font-mono text-xs">evt_fedcba0987654321...</Td>
        </Tr>
      </Tbody>
    </Table>
  ),
}

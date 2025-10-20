import type { Meta, StoryObj } from '@storybook/react'
import { PeerConnectivityTable } from '../PeerConnectivityTable'
import { mockPeers } from '../../__mocks__/data'

const meta = {
  title: 'Organisms/PeerConnectivityTable',
  component: PeerConnectivityTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PeerConnectivityTable>

export default meta
type Story = StoryObj<typeof meta>

const mockPeersData = mockPeers(4).map((peer, idx) => ({
  address: peer.address,
  role: idx === 0 ? 'validator' : 'peer',
  chainLength: 1234 + idx * 10,
  lastSeen: Math.floor(peer.lastSeen / 1000),
  isCurrentValidator: idx === 0,
}))

export const Default: Story = {
  args: {
    peers: mockPeersData,
    localChainLength: 1234,
    onSync: (address: string) => console.log('Sync with', address),
    onCopy: (text: string) => console.log('Copy', text),
  },
}

export const PeerAhead: Story = {
  args: {
    peers: [
      {
        address: 'node-1.goudchain.local:9000',
        role: 'validator',
        chainLength: 1250,
        lastSeen: Math.floor(Date.now() / 1000) - 30,
        isCurrentValidator: true,
      },
    ],
    localChainLength: 1234,
    onSync: (address: string) => console.log('Sync with', address),
    onCopy: (text: string) => console.log('Copy', text),
  },
}

export const ManyPeers: Story = {
  args: {
    peers: mockPeers(15).map((peer, idx) => ({
      address: peer.address,
      role: idx % 3 === 0 ? 'validator' : 'peer',
      chainLength: 1234 + Math.floor(Math.random() * 100),
      lastSeen:
        Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600),
      isCurrentValidator: idx === 0,
    })),
    localChainLength: 1234,
    onSync: (address: string) => console.log('Sync with', address),
    onCopy: (text: string) => console.log('Copy', text),
  },
}

export const Empty: Story = {
  args: {
    peers: [],
    localChainLength: 1234,
    onSync: (address: string) => console.log('Sync with', address),
    onCopy: (text: string) => console.log('Copy', text),
  },
}

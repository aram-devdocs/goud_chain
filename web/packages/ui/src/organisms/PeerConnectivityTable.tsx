import { useState, useMemo } from 'react'

export interface PeerInfo {
  address: string
  role: string
  chainLength?: number
  lastSeen?: number
  isCurrentValidator: boolean
}

export interface PeerConnectivityTableProps {
  peers: PeerInfo[]
  localChainLength: number
  onSync: (peerAddress: string) => void
  onCopy: (text: string) => void
}

type SortField = 'address' | 'role' | 'chainLength' | 'lastSeen'
type SortDirection = 'asc' | 'desc'

function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp
  const seconds = Math.floor(diff)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function PeerConnectivityTable({
  peers,
  localChainLength,
  onSync,
  onCopy,
}: PeerConnectivityTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('role')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSortedPeers = useMemo(() => {
    let filtered = [...peers]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) => p.address.toLowerCase().includes(query) || p.role.toLowerCase().includes(query)
      )
    }

    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'address':
          comparison = a.address.localeCompare(b.address)
          break
        case 'role':
          comparison = a.role.localeCompare(b.role)
          break
        case 'chainLength':
          comparison = (a.chainLength ?? 0) - (b.chainLength ?? 0)
          break
        case 'lastSeen':
          comparison = (a.lastSeen ?? 0) - (b.lastSeen ?? 0)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [peers, searchQuery, sortField, sortDirection])

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return '⇅'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Peer Connectivity</h3>
        <div className="text-sm text-zinc-400">
          Showing {filteredAndSortedPeers.length} of {peers.length} peers
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by address or role..."
          className="w-full bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm focus:outline-none focus:border-zinc-600 rounded"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900/50 border-b border-zinc-800">
              <tr>
                <th
                  onClick={() => handleSort('address')}
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-400 cursor-pointer hover:text-white transition"
                >
                  Peer Address {getSortIndicator('address')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Status</th>
                <th
                  onClick={() => handleSort('role')}
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-400 cursor-pointer hover:text-white transition"
                >
                  Role {getSortIndicator('role')}
                </th>
                <th
                  onClick={() => handleSort('chainLength')}
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-400 cursor-pointer hover:text-white transition"
                >
                  Chain Length {getSortIndicator('chainLength')}
                </th>
                <th
                  onClick={() => handleSort('lastSeen')}
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-400 cursor-pointer hover:text-white transition"
                >
                  Last Sync {getSortIndicator('lastSeen')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredAndSortedPeers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    No peers found
                  </td>
                </tr>
              ) : (
                filteredAndSortedPeers.map((peer) => {
                  const chainDiff = (peer.chainLength ?? 0) - localChainLength
                  const isAhead = chainDiff > 0
                  const isBehind = chainDiff < 0

                  return (
                    <tr key={peer.address} className="hover:bg-zinc-900/50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-white font-mono">{peer.address}</code>
                          <button
                            onClick={() => onCopy(peer.address)}
                            className="text-xs text-blue-400 hover:text-blue-300 transition"
                          >
                            Copy
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2" />
                        <span className="text-xs text-green-400">Connected</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white font-mono">{peer.role}</span>
                          {peer.isCurrentValidator && (
                            <span className="px-2 py-0.5 bg-blue-900/30 border border-blue-700 rounded text-xs text-blue-400">
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white font-mono">
                            {peer.chainLength ?? 'N/A'}
                          </span>
                          {isAhead && (
                            <span className="text-xs text-yellow-400">+{chainDiff}</span>
                          )}
                          {isBehind && <span className="text-xs text-zinc-500">{chainDiff}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-zinc-400">
                          {peer.lastSeen ? formatRelativeTime(peer.lastSeen) : 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isAhead && (
                          <button
                            onClick={() => onSync(peer.address)}
                            className="bg-blue-800 hover:bg-blue-700 px-3 py-1 text-xs border border-blue-700 transition rounded"
                          >
                            Sync
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

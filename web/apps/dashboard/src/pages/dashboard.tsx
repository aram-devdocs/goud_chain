import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useChainInfo, usePeers, useListCollections, useToast } from '@goudchain/hooks'
import { Spinner } from '@goudchain/ui'
import { formatNumber, formatRelativeTime } from '@goudchain/utils'
import { SpinnerSize } from '@goudchain/types'
import { useWebSocketContext } from '../contexts/WebSocketContext'
import type { ActivityEvent } from '../contexts/WebSocketContext'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { error: showErrorToast } = useToast()
  const { isConnected: wsConnected, activityFeed, clearActivityFeed } = useWebSocketContext()
  const [lastUpdated, setLastUpdated] = useState({
    blockchain: Date.now(),
    collections: Date.now(),
    network: Date.now(),
  })

  const {
    data: chainInfo,
    isLoading: chainLoading,
    error: chainError,
  } = useChainInfo()
  const {
    data: peersData,
    isLoading: peersLoading,
    error: peersError,
  } = usePeers()
  const {
    data: collections,
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useListCollections()

  useEffect(() => {
    if (chainError) {
      showErrorToast('Failed to load blockchain data')
    }
    if (peersError) {
      showErrorToast('Failed to load network peers')
    }
    if (collectionsError) {
      showErrorToast('Failed to load collections')
    }
  }, [chainError, peersError, collectionsError, showErrorToast])

  // Update timestamps when data changes
  useEffect(() => {
    if (chainInfo) {
      setLastUpdated((prev) => ({ ...prev, blockchain: Date.now() }))
    }
  }, [chainInfo])

  useEffect(() => {
    if (collections) {
      setLastUpdated((prev) => ({ ...prev, collections: Date.now() }))
    }
  }, [collections])

  useEffect(() => {
    if (peersData) {
      setLastUpdated((prev) => ({ ...prev, network: Date.now() }))
    }
  }, [peersData])

  if (chainLoading || peersLoading || collectionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={SpinnerSize.Large} />
      </div>
    )
  }

  // Show partial data with fallbacks instead of error screen
  const hasError = chainError || peersError || collectionsError

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'blockchain':
        return 'BLOCK'
      case 'collection':
        return 'DATA'
      case 'peer':
        return 'PEER'
      case 'audit':
        return 'AUDIT'
      case 'metrics':
        return 'STATS'
      default:
        return 'INFO'
    }
  }

  const getActivityColor = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'blockchain':
        return 'bg-blue-500/20 text-blue-400'
      case 'collection':
        return 'bg-green-500/20 text-green-400'
      case 'peer':
        return 'bg-purple-500/20 text-purple-400'
      case 'audit':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'metrics':
        return 'bg-zinc-500/20 text-zinc-400'
      default:
        return 'bg-blue-500/20 text-blue-400'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-zinc-500">Overview of your blockchain activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Chain Length */}
        <div className="bg-gradient-to-br from-blue-950/50 to-blue-900/30 rounded-lg p-6 border border-blue-800/50">
          <div className="text-xs text-blue-300 mb-2">BLOCKCHAIN</div>
          <div className="text-4xl font-bold text-blue-400 mb-1">
            {formatNumber(chainInfo?.chain?.length ?? 0)}
          </div>
          <div className="text-xs text-blue-300/60">Total Blocks</div>
          <div className="text-xs text-zinc-500 mt-2">
            Updated {formatRelativeTime(lastUpdated.blockchain)}
          </div>
        </div>

        {/* Collections Count */}
        <div className="bg-gradient-to-br from-green-950/50 to-green-900/30 rounded-lg p-6 border border-green-800/50">
          <div className="text-xs text-green-300 mb-2">COLLECTIONS</div>
          <div className="text-4xl font-bold text-green-400 mb-1">
            {formatNumber(collections?.collections.length ?? 0)}
          </div>
          <div className="text-xs text-green-300/60">Your Data</div>
          <div className="text-xs text-zinc-500 mt-2">
            Updated {formatRelativeTime(lastUpdated.collections)}
          </div>
        </div>

        {/* Peer Count */}
        <div className="bg-gradient-to-br from-purple-950/50 to-purple-900/30 rounded-lg p-6 border border-purple-800/50">
          <div className="text-xs text-purple-300 mb-2">NETWORK</div>
          <div className="text-4xl font-bold text-purple-400 mb-1">
            {formatNumber(peersData?.peers?.length ?? 0)}
          </div>
          <div className="text-xs text-purple-300/60">Connected Peers</div>
          <div className="text-xs text-zinc-500 mt-2">
            Updated {formatRelativeTime(lastUpdated.network)}
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 rounded-lg p-6 border border-zinc-700/50">
          <div className="text-xs text-zinc-300 mb-2">CONNECTION</div>
          <div className={`text-4xl font-bold mb-1 ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
            {wsConnected ? 'Live' : 'Polling'}
          </div>
          <div className="text-xs text-zinc-400">WebSocket Status</div>
          <div className="text-xs text-zinc-500 mt-2">
            {wsConnected ? 'Real-time updates active' : 'Using polling fallback'}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden mb-8">
        <div className="bg-zinc-900/50 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          {activityFeed.length > 0 && (
            <button
              onClick={clearActivityFeed}
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              Clear
            </button>
          )}
        </div>

        <div className="divide-y divide-zinc-800" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {activityFeed.slice(0, 10).map((activity) => (
            <div key={activity.id} className="px-6 py-3 hover:bg-zinc-900/50 transition">
              <div className="flex items-start gap-3">
                <div className={`text-xs font-mono font-bold px-2 py-1 rounded ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{activity.message}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {activityFeed.length === 0 && (
            <div className="px-6 py-12 text-center text-zinc-500">
              <p>No recent activity</p>
              <p className="text-xs mt-1">Events will appear here as they happen</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate({ to: '/submit' })}
          className="bg-white text-black rounded-lg p-4 hover:bg-zinc-200 transition text-left"
        >
          <div className="font-semibold mb-1">Submit Data</div>
          <div className="text-sm text-zinc-700">Create encrypted collection</div>
        </button>

        <button
          onClick={() => navigate({ to: '/collections' })}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800 transition text-left"
        >
          <div className="font-semibold mb-1">Browse Collections</div>
          <div className="text-sm text-zinc-400">View and decrypt your data</div>
        </button>

        <button
          onClick={() => navigate({ to: '/explorer' })}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800 transition text-left"
        >
          <div className="font-semibold mb-1">Explore Blockchain</div>
          <div className="text-sm text-zinc-400">View blocks and analytics</div>
        </button>
      </div>
    </div>
  )
}

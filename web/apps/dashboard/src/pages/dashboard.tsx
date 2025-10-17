import { useEffect } from 'react'
import { useChainInfo, useMetrics, useListCollections, useToast } from '@goudchain/hooks'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
} from '@goudchain/ui'
import { formatNumber, formatRelativeTime } from '@goudchain/utils'
import { SpinnerSize } from '@goudchain/types'
import { useWebSocketContext } from '../contexts/WebSocketContext'

export default function DashboardPage() {
  const { error: showErrorToast } = useToast()
  const { isConnected: wsConnected } = useWebSocketContext()
  const {
    data: chainInfo,
    isLoading: chainLoading,
    error: chainError,
  } = useChainInfo()
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useMetrics()
  const {
    data: collections,
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useListCollections()

  useEffect(() => {
    if (chainError) {
      showErrorToast('Failed to load blockchain data')
    }
    if (metricsError) {
      showErrorToast('Failed to load metrics')
    }
    if (collectionsError) {
      showErrorToast('Failed to load collections')
    }
  }, [chainError, metricsError, collectionsError, showErrorToast])

  if (chainLoading || metricsLoading || collectionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={SpinnerSize.Large} />
      </div>
    )
  }

  // Show partial data with fallbacks instead of error screen
  const hasError = chainError || metricsError || collectionsError

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
        </div>

        {/* Collections Count */}
        <div className="bg-gradient-to-br from-green-950/50 to-green-900/30 rounded-lg p-6 border border-green-800/50">
          <div className="text-xs text-green-300 mb-2">COLLECTIONS</div>
          <div className="text-4xl font-bold text-green-400 mb-1">
            {formatNumber(collections?.collections.length ?? 0)}
          </div>
          <div className="text-xs text-green-300/60">Your Data</div>
        </div>

        {/* Peer Count */}
        <div className="bg-gradient-to-br from-purple-950/50 to-purple-900/30 rounded-lg p-6 border border-purple-800/50">
          <div className="text-xs text-purple-300 mb-2">NETWORK</div>
          <div className="text-4xl font-bold text-purple-400 mb-1">
            {formatNumber(metrics?.network?.peer_count ?? 0)}
          </div>
          <div className="text-xs text-purple-300/60">Connected Peers</div>
        </div>

        {/* Connection Status */}
        <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 rounded-lg p-6 border border-zinc-700/50">
          <div className="text-xs text-zinc-300 mb-2">CONNECTION</div>
          <div className={`text-4xl font-bold mb-1 ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
            {wsConnected ? 'Live' : 'Offline'}
          </div>
          <div className="text-xs text-zinc-400">WebSocket Status</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest Block</CardTitle>
        </CardHeader>
        <CardContent>
          {chainInfo?.chain && chainInfo.chain.length > 0 ? (
            (() => {
              const latestBlock = chainInfo.chain[chainInfo.chain.length - 1]!
              return (
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Block Number:</span>
                    <span className="text-white">
                      {latestBlock.block_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Timestamp:</span>
                    <span className="text-white">
                      {formatRelativeTime(latestBlock.timestamp)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Data Count:</span>
                    <span className="text-white">
                      {latestBlock.data_count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Validator:</span>
                    <span className="text-white truncate max-w-xs">
                      {latestBlock.validator}
                    </span>
                  </div>
                </div>
              )
            })()
          ) : (
            <p className="text-zinc-500">No blocks yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

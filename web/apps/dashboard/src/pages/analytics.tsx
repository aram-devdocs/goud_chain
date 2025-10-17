import { useChainInfo, useMetrics, useListCollections } from '@goudchain/hooks'
import { Card, CardHeader, CardTitle, CardContent, Spinner } from '@goudchain/ui'
import { SpinnerSize } from '@goudchain/types'
import { formatNumber, formatRelativeTime } from '@goudchain/utils'

export default function AnalyticsPage() {
  const { data: chainInfo, isLoading: chainLoading } = useChainInfo()
  const { data: metrics, isLoading: metricsLoading } = useMetrics()
  const { data: collectionsData, isLoading: collectionsLoading } = useListCollections()

  if (chainLoading || metricsLoading || collectionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={SpinnerSize.Large} />
      </div>
    )
  }

  const blocks = chainInfo?.chain ?? []
  const totalDataCount = blocks.reduce((sum, block) => sum + (block?.data_count ?? 0), 0)
  const avgDataPerBlock = blocks.length > 0 ? totalDataCount / blocks.length : 0

  // Calculate blocks created in the last hour
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  const recentBlocks = blocks.filter(b => b?.timestamp && b.timestamp > oneHourAgo)

  // Get latest 10 blocks for timeline
  const latestBlocks = [...blocks].slice(-10).reverse()

  // Collection statistics with null safety
  const collections = collectionsData?.collections ?? []
  const totalCollections = collections.length
  const totalItems = collections.reduce((sum, c) => sum + (c?.data_count ?? 0), 0)
  const avgItemsPerCollection = totalCollections > 0 ? totalItems / totalCollections : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Analytics</h2>
        <p className="text-zinc-500">Blockchain analytics and visualizations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Total Blocks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white font-mono">
              {formatNumber(blocks.length)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Total Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white font-mono">
              {formatNumber(totalDataCount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Avg Data/Block</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white font-mono">
              {avgDataPerBlock.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Blocks (1h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white font-mono">
              {formatNumber(recentBlocks.length)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Collections Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Total Collections</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {formatNumber(totalCollections)}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-400 mb-1">Total Items</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {formatNumber(totalItems)}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-400 mb-1">Avg Items/Collection</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {avgItemsPerCollection.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-zinc-400">Cache Hit Rate</span>
                <span className="text-sm font-mono text-white">
                  {((metrics?.performance?.cache_hit_rate ?? 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all"
                  style={{
                    width: `${(metrics?.performance?.cache_hit_rate ?? 0) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                <p className="text-sm text-zinc-400 mb-1">Total Operations</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {formatNumber(metrics?.performance?.operations_total ?? 0)}
                </p>
              </div>
              <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                <p className="text-sm text-zinc-400 mb-1">Network Peers</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {formatNumber(metrics?.network?.peer_count ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Block Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Blocks</CardTitle>
        </CardHeader>
        <CardContent>
          {latestBlocks.length > 0 ? (
            <div className="space-y-2">
              {latestBlocks.map((block) => (
                <div
                  key={block.block_number}
                  className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-mono text-white">
                        Block #{block.block_number}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {formatRelativeTime(block.timestamp)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-zinc-400">Data Count</p>
                      <p className="text-sm font-mono text-white">{block.data_count}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-400">Validator</p>
                      <p className="text-xs font-mono text-zinc-400">
                        {block.validator.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">No blocks yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

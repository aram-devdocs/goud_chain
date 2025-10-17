import { useChainInfo, useMetrics, useListCollections } from '@goudchain/hooks'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
} from '@goudchain/ui'
import { formatNumber, formatRelativeTime } from '@goudchain/utils'
import { SpinnerSize } from '@goudchain/types'

export default function DashboardPage() {
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

  if (chainLoading || metricsLoading || collectionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={SpinnerSize.Large} />
      </div>
    )
  }

  if (chainError || metricsError || collectionsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-400">
          <p className="text-lg font-semibold mb-2">
            Failed to load dashboard data
          </p>
          <p className="text-sm text-zinc-500">
            {(chainError || metricsError || collectionsError)?.toString()}
          </p>
        </div>
      </div>
    )
  }

  if (!chainInfo || !metrics || !collections) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={SpinnerSize.Large} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-zinc-500">Overview of your blockchain activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">
              Chain Length
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {formatNumber(chainInfo?.chain_length ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {formatNumber(collections?.collections.length ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Peer Count</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {formatNumber(metrics?.network.peer_count ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest Block</CardTitle>
        </CardHeader>
        <CardContent>
          {chainInfo?.latest_block ? (
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Block Number:</span>
                <span className="text-white">
                  {chainInfo.latest_block.block_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Timestamp:</span>
                <span className="text-white">
                  {formatRelativeTime(chainInfo.latest_block.timestamp)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Data Count:</span>
                <span className="text-white">
                  {chainInfo.latest_block.data_count}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Validator:</span>
                <span className="text-white truncate max-w-xs">
                  {chainInfo.latest_block.validator}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-zinc-500">No blocks yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { useMetrics } from '@goudchain/hooks'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
} from '@goudchain/ui'
import { formatNumber, formatDate } from '@goudchain/utils'
import { SpinnerSize } from '@goudchain/types'

export default function MetricsPage() {
  const { data, isLoading } = useMetrics()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={SpinnerSize.Large} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">System Metrics</h2>
        <p className="text-zinc-500">Real-time system performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">
              Chain Length
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white font-mono">
              {formatNumber(data?.chain.length ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Peer Count</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white font-mono">
              {formatNumber(data?.network.peer_count ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">
              Operations Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white font-mono">
              {formatNumber(data?.performance.operations_total ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-zinc-400">Cache Hit Rate</span>
              <span className="text-sm font-mono text-white">
                {((data?.performance.cache_hit_rate ?? 0) * 100).toFixed(2)}%
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{
                  width: `${(data?.performance.cache_hit_rate ?? 0) * 100}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latest Block Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 font-mono text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Block Number:</span>
            <span className="text-white">
              {data?.chain.latest_block_number ?? 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Block Timestamp:</span>
            <span className="text-white">
              {data?.chain.latest_block_timestamp
                ? formatDate(data.chain.latest_block_timestamp)
                : 'N/A'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

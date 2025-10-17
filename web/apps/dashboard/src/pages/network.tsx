import { usePeers, useMetrics } from '@goudchain/hooks'
import { Card, CardHeader, CardTitle, CardContent, Spinner } from '@goudchain/ui'
import { SpinnerSize } from '@goudchain/types'
import { formatNumber } from '@goudchain/utils'

export default function NetworkPage() {
  const { data: peers, isLoading: peersLoading } = usePeers()
  const { data: metrics, isLoading: metricsLoading } = useMetrics()

  if (peersLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={SpinnerSize.Large} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Network</h2>
        <p className="text-zinc-500">P2P network status and peer information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Connected Peers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white font-mono">
              {formatNumber(peers?.count ?? 0)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">P2P Network Peers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Peer Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white font-mono">
              {formatNumber(peers?.peers?.length ?? 0)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Available Addresses</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Peer List</CardTitle>
          <p className="text-xs text-zinc-500 mt-1">
            Reputation: <span className="text-green-500">Positive</span> = Trusted,
            <span className="text-zinc-400"> Neutral (0)</span> = Unknown,
            <span className="text-red-500"> Negative</span> = Suspicious
          </p>
        </CardHeader>
        <CardContent>
          {peers?.peers && peers.peers.length > 0 ? (
            <div className="space-y-2">
              {peers.peers.map((peer) => {
                const reputation = peers?.reputation?.[peer] ?? 0
                const reputationColor =
                  reputation > 0
                    ? 'text-green-500'
                    : reputation < 0
                      ? 'text-red-500'
                      : 'text-zinc-400'

                return (
                  <div
                    key={peer}
                    className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-800"
                  >
                    <code className="text-sm text-white font-mono">{peer}</code>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-zinc-400">Reputation:</span>
                      <span className={`text-sm font-mono font-bold ${reputationColor}`}>
                        {reputation > 0 ? `+${reputation}` : reputation}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-zinc-500">No peers connected</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

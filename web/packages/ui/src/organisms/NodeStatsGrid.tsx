export interface NodeStats {
  nodeId: string
  chainLength: number
  latestBlockAge: string
  isValidator: boolean
  nextValidatorTurn?: string
  syncStatus: string
  blocksBehind?: number
}

export interface NodeStatsGridProps {
  stats: NodeStats
}

function formatRelativeTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function NodeStatsGrid({ stats }: NodeStatsGridProps) {
  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-4">Node Information</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
          <div className="text-xs text-zinc-300 mb-1">This Node ID</div>
          <div className="text-sm font-bold text-white font-mono break-all">
            {stats.nodeId.substring(0, 12)}...
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-950/50 to-blue-900/30 rounded-lg p-4 border border-blue-800/50">
          <div className="text-xs text-blue-300 mb-1">Chain Length</div>
          <div className="text-2xl font-bold text-blue-400">{stats.chainLength}</div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
          <div className="text-xs text-zinc-300 mb-1">Latest Block</div>
          <div className="text-sm font-bold text-white">{stats.latestBlockAge}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-950/50 to-purple-900/30 rounded-lg p-4 border border-purple-800/50">
          <div className="text-xs text-purple-300 mb-1">Validator Status</div>
          <div className="text-sm font-bold text-white">
            {stats.isValidator ? (
              <div>
                <div className="text-purple-400">Active</div>
                {stats.nextValidatorTurn && (
                  <div className="text-xs text-purple-300 mt-1">{stats.nextValidatorTurn}</div>
                )}
              </div>
            ) : (
              <div className="text-zinc-400">Observer</div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-950/50 to-green-900/30 rounded-lg p-4 border border-green-800/50">
          <div className="text-xs text-green-300 mb-1">Sync Status</div>
          <div className="text-sm font-bold text-white">
            {stats.blocksBehind === 0 || !stats.blocksBehind ? (
              <span className="text-green-400">Up to date</span>
            ) : (
              <div>
                <span className="text-yellow-400">{stats.blocksBehind} behind</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
          <div className="text-xs text-zinc-300 mb-1">Network</div>
          <div className="text-sm font-bold text-white">PoA</div>
          <div className="text-xs text-zinc-400">Proof of Authority</div>
        </div>
      </div>
    </div>
  )
}

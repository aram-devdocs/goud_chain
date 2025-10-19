export interface NetworkHealth {
  status: 'connected' | 'disconnected'
  syncStatus: 'synced' | 'syncing' | 'behind'
  peerCount: number
  currentValidator: string
  isThisNodeValidator: boolean
  healthScore: number
}

export interface NetworkHealthCardProps {
  health: NetworkHealth
  nodeId: string
}

export function NetworkHealthCard({ health, nodeId }: NetworkHealthCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'synced':
        return 'text-green-400'
      case 'syncing':
        return 'text-yellow-400'
      case 'disconnected':
      case 'behind':
        return 'text-red-400'
      default:
        return 'text-zinc-400'
    }
  }

  const getStatusBg = (score: number) => {
    if (score >= 80) return 'bg-green-900/20 border-green-700'
    if (score >= 50) return 'bg-yellow-900/20 border-yellow-700'
    return 'bg-red-900/20 border-red-700'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className={`rounded-lg p-6 border ${getStatusBg(health.healthScore)}`}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Network Health</h3>
          <p className="text-xs text-zinc-400">P2P connectivity and synchronization status</p>
        </div>
        <div className="text-right">
          <div className="flex items-baseline gap-2">
            <div className={`text-4xl font-bold ${getScoreColor(health.healthScore)}`}>
              {health.healthScore}
            </div>
            <div className="text-zinc-400">/100</div>
          </div>
          <div className="text-xs text-zinc-500 mt-1">Health Score</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <div className="text-xs text-zinc-400 mb-1">Network Status</div>
          <div className={`text-sm font-medium ${getStatusColor(health.status)}`}>
            {health.status === 'connected' ? '● Connected' : '○ Disconnected'}
          </div>
        </div>

        <div>
          <div className="text-xs text-zinc-400 mb-1">Sync Status</div>
          <div className={`text-sm font-medium ${getStatusColor(health.syncStatus)}`}>
            {health.syncStatus === 'synced' && '✓ In Sync'}
            {health.syncStatus === 'syncing' && '⟳ Syncing'}
            {health.syncStatus === 'behind' && '⚠ Behind'}
          </div>
        </div>

        <div>
          <div className="text-xs text-zinc-400 mb-1">Connected Peers</div>
          <div className="text-sm font-medium text-white">{health.peerCount}</div>
        </div>

        <div>
          <div className="text-xs text-zinc-400 mb-1">Current Validator</div>
          <div className="text-sm font-medium text-white font-mono">{health.currentValidator}</div>
        </div>

        <div>
          <div className="text-xs text-zinc-400 mb-1">This Node Role</div>
          <div className="text-sm font-medium text-white">
            {health.isThisNodeValidator ? (
              <span className="px-2 py-1 bg-blue-900/30 border border-blue-700 rounded text-xs text-blue-400">
                Validator
              </span>
            ) : (
              'Observer'
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

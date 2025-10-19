export interface NetworkActionsProps {
  onSyncAll: () => void
  onRefresh: () => void
  isSyncing: boolean
  isRefreshing: boolean
}

export function NetworkActions({
  onSyncAll,
  onRefresh,
  isSyncing,
  isRefreshing,
}: NetworkActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-zinc-400 mb-1">Network Management</h3>
        <p className="text-xs text-zinc-500">
          Trigger blockchain synchronization with all connected peers
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onSyncAll}
          disabled={isSyncing}
          className="bg-blue-800 hover:bg-blue-700 px-4 py-2 text-sm font-medium border border-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed rounded"
        >
          {isSyncing ? 'Syncing...' : 'Sync All Peers'}
        </button>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-sm font-medium border border-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed rounded"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  )
}

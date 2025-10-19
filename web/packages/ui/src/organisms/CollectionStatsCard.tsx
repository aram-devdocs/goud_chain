export interface CollectionStats {
  totalCollections: number
  totalItems: number
  avgItemsPerCollection: number
  largestCollectionSize: number
}

export interface CollectionStatsCardProps {
  stats: CollectionStats
}

export function CollectionStatsCard({ stats }: CollectionStatsCardProps) {
  return (
    <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        Collection Statistics
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1">Total Collections</div>
            <div className="text-2xl font-bold text-green-400 font-mono">
              {stats.totalCollections}
            </div>
          </div>

          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1">Total Items</div>
            <div className="text-2xl font-bold text-green-400 font-mono">
              {stats.totalItems}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Avg Items/Collection</span>
            <span className="text-sm font-mono font-bold text-white">
              {stats.avgItemsPerCollection.toFixed(1)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Largest Collection</span>
            <span className="text-sm font-mono font-bold text-white">
              {stats.largestCollectionSize} items
            </span>
          </div>
        </div>

        {stats.totalCollections === 0 && (
          <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded text-center">
            <p className="text-xs text-zinc-500">No collections created yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

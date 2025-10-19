export interface ActivityBlock {
  index: number
  timestamp: number
  dataCount: number
  validator: string
  hasData: boolean
}

export interface RecentActivityTimelineProps {
  blocks: ActivityBlock[]
  maxBlocks?: number
}

function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp
  const seconds = Math.floor(diff)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function RecentActivityTimeline({ blocks, maxBlocks = 20 }: RecentActivityTimelineProps) {
  const displayBlocks = blocks.slice(0, maxBlocks)

  return (
    <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Recent Activity</h3>
        <span className="text-xs text-zinc-400">
          Showing {displayBlocks.length} of {blocks.length} blocks
        </span>
      </div>

      {displayBlocks.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          No recent activity
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {displayBlocks.map((block) => (
            <div
              key={block.index}
              className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 hover:bg-zinc-900 transition group"
            >
              <div className="flex items-center gap-4">
                {/* Status indicator */}
                <div
                  className={`w-2 h-2 rounded-full ${
                    block.hasData ? 'bg-green-400' : 'bg-zinc-600'
                  }`}
                  title={block.hasData ? 'Contains data' : 'Empty block'}
                />

                {/* Block info */}
                <div className="flex flex-col">
                  <span className="text-sm font-mono text-white">Block #{block.index}</span>
                  <span className="text-xs text-zinc-400">{formatRelativeTime(block.timestamp)}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Data count */}
                <div className="text-right">
                  <p className="text-xs text-zinc-400">Data</p>
                  <p className="text-sm font-mono text-white">{block.dataCount}</p>
                </div>

                {/* Validator */}
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-zinc-400">Validator</p>
                  <p className="text-xs font-mono text-zinc-300">
                    {block.validator.substring(0, 12)}...
                  </p>
                </div>

                {/* Size estimate */}
                <div className="text-right hidden md:block">
                  <p className="text-xs text-zinc-400">Size</p>
                  <p className="text-xs font-mono text-zinc-300">~2.5KB</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

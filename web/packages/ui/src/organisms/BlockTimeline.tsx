import { type Block } from '@goudchain/types'
import { type ChangeEvent } from 'react'

export interface BlockTimelineProps {
  blocks: Block[]
  selectedBlockNumber: number | null
  onSelectBlock: (blockNumber: number) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  filterBy: 'all' | 'with_data' | 'empty'
  onFilterChange: (filter: 'all' | 'with_data' | 'empty') => void
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString()
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp * 1000
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function BlockTimeline({
  blocks,
  selectedBlockNumber,
  onSelectBlock,
  searchQuery,
  onSearchChange,
  filterBy,
  onFilterChange,
}: BlockTimelineProps) {
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value)
  }

  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onFilterChange(e.target.value as 'all' | 'with_data' | 'empty')
  }

  // Filter blocks
  const filteredBlocks = blocks.filter((block) => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matches =
        block.index.toString().includes(query) ||
        block.validator.toLowerCase().includes(query) ||
        block.previous_hash.toLowerCase().includes(query)
      if (!matches) return false
    }

    // Apply data filter
    if (filterBy === 'with_data' && block.data_count === 0) return false
    if (filterBy === 'empty' && block.data_count > 0) return false

    return true
  })

  return (
    <div className="space-y-4">
      {/* Search and Filter Toolbar */}
      <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by block number, hash, or validator..."
              className="w-full bg-black border border-zinc-800 px-4 py-2 text-sm focus:outline-none focus:border-zinc-600"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={filterBy}
              onChange={handleFilterChange}
              className="w-full bg-black border border-zinc-800 px-4 py-2 text-sm focus:outline-none focus:border-zinc-600"
            >
              <option value="all">All Blocks</option>
              <option value="with_data">With Data</option>
              <option value="empty">Empty Blocks</option>
            </select>
          </div>
        </div>
        <div className="mt-2 text-xs text-zinc-400">
          Showing {filteredBlocks.length} of {blocks.length} blocks
        </div>
      </div>

      {/* Block List */}
      <div className="space-y-3">
        {filteredBlocks.length === 0 ? (
          <div className="bg-zinc-900 rounded-lg p-12 text-center border border-zinc-800">
            <p className="text-zinc-500">No blocks match your search.</p>
          </div>
        ) : (
          filteredBlocks.map((block) => {
            const isSelected = selectedBlockNumber === block.index
            return (
              <button
                key={block.index}
                onClick={() => onSelectBlock(block.index)}
                className={`w-full text-left bg-zinc-900 rounded-lg p-4 border transition ${
                  isSelected
                    ? 'border-blue-500 bg-blue-950/20'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-blue-400">
                      Block #{block.index}
                    </div>
                    {block.data_count > 0 && (
                      <div className="px-2 py-1 bg-green-900/30 border border-green-700 rounded text-xs text-green-400">
                        {block.data_count} {block.data_count === 1 ? 'item' : 'items'}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {formatRelativeTime(block.timestamp)}
                  </div>
                </div>

                <div className="text-xs text-zinc-400 space-y-1">
                  <div className="font-mono">
                    Validator: {block.validator.substring(0, 16)}...
                  </div>
                  <div className="font-mono">
                    Hash: {block.previous_hash.substring(0, 16)}...
                  </div>
                  <div>
                    {formatTimestamp(block.timestamp)}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

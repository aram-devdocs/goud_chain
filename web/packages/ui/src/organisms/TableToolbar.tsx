import { type ChangeEvent } from 'react'

export type SortOption = 'newest' | 'oldest' | 'label' | 'block'

export interface TableToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  totalCount: number
  selectedCount: number
  onBulkDecrypt?: () => void
  onBulkExport?: () => void
  onClearSelections?: () => void
  isDecrypting?: boolean
}

export function TableToolbar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  totalCount,
  selectedCount,
  onBulkDecrypt,
  onBulkExport,
  onClearSelections,
  isDecrypting = false,
}: TableToolbarProps) {
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value)
  }

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value as SortOption)
  }

  return (
    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by label or ID..."
            className="w-full bg-black border border-zinc-800 px-4 py-2 text-sm focus:outline-none focus:border-zinc-600"
          />
        </div>
        <div>
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="w-full bg-black border border-zinc-800 px-4 py-2 text-sm focus:outline-none focus:border-zinc-600"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="label">Label A-Z</option>
            <option value="block">Block Number</option>
          </select>
        </div>
        <div className="flex items-center justify-end gap-2">
          {selectedCount > 0 ? (
            <>
              {onBulkDecrypt && (
                <button
                  onClick={onBulkDecrypt}
                  disabled={isDecrypting}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDecrypting ? 'Decrypting...' : `Decrypt (${selectedCount})`}
                </button>
              )}
              {onBulkExport && (
                <button
                  onClick={onBulkExport}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 text-sm transition"
                >
                  Export
                </button>
              )}
              {onClearSelections && (
                <button
                  onClick={onClearSelections}
                  className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-sm transition"
                >
                  Clear
                </button>
              )}
            </>
          ) : (
            <span className="text-sm text-zinc-400">
              Total: <span className="text-blue-400 font-bold">{totalCount}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

import { type ChangeEvent } from 'react'

// Inline formatDate to avoid circular dependency with utils package
function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString()
}

export interface Collection {
  collection_id: string
  label: string
  user_id: string
  blind_index: string
  created_at: number
  block_number: number
  data_count: number
}

export interface CollectionsTableProps {
  collections: Collection[]
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
  onToggleAll: () => void
  decryptedData: Map<string, string>
  expandedRows: Set<string>
  onDecrypt: (id: string) => void
  onHide: (id: string) => void
  onCopy: (text: string, label: string) => void
  onDownload: (label: string, data: string) => void
  isDecrypting: boolean
}

export function CollectionsTable({
  collections,
  selectedIds,
  onToggleSelection,
  onToggleAll,
  decryptedData,
  expandedRows,
  onDecrypt,
  onHide,
  onCopy,
  onDownload,
  isDecrypting,
}: CollectionsTableProps) {
  const allSelected =
    collections.length > 0 &&
    collections.every((c) => selectedIds.has(c.collection_id))
  const someSelected =
    collections.some((c) => selectedIds.has(c.collection_id)) && !allSelected

  const handleCheckboxChange =
    (id: string) => (e: ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation()
      onToggleSelection(id)
    }

  if (collections.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-lg p-12 text-center border border-zinc-800">
        <p className="text-zinc-500">No collections match your search.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {collections.map((collection) => {
        const isSelected = selectedIds.has(collection.collection_id)
        const isExpanded = expandedRows.has(collection.collection_id)
        const decrypted = decryptedData.get(collection.collection_id)

        return (
          <div
            key={collection.collection_id}
            className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 hover:border-zinc-700 transition"
          >
            <div className="flex items-start gap-4">
              {/* Selection Checkbox */}
              <div className="pt-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={handleCheckboxChange(collection.collection_id)}
                  className="w-4 h-4 bg-black border-zinc-700 rounded"
                />
              </div>

              {/* Collection Info */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-blue-400">
                      {collection.label}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 font-mono">
                      ID: {collection.collection_id.substring(0, 16)}...
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Block #{collection.block_number} •{' '}
                      {formatDate(collection.created_at)}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        onCopy(collection.collection_id, 'Collection ID')
                      }
                      className="text-zinc-400 hover:text-blue-400 text-sm transition"
                    >
                      Copy ID
                    </button>
                  </div>
                </div>

                {/* Decrypt Section */}
                {!decrypted && (
                  <button
                    onClick={() => onDecrypt(collection.collection_id)}
                    disabled={isDecrypting}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDecrypting ? 'Decrypting...' : 'Decrypt Data'}
                  </button>
                )}

                {/* Decrypted Data */}
                {decrypted && isExpanded && (
                  <div className="bg-green-900/20 border border-green-700 rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-green-400 text-sm font-bold">
                        Decrypted Data:
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onCopy(decrypted, 'Decrypted data')}
                          className="text-xs text-blue-400 hover:text-blue-300 transition"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() =>
                            onDownload(collection.label, decrypted)
                          }
                          className="text-xs text-purple-400 hover:text-purple-300 transition"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                    <pre className="bg-zinc-950 rounded p-3 overflow-x-auto text-xs text-white">
                      {JSON.stringify(JSON.parse(decrypted), null, 2)}
                    </pre>
                    <button
                      onClick={() => onHide(collection.collection_id)}
                      className="mt-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-1 text-xs transition"
                    >
                      Hide
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

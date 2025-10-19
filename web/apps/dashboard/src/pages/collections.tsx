import { useState, useMemo } from 'react'
import { useListCollections, useDecryptData, useToast } from '@goudchain/hooks'
import {
  TableToolbar,
  CollectionsTable,
  Spinner,
  type SortOption,
} from '@goudchain/ui'
import { SpinnerSize } from '@goudchain/types'

export default function CollectionsPage() {
  const { data, isLoading } = useListCollections()
  const { mutateAsync: decryptData, isPending: isDecrypting } = useDecryptData()
  const { success, error: showErrorToast } = useToast()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [decryptedData, setDecryptedData] = useState<Map<string, string>>(
    new Map()
  )
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  // Filter and sort collections
  const filteredAndSortedCollections = useMemo(() => {
    if (!data?.collections) return []

    let filtered = [...data.collections]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.label.toLowerCase().includes(query) ||
          c.collection_id.toLowerCase().includes(query)
      )
    }

    // Apply sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.created_at - a.created_at)
        break
      case 'oldest':
        filtered.sort((a, b) => a.created_at - b.created_at)
        break
      case 'label':
        filtered.sort((a, b) => a.label.localeCompare(b.label))
        break
      case 'block':
        filtered.sort((a, b) => a.block_number - b.block_number)
        break
    }

    return filtered
  }, [data?.collections, searchQuery, sortBy])

  const handleToggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleToggleAll = () => {
    if (selectedIds.size === filteredAndSortedCollections.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(
        new Set(filteredAndSortedCollections.map((c) => c.collection_id))
      )
    }
  }

  const handleDecrypt = async (id: string) => {
    try {
      const result = await decryptData(id)
      setDecryptedData((prev) => new Map(prev).set(id, result.data))
      setExpandedRows((prev) => new Set(prev).add(id))
      success('Data decrypted successfully')
    } catch (err) {
      showErrorToast(
        `Failed to decrypt: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    }
  }

  const handleBulkDecrypt = async () => {
    const promises = Array.from(selectedIds).map((id) => handleDecrypt(id))
    await Promise.allSettled(promises)
  }

  const handleHide = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      success(`${label} copied to clipboard`)
    } catch {
      showErrorToast('Failed to copy to clipboard')
    }
  }

  const handleDownload = (label: string, data: string) => {
    const blob = new Blob([JSON.stringify(JSON.parse(data), null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${label}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    success('Collection downloaded')
  }

  const handleBulkExport = () => {
    const exportData = Array.from(selectedIds)
      .map((id) => {
        const collection = data?.collections.find((c) => c.collection_id === id)
        if (!collection) return null
        return {
          collection_id: id,
          label: collection.label,
          created_at: collection.created_at,
          block_number: collection.block_number,
          decrypted_data: decryptedData.get(id)
            ? JSON.parse(decryptedData.get(id)!)
            : null,
        }
      })
      .filter(Boolean)

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'goud-collections-export.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    success('Collections exported')
  }

  const handleClearSelections = () => {
    setSelectedIds(new Set())
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={SpinnerSize.Large} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            My Encrypted Collections
          </h2>
          <p className="text-zinc-500">Your encrypted data collections</p>
        </div>
      </div>

      {!data?.collections || data.collections.length === 0 ? (
        <div className="bg-zinc-900 rounded-lg p-12 text-center border border-zinc-800">
          <p className="text-zinc-500">
            No collections yet. Submit some data to get started!
          </p>
        </div>
      ) : (
        <>
          <TableToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            totalCount={data.collections.length}
            selectedCount={selectedIds.size}
            onBulkDecrypt={handleBulkDecrypt}
            onBulkExport={handleBulkExport}
            onClearSelections={handleClearSelections}
            isDecrypting={isDecrypting}
          />
          <CollectionsTable
            collections={filteredAndSortedCollections}
            selectedIds={selectedIds}
            onToggleSelection={handleToggleSelection}
            onToggleAll={handleToggleAll}
            decryptedData={decryptedData}
            expandedRows={expandedRows}
            onDecrypt={handleDecrypt}
            onHide={handleHide}
            onCopy={handleCopy}
            onDownload={handleDownload}
            isDecrypting={isDecrypting}
          />
        </>
      )}
    </div>
  )
}

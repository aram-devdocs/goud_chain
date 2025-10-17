import { useListCollections } from '@workspace/hooks'
import { Card, CardHeader, CardTitle, CardContent, Spinner } from '@workspace/ui'
import { formatDate, formatNumber } from '@workspace/utils'

export default function CollectionsPage() {
  const { data, isLoading } = useListCollections()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Collections</h2>
        <p className="text-zinc-500">Your encrypted data collections</p>
      </div>

      {data?.collections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-zinc-500">No collections yet. Submit some data to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.collections.map((collection) => (
            <Card key={collection.collection_id}>
              <CardHeader>
                <CardTitle className="text-lg truncate">{collection.collection_id}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Data Count:</span>
                  <span className="text-white font-mono">
                    {formatNumber(collection.data_count)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Created:</span>
                  <span className="text-white font-mono text-xs">
                    {formatDate(collection.created_at)}
                  </span>
                </div>
                <div className="text-zinc-500 text-xs break-all">
                  <span>Blind Index:</span>
                  <code className="block mt-1 p-1 bg-zinc-900 rounded">
                    {collection.blind_index.slice(0, 16)}...
                  </code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

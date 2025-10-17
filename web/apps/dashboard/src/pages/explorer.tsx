import { useChainInfo } from '@goudchain/hooks'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
} from '@goudchain/ui'
import { formatHash, formatRelativeTime } from '@goudchain/utils'
import { SpinnerSize } from '@goudchain/types'

export default function ExplorerPage() {
  const { data: chainInfo, isLoading } = useChainInfo()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={SpinnerSize.Large} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Blockchain Explorer
        </h2>
        <p className="text-zinc-500">Explore blocks and chain data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chain Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-400">Chain Length</p>
              <p className="text-2xl font-bold text-white font-mono">
                {chainInfo?.chain?.length ?? 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Total Data Count</p>
              <p className="text-2xl font-bold text-white font-mono">
                {chainInfo?.chain?.reduce((sum, block) => sum + (block?.data_count ?? 0), 0) ?? 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {chainInfo?.chain && chainInfo.chain.length > 0 && (() => {
        const latestBlock = chainInfo.chain[chainInfo.chain.length - 1]!
        return (
          <Card>
            <CardHeader>
              <CardTitle>Latest Block</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 font-mono text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-zinc-400">Block Number</p>
                    <p className="text-white">
                      {latestBlock.block_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400">Timestamp</p>
                    <p className="text-white">
                      {formatRelativeTime(latestBlock.timestamp)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-zinc-400">Previous Hash</p>
                  <code className="block p-2 bg-zinc-900 rounded text-xs break-all text-white">
                    {formatHash(latestBlock.previous_hash, 16)}
                  </code>
                </div>

                <div>
                  <p className="text-zinc-400">Merkle Root</p>
                  <code className="block p-2 bg-zinc-900 rounded text-xs break-all text-white">
                    {formatHash(latestBlock.merkle_root, 16)}
                  </code>
                </div>

                <div>
                  <p className="text-zinc-400">Validator</p>
                  <code className="block p-2 bg-zinc-900 rounded text-xs break-all text-white">
                    {formatHash(latestBlock.validator, 16)}
                  </code>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-zinc-400">Data Count</p>
                    <p className="text-white">
                      {latestBlock.data_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400">Signature</p>
                    <code className="text-xs text-white">
                      {formatHash(latestBlock.signature, 12)}
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })()}
    </div>
  )
}

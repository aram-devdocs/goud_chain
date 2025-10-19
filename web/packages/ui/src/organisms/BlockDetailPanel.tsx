import { type Block } from '@goudchain/types'

export interface BlockDetailPanelProps {
  block: Block
  blockIndex: number
  totalBlocks: number
  onCopy: (text: string, label: string) => void
  onPrevious?: () => void
  onNext?: () => void
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString()
}

export function BlockDetailPanel({
  block,
  blockIndex,
  totalBlocks,
  onCopy,
  onPrevious,
  onNext,
}: BlockDetailPanelProps) {
  return (
    <div className="bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-900/50 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Block #{block.index}</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Block {blockIndex + 1} of {totalBlocks}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPrevious}
            disabled={!onPrevious}
            className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-sm border border-zinc-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <button
            onClick={onNext}
            disabled={!onNext}
            className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-sm border border-zinc-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Core Information */}
        <div>
          <h4 className="text-sm font-bold text-white mb-3">Core Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-zinc-400 mb-1">Timestamp</div>
              <div className="text-white font-mono">{formatTimestamp(block.timestamp)}</div>
              <div className="text-xs text-zinc-500 mt-1">{block.timestamp} (Unix)</div>
            </div>
            <div>
              <div className="text-zinc-400 mb-1">Data Count</div>
              <div className="text-white font-mono">{block.data_count}</div>
            </div>
          </div>
        </div>

        {/* Cryptographic Data */}
        <div>
          <h4 className="text-sm font-bold text-white mb-3">Cryptographic Verification</h4>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-zinc-400 text-xs">Previous Hash</div>
                <button
                  onClick={() => onCopy(block.previous_hash, 'Previous hash')}
                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  Copy
                </button>
              </div>
              <code className="block p-2 bg-black border border-zinc-800 rounded text-xs text-white break-all">
                {block.previous_hash}
              </code>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-zinc-400 text-xs">Merkle Root</div>
                <button
                  onClick={() => onCopy(block.merkle_root, 'Merkle root')}
                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  Copy
                </button>
              </div>
              <code className="block p-2 bg-black border border-zinc-800 rounded text-xs text-white break-all">
                {block.merkle_root}
              </code>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-zinc-400 text-xs">Validator</div>
                <button
                  onClick={() => onCopy(block.validator, 'Validator')}
                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  Copy
                </button>
              </div>
              <code className="block p-2 bg-black border border-zinc-800 rounded text-xs text-white break-all">
                {block.validator}
              </code>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-zinc-400 text-xs">Signature</div>
                <button
                  onClick={() => onCopy(block.signature, 'Signature')}
                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  Copy
                </button>
              </div>
              <code className="block p-2 bg-black border border-zinc-800 rounded text-xs text-white break-all">
                {block.signature}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
